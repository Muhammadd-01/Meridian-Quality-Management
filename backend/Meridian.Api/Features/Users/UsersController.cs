using System.ComponentModel.DataAnnotations;
using Meridian.Api.Features.Auth;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meridian.Api.Features.Users;

public sealed class CreateUserRequest : IValidatableObject
{
    [Required, StringLength(120)] public string FullName { get; init; } = string.Empty;
    [Required, EmailAddress, StringLength(320)] public string Email { get; init; } = string.Empty;
    [Required, StringLength(72, MinimumLength = 8)] public string Password { get; init; } = string.Empty;
    [Required] public string Role { get; init; } = AppRoles.Employee;
    [StringLength(120)] public string? JobTitle { get; init; }

    [RegularExpression(AppRoles.PhonePattern, ErrorMessage = "Enter the phone number in international format, e.g. +923001234567.")]
    public string? Phone { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(FullName)) yield return new ValidationResult("Enter the person's full name.", ["fullName"]);
        if (AppRoles.Normalize(Role) is null) yield return new ValidationResult($"Role must be one of: {string.Join(", ", AppRoles.All)}.", ["role"]);
        var classes = new[]
        {
            Password.Any(char.IsLower), Password.Any(char.IsUpper), Password.Any(char.IsDigit), Password.Any(c => !char.IsLetterOrDigit(c)),
        }.Count(x => x);
        if (classes < 3) yield return new ValidationResult("Use at least three of: lower case, upper case, a number, a symbol.", ["password"]);
    }
}

public sealed class UpdateUserRequest : IValidatableObject
{
    public string? Role { get; init; }
    public bool? IsActive { get; init; }
    [StringLength(120)] public string? FullName { get; init; }
    [StringLength(120)] public string? JobTitle { get; init; }

    /// <summary>Empty string clears the number.</summary>
    [RegularExpression(@"^$|" + AppRoles.PhonePattern, ErrorMessage = "Enter the phone number in international format, e.g. +923001234567.")]
    public string? Phone { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Role is not null && AppRoles.Normalize(Role) is null)
            yield return new ValidationResult($"Role must be one of: {string.Join(", ", AppRoles.All)}.", ["role"]);
        if (FullName is not null && string.IsNullOrWhiteSpace(FullName))
            yield return new ValidationResult("Name cannot be empty.", ["fullName"]);
    }
}

/// <param name="RequiresEmailConfirmation">The new user must click the link in the confirmation email before signing in.</param>
public sealed record CreateUserResponse(Profile User, bool RequiresEmailConfirmation);

