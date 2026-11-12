namespace Meridian.Api.Features.Users;

/// <summary>
/// CRM roles and what each may do. Mirrors the Row Level Security rules in
/// supabase/roles.sql (the database enforces them too) and src/lib/permissions.js.
/// </summary>
public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Ceo = "CEO";
    public const string Manager = "Manager";
    public const string Employee = "Employee";

    public static readonly string[] All = [Admin, Ceo, Manager, Employee];

    /// <summary>Delete accounts, contacts, leads and deals.</summary>
    public static readonly string[] CanDeleteRecords = [Admin, Ceo, Manager];

    /// <summary>See the list of users and their roles.</summary>
    public static readonly string[] CanViewUsers = [Admin, Ceo, Manager];

    /// <summary>Create users, change roles, activate / deactivate accounts.</summary>
    public static readonly string[] CanManageUsers = [Admin, Ceo];

    /// <summary>Phone numbers are stored in international (E.164) form: + and 8–15 digits.</summary>
    public const string PhonePattern = @"^\+[1-9]\d{7,14}$";

    public static bool IsValid(string? role) => role is not null && All.Contains(role);

    /// <summary>Accepts any casing ("ceo", "Ceo") and returns the canonical name, or null.</summary>
    public static string? Normalize(string? role) =>
        All.FirstOrDefault(r => string.Equals(r, role?.Trim(), StringComparison.OrdinalIgnoreCase));
}
