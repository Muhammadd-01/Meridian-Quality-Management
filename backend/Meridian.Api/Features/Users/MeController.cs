using System.ComponentModel.DataAnnotations;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Meridian.Api.Features.Auth;

namespace Meridian.Api.Features.Users;

public sealed class UpdateMyProfileRequest : IValidatableObject
{
    [StringLength(120)] public string? FullName { get; init; }
    [StringLength(120)] public string? JobTitle { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (FullName is not null && string.IsNullOrWhiteSpace(FullName))
            yield return new ValidationResult("Your name cannot be empty.", ["fullName"]);
    }
}

public sealed class ChangePasswordRequest : IValidatableObject
{
    [Required, RegularExpression(@"^\s*\d{6,10}\s*$", ErrorMessage = "Enter the code from the email (digits only).")]
    public string Code { get; init; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8, ErrorMessage = "The new password must be 8 to 72 characters.")]
    public string NewPassword { get; init; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var classes = new[]
        {
            NewPassword.Any(char.IsLower), NewPassword.Any(char.IsUpper), NewPassword.Any(char.IsDigit), NewPassword.Any(c => !char.IsLetterOrDigit(c)),
        }.Count(x => x);
        if (classes < 3) yield return new ValidationResult("Use at least three of: lower case, upper case, a number, a symbol.", ["newPassword"]);
    }
}

