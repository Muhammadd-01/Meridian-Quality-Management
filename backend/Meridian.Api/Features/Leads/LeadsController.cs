using Meridian.Api.Features.Crm;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Mvc;

namespace Meridian.Api.Features.Leads;

[Route("api/leads")]
public sealed class LeadsController(SupabaseRestClient db) : CrmControllerBase<Lead>(db)
{
    protected override string Table => "leads";
    protected override string IdPrefix => "lead";
    protected override IReadOnlyList<string> SearchColumns { get; } = ["contact_name", "company", "email", "phone", "assigned_to"];

    protected override IReadOnlyDictionary<string, string> FilterColumns { get; } = new Dictionary<string, string>
    {
        ["status"] = "status",
        ["source"] = "source",
        ["assignedTo"] = "assigned_to",
    };

    protected override IReadOnlyDictionary<string, string> SortColumns { get; } = new Dictionary<string, string>
    {
        ["createdAt"] = "created_at",
        ["updatedAt"] = "updated_at",
        ["contactName"] = "contact_name",
        ["company"] = "company",
        ["dealValue"] = "deal_value",
        ["lastContact"] = "last_contact",
        ["status"] = "status",
    };
}
