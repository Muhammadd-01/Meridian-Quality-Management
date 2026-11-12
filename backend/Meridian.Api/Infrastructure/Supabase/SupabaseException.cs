using System.Net;

namespace Meridian.Api.Infrastructure.Supabase;

/// <summary>An error response from Supabase (PostgREST or GoTrue), already mapped to an HTTP status for our API.</summary>
public sealed class SupabaseException(HttpStatusCode statusCode, string? code, string message, string? detail = null)
    : Exception(message)
{
    public HttpStatusCode StatusCode { get; } = statusCode;

    /// <summary>Postgres / PostgREST / GoTrue error code, e.g. 23505, PGRST205 or invalid_credentials.</summary>
    public string? Code { get; } = code;

    public string? Detail { get; } = detail;
}
