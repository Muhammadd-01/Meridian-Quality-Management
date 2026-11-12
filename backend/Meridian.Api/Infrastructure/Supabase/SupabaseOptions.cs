using System.ComponentModel.DataAnnotations;

namespace Meridian.Api.Infrastructure.Supabase;

/// <summary>
/// Connection settings for the Supabase project. Only the public (anon) key is
/// needed: every data call carries the signed-in user's JWT, so Postgres Row
/// Level Security decides what each request may read or write.
/// </summary>
public sealed class SupabaseOptions
{
    public const string SectionName = "Supabase";

    [Required, Url]
    public string Url { get; init; } = string.Empty;

    [Required]
    public string AnonKey { get; init; } = string.Empty;

    /// <summary>
    /// Optional. Lets Admins/CEOs create users who can sign in straight away
    /// (no confirmation email). Server-side secret: set it with
    /// <c>dotnet user-secrets set "Supabase:ServiceRoleKey" "..."</c> or the
    /// <c>Supabase__ServiceRoleKey</c> environment variable — never in appsettings.json.
    /// Without it, new users are created through normal sign-up and must confirm their email.
    /// </summary>
    public string? ServiceRoleKey { get; init; }

    /// <summary>Where the confirmation / password-reset emails send the user back to.</summary>
    public string? EmailRedirectUrl { get; init; }

    public string BaseUrl => Url.TrimEnd('/');
    public string AuthUrl => $"{BaseUrl}/auth/v1";
    public string RestUrl => $"{BaseUrl}/rest/v1";
}
