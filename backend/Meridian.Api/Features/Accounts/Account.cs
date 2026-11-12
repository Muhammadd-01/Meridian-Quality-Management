using System.ComponentModel.DataAnnotations;
using Meridian.Api.Features.Crm;

namespace Meridian.Api.Features.Accounts;

/// <summary>A customer, partner, supplier or prospect organisation ("Companies" in the web app).</summary>
public sealed class Account : CrmRecord
{
    public static readonly string[] Categories = ["Enterprise", "Mid-Market", "SMB"];
    public static readonly string[] Relationships = ["Customer", "Partner", "Supplier", "Prospect"];

    [StringLength(200)] public string? Name { get; set; }
    [StringLength(200)] public string? Industry { get; set; }
    [StringLength(50)] public string? Category { get; set; }
    [StringLength(50)] public string? Relationship { get; set; }
    [StringLength(320)] public string? Email { get; set; }
    [StringLength(50)] public string? Phone { get; set; }
    [StringLength(200)] public string? Location { get; set; }
    [StringLength(100)] public string? Country { get; set; }
    [StringLength(200)] public string? ContactPerson { get; set; }
    [StringLength(200)] public string? ContactRole { get; set; }
    [Range(0, int.MaxValue)] public int? ActiveDeals { get; set; }
    public decimal? TotalSpent { get; set; }
    [StringLength(4)] public string? LogoText { get; set; }
    [StringLength(60)] public string? LogoColor { get; set; }

    protected override void ApplyDefaults()
    {
        Name = Text(Name);
        Industry = Text(Industry);
        Category = TextOr(Category, "Enterprise");
        Relationship = TextOr(Relationship, "Prospect");
        Email = Text(Email);
        Phone = Text(Phone);
        Location = Text(Location);
        Country = Text(Country);
        ContactPerson = Text(ContactPerson);
        ContactRole = Text(ContactRole);
        ActiveDeals ??= 0;
        TotalSpent ??= 0;
        LogoText = TextOr(LogoText, Initials(Name));
        LogoColor = TextOr(LogoColor, "bg-teal-800");
    }

    protected override IEnumerable<ValidationResult> ValidateRecord() =>
        Required(Name!, "name", "Company name")
            .Concat(ValidEmail(Email!, "email"))
            .Concat(OneOf(Category!, Categories, "category", "Category"))
            .Concat(OneOf(Relationship!, Relationships, "relationship", "Relationship"))
            .Concat(NotNegative(TotalSpent!.Value, "totalSpent", "Total value"));

    private static string Initials(string? name)
    {
        var letters = (name ?? string.Empty)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Take(2)
            .Select(w => char.ToUpperInvariant(w[0]));
        var text = string.Concat(letters);
        return text.Length == 0 ? "CO" : text;
    }
}
