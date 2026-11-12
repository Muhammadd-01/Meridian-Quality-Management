using Meridian.Api.Features.Crm;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Mvc;

namespace Meridian.Api.Features.Accounts;

[Route("api/accounts")]
public sealed class AccountsController(SupabaseRestClient db) : CrmControllerBase<Account>(db)
{
    protected override string Table => "accounts";
    protected override string IdPrefix => "acc";
    protected override IReadOnlyList<string> SearchColumns { get; } = ["name", "industry", "contact_person", "email", "location"];

    protected override IReadOnlyDictionary<string, string> FilterColumns { get; } = new Dictionary<string, string>
    {
        ["relationship"] = "relationship",
        ["category"] = "category",
        ["country"] = "country",
    };

    protected override IReadOnlyDictionary<string, string> SortColumns { get; } = new Dictionary<string, string>
    {
        ["createdAt"] = "created_at",
        ["updatedAt"] = "updated_at",
        ["name"] = "name",
        ["industry"] = "industry",
        ["activeDeals"] = "active_deals",
        ["totalSpent"] = "total_spent",
    };
}