/// <summary>The signed-in user's own profile: name, job title, photo and password.</summary>
[ApiController]
[Authorize]
[RequireRole]
[Route("api/users/me")]
[Produces("application/json")]
public sealed class MeController(
    ProfileStore profiles,
    CurrentUser currentUser,
    SupabaseStorageClient storage,
    SupabaseAuthClient auth,
    SupabaseRestClient db,
    ILogger<MeController> logger)
    : ControllerBase
{
    public const string AvatarBucket = "avatars";
    public const int MaxAvatarBytes = 2 * 1024 * 1024;

    private static readonly Dictionary<string, string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = "jpg",
        ["image/png"] = "png",
        ["image/webp"] = "webp",
    };

    [HttpGet]
    public async Task<ActionResult<Profile>> Get(CancellationToken ct) => Ok(await currentUser.ProfileAsync(ct));

    [HttpPatch]
    public async Task<ActionResult<Profile>> Update(UpdateMyProfileRequest request, CancellationToken ct)
    {
        var changes = new Dictionary<string, object?>();
        if (request.FullName is not null) changes["full_name"] = request.FullName.Trim();
        if (request.JobTitle is not null) changes["job_title"] = request.JobTitle.Trim();
        if (changes.Count == 0) return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Nothing to change.");
        return Ok(await profiles.PatchAsync(currentUser.Id!.Value, changes, ct));
    }

    /// <summary>Step 1 of a password change: emails a one-time code to the signed-in user.</summary>
    [HttpPost("password/code")]
    [EnableRateLimiting(AuthController.RateLimitPolicy)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> SendPasswordCode(CancellationToken ct)
    {
        await auth.SendReauthenticationCodeAsync(BearerToken(), ct);
        return Accepted();
    }

    /// <summary>Step 2: the emailed code plus the new password. The code is checked before anything changes.</summary>
    [HttpPost("password")]
    [EnableRateLimiting(AuthController.RateLimitPolicy)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        var code = request.Code.Trim();
        bool valid;
        try
        {
            valid = await db.RpcAsync<bool>("verify_reauthentication_code", new Dictionary<string, object?> { ["code"] = code }, ct);
        }
        catch (SupabaseException e) when (e.Code is "PGRST202" or "42883")
        {
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Password change isn't set up yet. Run supabase/users-update.sql in the Supabase SQL Editor.");
        }
        if (!valid)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "That code is wrong or has expired. Check the latest email or send a new code.",
                extensions: new Dictionary<string, object?> { ["code"] = "invalid_code" });

        try
        {
            await auth.UpdatePasswordAsync(BearerToken(), request.NewPassword, code, ct);
        }
        catch (SupabaseException e) when (e.Code is "same_password")
        {
            return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, title: "The new password must be different from your current one.");
        }
        catch (SupabaseException e) when (e.Code is "weak_password")
        {
            return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, title: "That password is too weak. Use a longer one with letters, numbers and a symbol.");
        }
        catch (SupabaseException e) when (e.Code is "reauthentication_not_valid" or "reauthentication_needed")
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "That code is wrong or has expired. Check the latest email or send a new code.");
        }

        try
        {
            await db.RpcAsync<object>("clear_reauthentication_code", new Dictionary<string, object?>(), ct);
        }
        catch (SupabaseException e)
        {
            logger.LogWarning("Could not clear the used password code ({Code})", e.Code);
        }
        logger.LogInformation("User {UserId} changed their password", currentUser.Id);
        return NoContent();
    }

    private string BearerToken() =>
        SupabaseUserTokenHandler.BearerToken(HttpContext) ?? throw new UnauthorizedAccessException();

    /// <summary>Uploads a new profile photo (JPEG, PNG or WebP, up to 2 MB) and replaces the old one.</summary>
    [HttpPut("avatar")]
    [RequestSizeLimit(MaxAvatarBytes + 64 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<Profile>> UploadAvatar(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Choose an image to upload.");
        if (file.Length > MaxAvatarBytes)
            return Problem(statusCode: StatusCodes.Status413PayloadTooLarge, title: "That image is larger than 2 MB. Please choose a smaller one.");
        if (!AllowedTypes.TryGetValue(file.ContentType ?? string.Empty, out var extension))
            return Problem(statusCode: StatusCodes.Status415UnsupportedMediaType, title: "Use a JPEG, PNG or WebP image.");

        byte[] bytes;
        using (var buffer = new MemoryStream())
        {
            await file.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }
        if (!LooksLike(extension, bytes))
            return Problem(statusCode: StatusCodes.Status415UnsupportedMediaType, title: "That file isn't a valid image.");

        var userId = currentUser.Id!.Value;
        var previous = (await currentUser.ProfileAsync(ct))?.AvatarUrl;
        // A new name per upload, so browsers never show a cached old photo.
        var path = $"{userId}/{DateTimeOffset.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8]}.{extension}";

        try
        {
            await storage.UploadAsync(AvatarBucket, path, bytes, file.ContentType!, ct);
        }
        catch (SupabaseException e) when (e.StatusCode is System.Net.HttpStatusCode.NotFound or System.Net.HttpStatusCode.BadRequest)
        {
            logger.LogWarning("Avatar upload failed ({Code}): {Message}", e.Code, e.Message);
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Profile photos are not set up yet. Run supabase/profiles-update.sql in the Supabase SQL Editor.");
        }

        Profile? updated;
        try
        {
            updated = await profiles.PatchAsync(userId, new Dictionary<string, object?> { ["avatar_url"] = storage.PublicUrl(AvatarBucket, path) }, ct);
        }
        catch
        {
            await TryDeleteAsync(path, ct); // don't leave an orphaned file behind
            throw;
        }

        if (storage.PathFromPublicUrl(AvatarBucket, previous) is { } oldPath && oldPath.StartsWith($"{userId}/", StringComparison.Ordinal))
            await TryDeleteAsync(oldPath, ct);
        return Ok(updated);
    }

    [HttpDelete("avatar")]
    public async Task<ActionResult<Profile>> RemoveAvatar(CancellationToken ct)
    {
        var userId = currentUser.Id!.Value;
        var previous = (await currentUser.ProfileAsync(ct))?.AvatarUrl;
        var updated = await profiles.PatchAsync(userId, new Dictionary<string, object?> { ["avatar_url"] = string.Empty }, ct);
        if (storage.PathFromPublicUrl(AvatarBucket, previous) is { } oldPath && oldPath.StartsWith($"{userId}/", StringComparison.Ordinal))
            await TryDeleteAsync(oldPath, ct);
        return Ok(updated);
    }

    private async Task TryDeleteAsync(string path, CancellationToken ct)
    {
        try
        {
            await storage.DeleteAsync(AvatarBucket, [path], ct);
        }
        catch (SupabaseException e)
        {
            logger.LogWarning("Could not delete old avatar {Path} ({Code})", path, e.Code);
        }
    }

    /// <summary>Checks the file's first bytes, so a renamed non-image is rejected.</summary>
    internal static bool LooksLike(string extension, byte[] b) => extension switch
    {
        "jpg" => b.Length > 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF,
        "png" => b.Length > 8 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47,
        "webp" => b.Length > 12 && b[0] == (byte)'R' && b[1] == (byte)'I' && b[2] == (byte)'F' && b[3] == (byte)'F'
                  && b[8] == (byte)'W' && b[9] == (byte)'E' && b[10] == (byte)'B' && b[11] == (byte)'P',
        _ => false,
    };
}
