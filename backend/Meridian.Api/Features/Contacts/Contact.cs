using System.ComponentModel.DataAnnotations;
using Meridian.Api.Features.Crm;

namespace Meridian.Api.Features.Contacts;

public sealed class Contact : CrmRecord
{
    public static readonly string[] Statuses = ["Active", "Inactive"];
    public static readonly string[] Sources = ["Company record", "Lead", "Manual", "Import"];

    [StringLength(200)] public string? Name { get; set; }
    [StringLength(200)] public string? Company { get; set; }
    [StringLength(200)] public string? Role { get; set; }
    [StringLength(320)] public string? Email { get; set; }
    [StringLength(50)] public string? Phone { get; set; }
    [StringLength(200)] public string? Location { get; set; }
    [StringLength(50)] public string? Status { get; set; }
    [StringLength(50)] public string? Source { get; set; }
    [MaxLength(50)] public List<string>? Tags { get; set; }
    [StringLength(5000)] public string? Notes { get; set; }
    public bool? IsDemo { get; set; }

    protected override void ApplyDefaults()
    {
        Name = Text(Name);
        Company = Text(Company);
        Role = Text(Role);
        Email = Text(Email);
        Phone = Text(Phone);
        Location = Text(Location);
        Status = TextOr(Status, "Active");
        Source = TextOr(Source, "Manual");
        Tags = CleanTags(Tags);
        Notes = Text(Notes);
        IsDemo ??= false;
    }

    protected override IEnumerable<ValidationResult> ValidateRecord() =>
        Required(Name!, "name", "Full name")
            .Concat(ValidEmail(Email!, "email"))
            .Concat(OneOf(Status!, Statuses, "status", "Status"))
            .Concat(OneOf(Source!, Sources, "source", "Source"));
}