/// <summary>
/// Team members and their CRM roles. Admin, CEO and Manager can see the list;
/// only Admin and CEO can create users or change roles and status.
/// </summary>
[ApiController]
[Authorize]
[Route("api/users")]
[Produces("application/json")]
public sealed class UsersController(ProfileStore profiles, CurrentUser currentUser, SupabaseRestClient db, ILogger<UsersController> logger)
    : ControllerBase
{
    [HttpGet]
    [RequireRole(AppRoles.Admin, AppRoles.Ceo, AppRoles.Manager)]
    public async Task<ActionResult<IReadOnlyList<Profile>>> List(CancellationToken ct) => Ok(await profiles.ListAsync(ct));

    /// <summary>
    /// Creates a confirmed account with the chosen role (database function
    /// <c>admin_create_user</c>, Admin/CEO only). No email is sent, so Supabase's
    /// email limit never blocks it; the person can sign in straight away.
    /// </summary>
    [HttpPost]
    [RequireRole(AppRoles.Admin, AppRoles.Ceo)]
    public async Task<ActionResult<CreateUserResponse>> Create(CreateUserRequest request, CancellationToken ct)
    {
        var role = AppRoles.Normalize(request.Role)!;
        Profile? created;
        try
        {
            created = await db.RpcAsync<Profile>("admin_create_user", new Dictionary<string, object?>
            {
                ["p_email"] = request.Email.Trim().ToLowerInvariant(),
                ["p_password"] = request.Password,
                ["p_full_name"] = request.FullName.Trim(),
                ["p_role"] = role,
                ["p_job_title"] = request.JobTitle?.Trim() ?? string.Empty,
                ["p_phone"] = request.Phone?.Trim() ?? string.Empty,
            }, ct);
        }
        catch (SupabaseException e) when (e.Code is "23505")
        {
            return AlreadyExists();
        }
        catch (SupabaseException e) when (e.Code is "PGRST202" or "42883")
        {
            return NotSetUp();
        }
        if (created is null) return NotSetUp();

        logger.LogInformation("User {UserId} created with role {Role} by {ActorId}", created.Id, role, currentUser.Id);
        return StatusCode(StatusCodes.Status201Created, new CreateUserResponse(created, RequiresEmailConfirmation: false));
    }

    /// <summary>Permanently deletes an account (Admin/CEO; not your own). Records they created are kept.</summary>
    [HttpDelete("{id:guid}")]
    [RequireRole(AppRoles.Admin, AppRoles.Ceo)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (id == currentUser.Id)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "You cannot delete your own account.");
        try
        {
            await db.RpcAsync<object>("admin_delete_user", new Dictionary<string, object?> { ["p_user_id"] = id }, ct);
        }
        catch (SupabaseException e) when (e.Code is "P0002")
        {
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "No user with that id was found.");
        }
        catch (SupabaseException e) when (e.Code is "PGRST202" or "42883")
        {
            return NotSetUp();
        }
        logger.LogInformation("User {UserId} permanently deleted by {ActorId}", id, currentUser.Id);
        return NoContent();
    }

    [HttpPatch("{id:guid}")]
    [RequireRole(AppRoles.Admin, AppRoles.Ceo)]
    public async Task<ActionResult<Profile>> Update(Guid id, UpdateUserRequest request, CancellationToken ct)
    {
        if (id == currentUser.Id && (request.Role is not null || request.IsActive is not null))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "You cannot change your own role or status. Ask another Admin or CEO.");

        var target = await profiles.GetAsync(id, ct);
        if (target is null) return Problem(statusCode: StatusCodes.Status404NotFound, title: "No user with that id was found.");

        var newRole = AppRoles.Normalize(request.Role);
        if (newRole is not null && newRole != target.AppRole && !target.IsActive)
            return Problem(statusCode: StatusCodes.Status409Conflict,
                title: $"{(string.IsNullOrWhiteSpace(target.FullName) ? "This account" : target.FullName)} is deactivated. Activate the account before changing its role.",
                extensions: new Dictionary<string, object?> { ["code"] = "user_inactive" });

        var changes = new Dictionary<string, object?>();
        if (newRole is not null && newRole != target.AppRole) changes["app_role"] = newRole;
        if (request.IsActive is not null) changes["is_active"] = request.IsActive;
        if (request.FullName is not null) changes["full_name"] = request.FullName.Trim();
        if (request.JobTitle is not null) changes["job_title"] = request.JobTitle.Trim();
        if (request.Phone is not null) changes["phone"] = request.Phone.Trim();
        if (changes.Count == 0) return Ok(target);

        var updated = await profiles.PatchAsync(id, changes, ct);
        if (updated is null) return Problem(statusCode: StatusCodes.Status404NotFound, title: "No user with that id was found.");

        logger.LogInformation("User {UserId} updated ({Fields}) by {ActorId}", id, string.Join(", ", changes.Keys), currentUser.Id);
        return Ok(updated);
    }

    private ObjectResult NotSetUp() =>
        Problem(statusCode: StatusCodes.Status503ServiceUnavailable,
            title: "User management isn't set up yet. Run supabase/users-update.sql in the Supabase SQL Editor.");

    private ObjectResult AlreadyExists() =>
        Problem(statusCode: StatusCodes.Status409Conflict, title: "An account with this email already exists.");
}
