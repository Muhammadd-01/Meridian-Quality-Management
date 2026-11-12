using System.ComponentModel.DataAnnotations;
using Meridian.Api.Features.Crm;

namespace Meridian.Api.Features.Deals;

public sealed class Deal : CrmRecord
{
    public static readonly string[] Stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
    public static readonly string[] Statuses = ["Active", "Won", "Lost", "At Risk"];

    [StringLength(300)] public string? Name { get; set; }
    [StringLength(200)] public string? Company { get; set; }
    [StringLength(200)] public string? Contact { get; set; }
    [StringLength(200)] public string? Owner { get; set; }
    public decimal? Value { get; set; }
    [StringLength(50)] public string? Stage { get; set; }
    [Range(0, 100)] public int? Probability { get; set; }
    public DateOnly? ExpectedClose { get; set; }
    [StringLength(50)] public string? Status { get; set; }
    [MaxLength(50)] public List<string>? Tags { get; set; }
    [StringLength(5000)] public string? Notes { get; set; }

    // Outcome tracking (set when a deal is recorded as won or lost).
    public DateOnly? ClosedAt { get; set; }
    [StringLength(200)] public string? LostReason { get; set; }
    [StringLength(2000)] public string? LostNote { get; set; }

    /// <summary>The lead this deal was converted from, if any.</summary>
    [StringLength(100)] public string? SourceLeadId { get; set; }

    protected override void ApplyDefaults()
    {
        Name = Text(Name);
        Company = Text(Company);
        Contact = Text(Contact);
        Owner = Text(Owner);
        Value ??= 0;
        Stage = TextOr(Stage, "Lead");
        Probability ??= 10;
        Status = TextOr(Status, "Active");
        Tags = CleanTags(Tags);
        Notes = Text(Notes);
        LostReason = OptionalText(LostReason);
        LostNote = OptionalText(LostNote);
        SourceLeadId = OptionalText(SourceLeadId);
    }

    protected override IEnumerable<ValidationResult> ValidateRecord() =>
        Required(Name!, "name", "Deal name")
            .Concat(Required(Company!, "company", "Company"))
            .Concat(OneOf(Stage!, Stages, "stage", "Stage"))
            .Concat(OneOf(Status!, Statuses, "status", "Status"))
            .Concat(NotNegative(Value!.Value, "value", "Deal value"));
}
