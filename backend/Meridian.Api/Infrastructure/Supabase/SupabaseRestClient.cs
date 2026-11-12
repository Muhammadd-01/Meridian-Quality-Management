using System.Net.Http.Json;
using System.Text;

namespace Meridian.Api.Infrastructure.Supabase;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total);

/// <summary>
/// Thin, typed client over the Supabase Data API (PostgREST). Requests run as
/// the signed-in user (see <see cref="SupabaseUserTokenHandler"/>).
/// </summary>
public sealed class SupabaseRestClient(HttpClient http)
{
    private const string ReturnRepresentation = "return=representation";

    public async Task<PagedResult<T>> ListAsync<T>(string table, string query, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{table}?{query}");
        request.Headers.Add("Prefer", "count=exact");
        using var response = await SendAsync(request, ct);

        var items = await ReadAsync<List<T>>(response, ct);
        var total = ParseTotal(response) ?? items.Count;
        return new PagedResult<T>(items, total);
    }

    /// <param name="accessToken">Run as this user instead of the caller (e.g. right after sign-in).</param>
    public async Task<T?> GetAsync<T>(string table, string id, CancellationToken ct, string? accessToken = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{table}?select=*&id=eq.{Escape(id)}&limit=1");
        if (accessToken is not null) request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        using var response = await SendAsync(request, ct);
        var rows = await ReadAsync<List<T>>(response, ct);
        return rows.FirstOrDefault();
    }

    public async Task<T> InsertAsync<T>(string table, T row, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{table}?select=*") { Content = Json(row) };
        request.Headers.Add("Prefer", ReturnRepresentation);
        using var response = await SendAsync(request, ct);
        var rows = await ReadAsync<List<T>>(response, ct);
        return rows.Single();
    }

    /// <summary>Replaces the row's columns; returns null when no row with that id exists.</summary>
    public async Task<T?> UpdateAsync<T>(string table, string id, T row, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"{table}?select=*&id=eq.{Escape(id)}") { Content = Json(row) };
        request.Headers.Add("Prefer", ReturnRepresentation);
        using var response = await SendAsync(request, ct);
        var rows = await ReadAsync<List<T>>(response, ct);
        return rows.FirstOrDefault();
    }

    /// <summary>Sets only the given columns (snake_case keys); returns null when no row with that id is visible.</summary>
    public async Task<T?> PatchAsync<T>(string table, string id, IReadOnlyDictionary<string, object?> changes, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"{table}?select=*&id=eq.{Escape(id)}") { Content = Json(changes) };
        request.Headers.Add("Prefer", ReturnRepresentation);
        using var response = await SendAsync(request, ct);
        var rows = await ReadAsync<List<T>>(response, ct);
        return rows.FirstOrDefault();
    }

    /// <summary>Calls a Postgres function exposed by PostgREST (<c>rpc/&lt;name&gt;</c>) as the signed-in user.</summary>
    public async Task<TResult?> RpcAsync<TResult>(string function, object args, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"rpc/{function}") { Content = Json(args) };
        using var response = await SendAsync(request, ct);
        var text = await response.Content.ReadAsStringAsync(ct);
        return string.IsNullOrWhiteSpace(text) ? default : System.Text.Json.JsonSerializer.Deserialize<TResult>(text, SupabaseJson.Options);
    }

    /// <summary>Inserts new rows and overwrites existing ones (matched by id) in a single statement.</summary>
    public async Task<IReadOnlyList<T>> UpsertAsync<T>(string table, IReadOnlyCollection<T> rows, CancellationToken ct, string conflictColumn = "id")
    {
        if (rows.Count == 0) return [];
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{table}?select=*&on_conflict={conflictColumn}") { Content = Json(rows) };
        request.Headers.Add("Prefer", $"resolution=merge-duplicates,{ReturnRepresentation}");
        using var response = await SendAsync(request, ct);
        return await ReadAsync<List<T>>(response, ct);
    }

    /// <summary>Deletes rows by id and returns the ids that were actually removed.</summary>
    public async Task<IReadOnlyList<string>> DeleteAsync(string table, IReadOnlyCollection<string> ids, CancellationToken ct)
    {
        if (ids.Count == 0) return [];
        var filter = ids.Count == 1
            ? $"id=eq.{Escape(ids.First())}"
            : $"id=in.({string.Join(',', ids.Select(QuoteListValue))})";
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"{table}?select=id&{filter}");
        request.Headers.Add("Prefer", ReturnRepresentation);
        using var response = await SendAsync(request, ct);
        var rows = await ReadAsync<List<IdOnly>>(response, ct);
        return rows.Select(r => r.Id).ToList();
    }

    /// <summary>Deletes the rows matching a PostgREST filter (e.g. <c>user_id=eq.…</c>); returns how many were removed.</summary>
    public async Task<int> DeleteWhereAsync(string table, string filter, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"{table}?{filter}");
        request.Headers.Add("Prefer", ReturnRepresentation);
        using var response = await SendAsync(request, ct);
        var rows = await ReadAsync<List<System.Text.Json.JsonElement>>(response, ct);
        return rows.Count;
    }

    /// <summary>Escapes a value for use after a PostgREST operator, e.g. <c>eq.</c> or <c>ilike.</c>.</summary>
    public static string Escape(string value) => Uri.EscapeDataString(value);

    /// <summary>Double-quotes a value inside an <c>in.(…)</c> list so commas or parentheses in ids are safe.</summary>
    private static string QuoteListValue(string value) =>
        Uri.EscapeDataString($"\"{value.Replace("\\", "\\\\").Replace("\"", "\\\"")}\"");

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var response = await http.SendAsync(request, ct);
        if (response.IsSuccessStatusCode) return response;
        using (response) throw await SupabaseErrors.FromResponseAsync(response, ct);
    }

    private static async Task<TResult> ReadAsync<TResult>(HttpResponseMessage response, CancellationToken ct) where TResult : new() =>
        await response.Content.ReadFromJsonAsync<TResult>(SupabaseJson.Options, ct) ?? new TResult();

    private static StringContent Json<TValue>(TValue value) =>
        new(System.Text.Json.JsonSerializer.Serialize(value, SupabaseJson.Options), Encoding.UTF8, "application/json");

    // PostgREST reports the total as "Content-Range: 0-24/57" (no unit, so read it unvalidated).
    private static int? ParseTotal(HttpResponseMessage response)
    {
        if (!response.Content.Headers.NonValidated.TryGetValues("Content-Range", out var values)) return null;
        var raw = values.FirstOrDefault();
        var slash = raw?.LastIndexOf('/') ?? -1;
        return slash >= 0 && int.TryParse(raw![(slash + 1)..], out var total) ? total : null;
    }

    private sealed record IdOnly(string Id);
}
