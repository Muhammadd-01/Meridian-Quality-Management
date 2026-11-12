using System.Net;
using System.Text.Json;

namespace Meridian.Api.Infrastructure.Supabase;

/// <summary>Turns Supabase error bodies into <see cref="SupabaseException"/> with an API-appropriate status.</summary>
internal static class SupabaseErrors
{
    public static async Task<SupabaseException> FromResponseAsync(HttpResponseMessage response, CancellationToken ct)
    {
        var body = await response.Content.ReadAsStringAsync(ct);
        string? code = null, message = null, detail = null;

        try
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
            var root = doc.RootElement;
            // PostgREST: { code, message, details, hint }
            // GoTrue:    { error_code, msg } or { error, error_description }
            code = Str(root, "error_code") ?? Str(root, "code") ?? Str(root, "error");
            message = Str(root, "msg") ?? Str(root, "message") ?? Str(root, "error_description");
            detail = Str(root, "details") ?? Str(root, "hint");
        }
        catch (JsonException)
        {
            message = body;
        }

        message = string.IsNullOrWhiteSpace(message) ? response.ReasonPhrase ?? "Supabase request failed." : message;
        return new SupabaseException(MapStatus(response.StatusCode, code), code, Friendly(code, message), detail);
    }

    private static HttpStatusCode MapStatus(HttpStatusCode upstream, string? code) => code switch
    {
        "23505" => HttpStatusCode.Conflict,
        "23502" or "23514" or "23503" => HttpStatusCode.UnprocessableEntity,
        "22P02" or "22007" or "22008" or "22003" or "PGRST100" or "PGRST102" => HttpStatusCode.BadRequest,
        "42501" => HttpStatusCode.Forbidden,
        "PGRST301" or "PGRST302" or "PGRST303" or "bad_jwt" or "session_not_found" => HttpStatusCode.Unauthorized,
        "PGRST116" => HttpStatusCode.NotFound,
        "PGRST205" or "42P01" => HttpStatusCode.ServiceUnavailable,
        "over_request_rate_limit" or "over_email_send_rate_limit" => HttpStatusCode.TooManyRequests,
        _ when (int)upstream >= 500 => HttpStatusCode.BadGateway,
        _ => upstream,
    };

    // Database wording never reaches people: known codes get a plain sentence, any other
    // Postgres / PostgREST code (5 characters or PGRST…) gets a generic one. GoTrue messages
    // (e.g. "Password should be at least 8 characters") are already readable and are kept.
    private static string Friendly(string? code, string message) => code switch
    {
        "23505" => "A record with the same id already exists.",
        "23502" => "A required field is missing.",
        "23514" => "One of the values is not allowed.",
        "23503" => "This record is linked to something that no longer exists.",
        "22P02" or "22007" or "22008" or "22003" => "One of the values has the wrong format.",
        "PGRST205" or "42P01" => "The CRM tables do not exist yet. Run supabase/schema.sql in the Supabase SQL editor.",
        "PGRST204" or "42703" => "The database needs an update for this feature. Run the latest SQL files from the supabase folder.",
        "42501" => "You don't have permission to do that.",
        "otp_expired" => "That code is wrong or has expired. Request a new code.",
        "over_email_send_rate_limit" => "Too many emails were sent. Please wait a few minutes and try again.",
        "over_request_rate_limit" => "Too many attempts. Please wait a minute and try again.",
        "email_address_invalid" => "That email address isn't valid.",
        _ when code is not null && (code.StartsWith("PGRST", StringComparison.Ordinal) || (code.Length == 5 && char.IsDigit(code[0])))
            => "The request could not be completed.",
        _ => message,
    };

    private static string? Str(JsonElement root, string name) =>
        root.ValueKind == JsonValueKind.Object && root.TryGetProperty(name, out var value)
            ? value.ValueKind switch
            {
                JsonValueKind.String => value.GetString(),
                JsonValueKind.Number => value.GetRawText(),
                _ => null,
            }
            : null;
}
