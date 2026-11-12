using System.ComponentModel.DataAnnotations;
using Meridian.Api.Features.Crm;

namespace Meridian.Api.Features.Leads;

public sealed class Lead : CrmRecord
{
    public static readonly string[] Sources = ["Website", "Referral", "LinkedIn", "Facebook", "Conference", "Cold Call", "Other"];
    public static readonly string[] Statuses = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

    [StringLength(200)] public string? ContactName { get; set; }
    [StringLength(200)] public string? Company { get; set; }
    [StringLength(320)] public string? Email { get; set; }
    [StringLength(50)] public string? Phone { get; set; }
    [StringLength(50)] public string? Source { get; set; }
    [StringLength(50)] public string? Status { get; set; }
    [StringLength(200)] public string? AssignedTo { get; set; }
    public decimal? DealValue { get; set; }
    public DateOnly? LastContact { get; set; }
    [StringLength(5000)] public string? Notes { get; set; }

    /// <summary>Set when the lead was converted; points at the created deal.</summary>
    [StringLength(100)] public string? ConvertedDealId { get; set; }

    protected override void ApplyDefaults()
    {
        ContactName = Text(ContactName);
        Company = Text(Company);
        Email = Text(Email);
        Phone = Text(Phone);
        Source = TextOr(Source, "Other");
        Status = TextOr(Status, "New");
        AssignedTo = Text(AssignedTo);
        DealValue ??= 0;
        Notes = Text(Notes);
        ConvertedDealId = OptionalText(ConvertedDealId);
    }

    protected override IEnumerable<ValidationResult> ValidateRecord() =>
        Required(ContactName!, "contactName", "Contact name")
            .Concat(Required(Company!, "company", "Company"))
            .Concat(ValidEmail(Email!, "email"))
            .Concat(OneOf(Source!, Sources, "source", "Source"))
            .Concat(OneOf(Status!, Statuses, "status", "Status"))
            .Concat(NotNegative(DealValue!.Value, "dealValue", "Deal value"));
}
