namespace Meridian.Api.Features.Users;

/// <summary>A row of <c>public.profiles</c>: the CRM role and status of one sign-in account.</summary>
public sealed class Profile
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;

    /// <summary>International format, e.g. +923001234567; empty when not given.</summary>
    public string Phone { get; set; } = string.Empty;
    public string AppRole { get; set; } = AppRoles.Employee;
    public bool IsActive { get; set; }

    /// <summary>Public URL of the profile photo in the Supabase "avatars" bucket; empty when none.</summary>
    public string AvatarUrl { get; set; } = string.Empty;
    public DateTimeOffset? CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>The role that actually applies: none while the account is inactive.</summary>
    public string? EffectiveRole => IsActive ? AppRole : null;
}
