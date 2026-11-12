using System.Net;
using System.Security.Claims;
using Meridian.Api.Infrastructure.Supabase;

namespace Meridian.Api.Features.Users;

/// <summary>Reads and updates <c>public.profiles</c> through the Data API (as the signed-in user, so RLS applies).</summary>
public sealed class ProfileStore(SupabaseRestClient db)
{
    private const string Table = "profiles";

    /// <param name="accessToken">Use this token instead of the request's (e.g. right after sign-in).</param>
    public Task<Profile?> GetAsync(Guid userId, CancellationToken ct, string? accessToken = null) =>
        Wrap(() => db.GetAsync<Profile>(Table, userId.ToString(), ct, accessToken));

    public Task<IReadOnlyList<Profile>> ListAsync(CancellationToken ct) =>
        Wrap(async () => (IReadOnlyList<Profile>)(await db.ListAsync<Profile>(Table, "select=*&order=created_at.asc", ct)).Items);

    /// <summary>Updates the given columns (snake_case keys); null when no row is visible or matched.</summary>
    public Task<Profile?> PatchAsync(Guid userId, IReadOnlyDictionary<string, object?> changes, CancellationToken ct) =>
        Wrap(() => db.PatchAsync<Profile>(Table, userId.ToString(), changes, ct));

    // A missing table means supabase/roles.sql has not been run yet: say so plainly.
    private static async Task<T> Wrap<T>(Func<Task<T>> call)
    {
        try
        {
            return await call();
        }
        catch (SupabaseException e) when (e.Code is "PGRST205" or "42P01")
        {
            throw new SupabaseException(HttpStatusCode.ServiceUnavailable, e.Code,
                "User roles are not set up yet. Run supabase/roles.sql in the Supabase SQL Editor.");
        }
    }
}

/// <summary>The signed-in caller and their profile, loaded once per request.</summary>
public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor, ProfileStore profiles)
{
    private Profile? _profile;
    private bool _loaded;

    public Guid? Id
    {
        get
        {
            var sub = httpContextAccessor.HttpContext?.User.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public async Task<Profile?> ProfileAsync(CancellationToken ct)
    {
        if (_loaded) return _profile;
        _profile = Id is { } id ? await profiles.GetAsync(id, ct) : null;
        _loaded = true;
        return _profile;
    }

    /// <summary>The caller's role while their account is active, otherwise null.</summary>
    public async Task<string?> RoleAsync(CancellationToken ct) => (await ProfileAsync(ct))?.EffectiveRole;
}
