using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;

namespace Meridian.Api.Features.Auth;

/// <summary>
/// Two-step sign-in: after the password is checked the browser receives a
/// short-lived, tamper-proof "challenge" naming the user. The emailed code is
/// only accepted together with that challenge, so the code step can never be
/// used without first passing the password step.
/// </summary>
public sealed class OtpChallenges(IDataProtectionProvider provider)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    private readonly ITimeLimitedDataProtector _protector =
        provider.CreateProtector("Meridian.Auth.EmailOtp.v1").ToTimeLimitedDataProtector();

    public string Create(Guid userId, string email) => _protector.Protect($"{userId:N}|{email}", Lifetime);

    /// <summary>Null when the challenge is expired, tampered with or malformed.</summary>
    public (Guid UserId, string Email)? Read(string challenge)
    {
        try
        {
            var parts = _protector.Unprotect(challenge).Split('|', 2);
            return parts.Length == 2 && Guid.TryParseExact(parts[0], "N", out var id) ? (id, parts[1]) : null;
        }
        catch (CryptographicException)
        {
            return null;
        }
    }

    /// <summary>"muhammad@gmail.com" → "mu******@gmail.com" (shown on the code screen).</summary>
    public static string Mask(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 0) return email;
        var visible = Math.Min(2, at);
        return email[..visible] + new string('*', Math.Max(3, at - visible)) + email[at..];
    }
}

/// <summary>Returned by sign-in when an emailed code is required before a session is issued.</summary>
/// <param name="CodeLength">Digits in the code (Supabase → Authentication → Email OTP length).</param>
public sealed record OtpChallengeResponse(bool OtpRequired, string Challenge, string Email, int ExpiresIn, int CodeLength);

public sealed class VerifyOtpRequest
{
    [Required, StringLength(4096)] public string Challenge { get; init; } = string.Empty;

    [Required, RegularExpression(@"^\s*\d{6,10}\s*$", ErrorMessage = "Enter the code from the email (digits only).")]
    public string Code { get; init; } = string.Empty;
}

public sealed class ResendOtpRequest
{
    [Required, StringLength(4096)] public string Challenge { get; init; } = string.Empty;
}
