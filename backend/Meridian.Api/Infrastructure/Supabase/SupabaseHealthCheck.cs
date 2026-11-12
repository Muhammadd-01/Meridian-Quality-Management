using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace Meridian.Api.Infrastructure.Supabase;

/// <summary>
/// Reports whether the configured Supabase project can be reached, so <c>/health</c>
/// does not say "Healthy" while every sign-in and data request would fail.
/// </summary>
public sealed class SupabaseHealthCheck(IHttpClientFactory httpClientFactory, IOptions<SupabaseOptions> options) : IHealthCheck
{
    public const string HttpClientName = "supabase-health";

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        try
        {
            var client = httpClientFactory.CreateClient(HttpClientName);
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{settings.AuthUrl}/health");
            request.Headers.Add("apikey", settings.AnonKey);
            using var response = await client.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode
                ? HealthCheckResult.Healthy("Supabase reachable.")
                : HealthCheckResult.Unhealthy($"Supabase answered {(int)response.StatusCode} at {settings.BaseUrl}. Check Supabase:Url and Supabase:AnonKey.");
        }
        catch (HttpRequestException ex)
        {
            return HealthCheckResult.Unhealthy($"Cannot reach Supabase at {settings.BaseUrl} ({ex.Message}). Is the project active and the URL correct?");
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy($"Supabase at {settings.BaseUrl} did not respond in time.");
        }
    }
}
