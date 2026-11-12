using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace Meridian.Api.Infrastructure.Supabase;

/// <summary>Typed client for Supabase Auth (GoTrue): sign-up, password sign-in, refresh, sign-out, recovery.</summary>
public sealed class SupabaseAuthClient(HttpClient http, IOptions<SupabaseOptions> options)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private string? RedirectQuery =>
        string.IsNullOrWhiteSpace(options.Value.EmailRedirectUrl) ? null : $"redirect_to={Uri.EscapeDataString(options.Value.EmailRedirectUrl)}";

    /// <summary>
    /// Creates the user. Returns a session when the project auto-confirms emails,
    /// otherwise only the (unconfirmed) user — a confirmation email is sent.
    /// </summary>
    public async Task<(GoTrueSession? Session, GoTrueUser? User)> SignUpAsync(
        string email, string password, IDictionary<string, string> metadata, CancellationToken ct)
    {
        var url = RedirectQuery is null ? "signup" : $"signup?{RedirectQuery}";
        using var response = await SendAsync(HttpMethod.Post, url, new { email, password, data = metadata }, null, ct);
        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

        // With auto-confirm GoTrue returns a session; otherwise it returns the user object itself.
        if (doc.RootElement.TryGetProperty("access_token", out _))
            return (doc.RootElement.Deserialize<GoTrueSession>(Json), null);
        return (null, doc.RootElement.Deserialize<GoTrueUser>(Json));
    }

    public bool CanCreateConfirmedUsers => !string.IsNullOrWhiteSpace(options.Value.ServiceRoleKey);

    /// <summary>Creates an already-confirmed user with the service-role key (see <see cref="SupabaseOptions.ServiceRoleKey"/>).</summary>
    public async Task<GoTrueUser> AdminCreateUserAsync(string email, string password, IDictionary<string, string> metadata, CancellationToken ct)
    {
        var key = options.Value.ServiceRoleKey;
        if (string.IsNullOrWhiteSpace(key)) throw new InvalidOperationException("Supabase:ServiceRoleKey is not configured.");
        using var request = new HttpRequestMessage(HttpMethod.Post, "admin/users");
        request.Headers.Add("apikey", key);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
        request.Content = JsonContent.Create(new { email, password, email_confirm = true, user_metadata = metadata }, options: Json);
        using var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) throw await SupabaseErrors.FromResponseAsync(response, ct);
        return await ReadAsync<GoTrueUser>(response, ct);
    }

    /// <summary>Emails a one-time sign-in code to an existing user (the "Magic Link" email template must show {{ .Token }}).</summary>
    public async Task SendEmailOtpAsync(string email, CancellationToken ct)
    {
        using var _ = await SendAsync(HttpMethod.Post, "otp", new { email, create_user = false }, null, ct);
    }

    /// <summary>Exchanges an emailed one-time code for a session.</summary>
    public async Task<GoTrueSession> VerifyEmailOtpAsync(string email, string token, CancellationToken ct)
    {
        using var response = await SendAsync(HttpMethod.Post, "verify", new { type = "email", email, token }, null, ct);
        return await ReadAsync<GoTrueSession>(response, ct);
    }

    /// <summary>Emails the signed-in user a one-time code (Supabase "Reauthentication" email template).</summary>
    public async Task SendReauthenticationCodeAsync(string accessToken, CancellationToken ct)
    {
        using var _ = await SendAsync(HttpMethod.Get, "reauthenticate", null, accessToken, ct);
    }

    /// <summary>Sets a new password for the signed-in user; <paramref name="nonce"/> is the emailed code.</summary>
    public async Task UpdatePasswordAsync(string accessToken, string password, string nonce, CancellationToken ct)
    {
        using var _ = await SendAsync(HttpMethod.Put, "user", new { password, nonce }, accessToken, ct);
    }

    public Task<GoTrueSession> SignInWithPasswordAsync(string email, string password, CancellationToken ct) =>
        TokenAsync("password", new { email, password }, ct);

    public Task<GoTrueSession> RefreshAsync(string refreshToken, CancellationToken ct) =>
        TokenAsync("refresh_token", new { refresh_token = refreshToken }, ct);

    public async Task<GoTrueUser> GetUserAsync(string accessToken, CancellationToken ct)
    {
        using var response = await SendAsync(HttpMethod.Get, "user", null, accessToken, ct);
        return await ReadAsync<GoTrueUser>(response, ct);
    }

    /// <summary>Revokes the refresh tokens of the session the access token belongs to.</summary>
    public async Task SignOutAsync(string accessToken, CancellationToken ct)
    {
        using var _ = await SendAsync(HttpMethod.Post, "logout?scope=local", null, accessToken, ct);
    }

    public async Task SendPasswordRecoveryAsync(string email, CancellationToken ct)
    {
        var url = RedirectQuery is null ? "recover" : $"recover?{RedirectQuery}";
        using var _ = await SendAsync(HttpMethod.Post, url, new { email }, null, ct);
    }

    public async Task ResendSignupConfirmationAsync(string email, CancellationToken ct)
    {
        using var _ = await SendAsync(HttpMethod.Post, "resend", new { type = "signup", email }, null, ct);
    }

    private async Task<GoTrueSession> TokenAsync(string grantType, object body, CancellationToken ct)
    {
        using var response = await SendAsync(HttpMethod.Post, $"token?grant_type={grantType}", body, null, ct);
        return await ReadAsync<GoTrueSession>(response, ct);
    }

    private async Task<HttpResponseMessage> SendAsync(HttpMethod method, string path, object? body, string? accessToken, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(method, path);
        request.Headers.Add("apikey", options.Value.AnonKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken ?? options.Value.AnonKey);
        if (body is not null) request.Content = JsonContent.Create(body, options: Json);

        var response = await http.SendAsync(request, ct);
        if (response.IsSuccessStatusCode) return response;
        using (response) throw await SupabaseErrors.FromResponseAsync(response, ct);
    }

    private static async Task<T> ReadAsync<T>(HttpResponseMessage response, CancellationToken ct) =>
        await response.Content.ReadFromJsonAsync<T>(Json, ct)
        ?? throw new SupabaseException(System.Net.HttpStatusCode.BadGateway, null, "Empty response from Supabase Auth.");
}

public sealed record GoTrueSession(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    long? ExpiresAt,
    GoTrueUser User);

public sealed record GoTrueUser(
    Guid Id,
    string? Email,
    string? Role,
    DateTimeOffset? EmailConfirmedAt,
    DateTimeOffset? CreatedAt,
    DateTimeOffset? LastSignInAt,
    Dictionary<string, JsonElement>? UserMetadata)
{
    public string? Metadata(string key) =>
        UserMetadata is not null && UserMetadata.TryGetValue(key, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
}
