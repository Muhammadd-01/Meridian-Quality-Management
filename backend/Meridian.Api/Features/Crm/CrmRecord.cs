using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace Meridian.Api.Features.Crm;

/// <summary>
/// Common shape of every CRM record. One class per entity is used both as the
/// API contract (camelCase) and the database row (snake_case, see SupabaseJson).
/// </summary>
public abstract partial class CrmRecord : IValidatableObject
{
    /// <summary>Client-supplied ids (e.g. "lead-m3x9k2") are kept so links between records survive; generated when omitted.</summary>
    [StringLength(100)]
    public string? Id { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Guid? CreatedBy { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateTimeOffset? CreatedAt { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// Any extra fields the web app attaches to a record. Flattened into the API
    /// payload and stored in the <c>extra</c> jsonb column, so nothing is lost.
    /// </summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }

    /// <summary>Fills defaults for omitted values and trims text. Runs before validation.</summary>
    protected abstract void ApplyDefaults();

    /// <summary>Entity rules that need the normalised values (required text, allowed values, formats).</summary>
    protected abstract IEnumerable<ValidationResult> ValidateRecord();

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        Normalize();
        return ValidateRecord();
    }

    public void Normalize()
    {
        Id = string.IsNullOrWhiteSpace(Id) ? null : Id.Trim();
        Extra ??= [];
        ApplyDefaults();
    }

    /// <summary>Audit columns are owned by the database; never accept them from callers.</summary>
    public void ClearServerManagedFields()
    {
        CreatedBy = null;
        CreatedAt = null;
        UpdatedAt = null;
    }

    protected static string Text(string? value) => value?.Trim() ?? string.Empty;

    protected static string TextOr(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    protected static string? OptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    protected static List<string> CleanTags(List<string>? tags) =>
        (tags ?? []).Select(t => t?.Trim() ?? string.Empty).Where(t => t.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

    protected static IEnumerable<ValidationResult> Required(string value, string member, string label)
    {
        if (string.IsNullOrWhiteSpace(value)) yield return new ValidationResult($"{label} is required.", [member]);
    }

    protected static IEnumerable<ValidationResult> OneOf(string value, IReadOnlyCollection<string> allowed, string member, string label)
    {
        if (!allowed.Contains(value)) yield return new ValidationResult($"{label} must be one of: {string.Join(", ", allowed)}.", [member]);
    }

    protected static IEnumerable<ValidationResult> ValidEmail(string value, string member)
    {
        if (value.Length > 0 && !EmailPattern().IsMatch(value)) yield return new ValidationResult("Email address is not valid.", [member]);
    }

    protected static IEnumerable<ValidationResult> NotNegative(decimal value, string member, string label)
    {
        if (value < 0) yield return new ValidationResult($"{label} cannot be negative.", [member]);
    }

    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex EmailPattern();
}
