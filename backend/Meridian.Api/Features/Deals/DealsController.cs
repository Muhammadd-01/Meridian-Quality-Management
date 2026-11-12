using Meridian.Api.Features.Crm;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Mvc;

namespace Meridian.Api.Features.Deals;

[Route("api/deals")]
public sealed class DealsController(SupabaseRestClient db) : CrmControllerBase<Deal>(db)
{
    protected override string Table => "deals";
    protected override string IdPrefix => "deal";
    protected override IReadOnlyList<string> SearchColumns { get; } = ["name", "company", "contact", "owner"];

    protected override IReadOnlyDictionary<string, string> FilterColumns { get; } = new Dictionary<string, string>
    {
        ["stage"] = "stage",
        ["status"] = "status",
        ["owner"] = "owner",
        ["company"] = "company",
    };

    protected override IReadOnlyDictionary<string, string> SortColumns { get; } = new Dictionary<string, string>
    {
        ["createdAt"] = "created_at",
        ["updatedAt"] = "updated_at",
        ["name"] = "name",
        ["company"] = "company",
        ["value"] = "value",
        ["probability"] = "probability",
        ["expectedClose"] = "expected_close",
        ["stage"] = "stage",
    };
}
