using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace Meridian.Api.Features.WhatsApp;

public sealed class WhatsAppOptions
{
    public const string SectionName = "WhatsApp";

    /// <summary>The local WhatsApp link service (whatsapp-service/server.mjs).</summary>
    public string ServiceUrl { get; init; } = "http://127.0.0.1:5090";

    /// <summary>Shared secret; when empty it is read from <see cref="SecretFile"/>.</summary>
    public string? ServiceSecret { get; init; }

    /// <summary>File the service writes its secret to, relative to the API's content root.</summary>
    public string SecretFile { get; init; } = "../../whatsapp-service/.service-secret";
}

/// <summary>Result of a call to the WhatsApp service: HTTP status plus its JSON body.</summary>
public sealed record WhatsAppResult(HttpStatusCode Status, JsonElement Body)
{
    public string? Error => Body.ValueKind == JsonValueKind.Object && Body.TryGetProperty("error", out var e) ? e.GetString() : null;
}

/// <summary>Talks to the local WhatsApp link service on behalf of one CRM user.</summary>
public sealed class WhatsAppClient(HttpClient http, IOptions<WhatsAppOptions> options, IWebHostEnvironment env)
{
    private string? Secret()
    {
        if (!string.IsNullOrWhiteSpace(options.Value.ServiceSecret)) return options.Value.ServiceSecret;
        var file = Path.GetFullPath(Path.Combine(env.ContentRootPath, options.Value.SecretFile));
        return File.Exists(file) ? File.ReadAllText(file).Trim() : null; // read each time: the service may start after the API
    }

    public Task<WhatsAppResult> StatusAsync(Guid userId, CancellationToken ct) => SendAsync(HttpMethod.Get, $"sessions/{userId}", null, ct);
    public Task<WhatsAppResult> ConnectAsync(Guid userId, CancellationToken ct) => SendAsync(HttpMethod.Post, $"sessions/{userId}/connect", null, ct);
    public Task<WhatsAppResult> LogoutAsync(Guid userId, CancellationToken ct) => SendAsync(HttpMethod.Post, $"sessions/{userId}/logout", null, ct);
    public Task<WhatsAppResult> CheckAsync(Guid userId, string phone, CancellationToken ct) => SendAsync(HttpMethod.Post, $"sessions/{userId}/check", new { phone }, ct);
    public Task<WhatsAppResult> SendTextAsync(Guid userId, string phone, string text, CancellationToken ct) => SendAsync(HttpMethod.Post, $"sessions/{userId}/send", new { phone, text }, ct);

    private async Task<WhatsAppResult> SendAsync(HttpMethod method, string path, object? body, CancellationToken ct)
    {
        var secret = Secret() ?? throw new WhatsAppUnavailableException();
        using var request = new HttpRequestMessage(method, new Uri(new Uri(options.Value.ServiceUrl.TrimEnd('/') + "/"), path));
        request.Headers.Add("x-service-secret", secret);
        if (body is not null) request.Content = JsonContent.Create(body);
        try
        {
            using var response = await http.SendAsync(request, ct);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(ct);
            return new WhatsAppResult(response.StatusCode, json);
        }
        catch (HttpRequestException)
        {
            throw new WhatsAppUnavailableException();
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new WhatsAppUnavailableException();
        }
    }
}

public sealed class WhatsAppUnavailableException() : Exception("The WhatsApp service is not running.");
