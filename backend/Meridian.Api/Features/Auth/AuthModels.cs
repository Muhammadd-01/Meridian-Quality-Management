using System.ComponentModel.DataAnnotations;
using Meridian.Api.Features.Users;
using Meridian.Api.Infrastructure.Supabase;

namespace Meridian.Api.Features.Auth;

public sealed class RegisterRequest : IValidatableObject
{
    [Required, StringLength(120)] public string FullName { get; init; } = string.Empty;
    [Required, StringLength(200)] public string Company { get; init; } = string.Empty;
    [StringLength(100)] public string? Role { get; init; }
    [Required, EmailAddress, StringLength(320)] public string Email { get; init; } = string.Empty;

    /// <summary>8–72 characters using at least three of: lower case, upper case, digit, symbol.</summary>
    [Required, StringLength(72, MinimumLength = 8)] public string Password { get; init; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(FullName)) yield return new ValidationResult("Enter your full name.", ["fullName"]);
        if (string.IsNullOrWhiteSpace(Company)) yield return new ValidationResult("Enter your company.", ["company"]);

        var classes = new[]
        {
            Password.Any(char.IsLower),
            Password.Any(char.IsUpper),
            Password.Any(char.IsDigit),
            Password.Any(c => !char.IsLetterOrDigit(c)),
        }.Count(x => x);
        if (classes < 3)
            yield return new ValidationResult("Use at least three of: lower case, upper case, a number, a symbol.", ["password"]);
    }
}

public sealed class LoginRequest
{
    [Required, EmailAddress, StringLength(320)] public string Email { get; init; } = string.Empty;
    [Required, StringLength(72, MinimumLength = 6)] public string Password { get; init; } = string.Empty;
}

public sealed class RefreshRequest
{
    [Required, StringLength(2048)] public string RefreshToken { get; init; } = string.Empty;
}

public sealed class EmailRequest
{
    [Required, EmailAddress, StringLength(320)] public string Email { get; init; } = string.Empty;
}

/// <param name="Role">Job title entered at sign-up (e.g. "Quality Manager").</param>
/// <param name="AccessRole">CRM role: Admin, CEO, Manager or Employee (null while the account is inactive).</param>
public sealed record AuthUser(
    Guid Id,
    string Email,
    string FullName,
    string? Company,
    string? Role,
    bool EmailConfirmed,
    DateTimeOffset? CreatedAt,
    DateTimeOffset? LastSignInAt,
    string? AccessRole = null,
    bool IsActive = false,
    string? AvatarUrl = null)
{
    public static AuthUser From(GoTrueUser user, Profile? profile = null)
    {
        var email = user.Email ?? string.Empty;
        var fullName = NonEmpty(profile?.FullName) ?? user.Metadata("full_name") ?? user.Metadata("name") ?? email.Split('@')[0];
        var jobTitle = NonEmpty(profile?.JobTitle) ?? user.Metadata("role");
        return new AuthUser(user.Id, email, fullName, user.Metadata("company"), jobTitle,
            user.EmailConfirmedAt is not null, user.CreatedAt, user.LastSignInAt,
            profile?.EffectiveRole, profile?.IsActive ?? false, NonEmpty(profile?.AvatarUrl));
    }

    private static string? NonEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;
}

public sealed record AuthSession(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    long ExpiresAt,
    AuthUser User)
{
    public static AuthSession From(GoTrueSession session, Profile? profile = null) => new(
        session.AccessToken,
        session.RefreshToken,
        session.TokenType,
        session.ExpiresIn,
        session.ExpiresAt ?? DateTimeOffset.UtcNow.AddSeconds(session.ExpiresIn).ToUnixTimeSeconds(),
        AuthUser.From(session.User, profile));
}

/// <summary>
/// Sign-up result. When the Supabase project requires email confirmation there
/// is no session yet: the user must click the link in their inbox, then sign in.
/// </summary>
/// <param name="RequiresApproval">Signed up, but an Admin or CEO must activate the account before it can be used.</param>
public sealed record RegisterResponse(bool RequiresEmailConfirmation, AuthUser? User, AuthSession? Session, bool RequiresApproval = false);
