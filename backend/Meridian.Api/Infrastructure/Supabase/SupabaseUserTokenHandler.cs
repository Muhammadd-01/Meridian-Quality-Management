using System.Net.Http.Headers;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

namespace Meridian.Api.Infrastructure.Supabase;

/// <summary>
/// Adds the project API key to every Supabase call and forwards the caller's
/// bearer token, so PostgREST evaluates Row Level Security as that user.
/// Without a signed-in caller the anon key is used (RLS then denies CRM access).
/// </summary>
public sealed class SupabaseUserTokenHandler(IHttpContextAccessor httpContextAccessor, IOptions<SupabaseOptions> options)
    : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var anonKey = options.Value.AnonKey;
        request.Headers.Remove("apikey");
        request.Headers.Add("apikey", anonKey);

        if (request.Headers.Authorization is null)
        {
            var token = BearerToken(httpContextAccessor.HttpContext) ?? anonKey;
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return base.SendAsync(request, cancellationToken);
    }

    public static string? BearerToken(HttpContext? context)
    {
        var header = context?.Request.Headers[HeaderNames.Authorization].ToString();
        if (string.IsNullOrEmpty(header) || !header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
        var token = header["Bearer ".Length..].Trim();
        return token.Length == 0 ? null : token;
    }
}
