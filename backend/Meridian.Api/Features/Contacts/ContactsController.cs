using Meridian.Api.Features.Crm;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Mvc;

namespace Meridian.Api.Features.Contacts;

[Route("api/contacts")]
public sealed class ContactsController(SupabaseRestClient db) : CrmControllerBase<Contact>(db)
{
    protected override string Table => "contacts";
    protected override string IdPrefix => "contact";
    protected override IReadOnlyList<string> SearchColumns { get; } = ["name", "company", "role", "email", "phone"];

    protected override IReadOnlyDictionary<string, string> FilterColumns { get; } = new Dictionary<string, string>
    {
        ["status"] = "status",
        ["source"] = "source",
        ["company"] = "company",
    };

    protected override IReadOnlyDictionary<string, string> SortColumns { get; } = new Dictionary<string, string>
    {
        ["createdAt"] = "created_at",
        ["updatedAt"] = "updated_at",
        ["name"] = "name",
        ["company"] = "company",
        ["status"] = "status",
    };
}
