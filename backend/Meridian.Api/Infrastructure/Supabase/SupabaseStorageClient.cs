using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace Meridian.Api.Infrastructure.Supabase;

/// <summary>
/// Supabase Storage, called as the signed-in user (see <see cref="SupabaseUserTokenHandler"/>),
/// so the bucket's Row Level Security policies decide what may be written.
/// </summary>
public sealed class SupabaseStorageClient(HttpClient http, IOptions<SupabaseOptions> options)
{
    public async Task UploadAsync(string bucket, string path, byte[] content, string contentType, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"object/{bucket}/{EscapePath(path)}") { Content = new ByteArrayContent(content) };
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        request.Headers.Add("x-upsert", "true");
        request.Headers.CacheControl = new CacheControlHeaderValue { MaxAge = TimeSpan.FromDays(365) };
        using var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) throw await SupabaseErrors.FromResponseAsync(response, ct);
    }

    public async Task DeleteAsync(string bucket, IReadOnlyCollection<string> paths, CancellationToken ct)
    {
        if (paths.Count == 0) return;
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"object/{bucket}") { Content = JsonContent.Create(new { prefixes = paths }) };
        using var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) throw await SupabaseErrors.FromResponseAsync(response, ct);
    }

    public string PublicUrl(string bucket, string path) => $"{options.Value.BaseUrl}/storage/v1/object/public/{bucket}/{EscapePath(path)}";

    /// <summary>The object path inside <paramref name="bucket"/> for a public URL this project issued; null otherwise.</summary>
    public string? PathFromPublicUrl(string bucket, string? url)
    {
        var prefix = $"{options.Value.BaseUrl}/storage/v1/object/public/{bucket}/";
        return url is not null && url.StartsWith(prefix, StringComparison.Ordinal) ? Uri.UnescapeDataString(url[prefix.Length..]) : null;
    }

    private static string EscapePath(string path) => string.Join('/', path.Split('/').Select(Uri.EscapeDataString));
}
