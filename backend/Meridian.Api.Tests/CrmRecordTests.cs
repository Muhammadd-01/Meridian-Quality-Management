using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Meridian.Api.Features.Accounts;
using Meridian.Api.Features.Deals;
using Meridian.Api.Features.Leads;
using Meridian.Api.Infrastructure.Json;
using Meridian.Api.Infrastructure.Supabase;

namespace Meridian.Api.Tests;

public class CrmRecordTests
{
    private static readonly JsonSerializerOptions Api = CreateApiOptions();

    private static JsonSerializerOptions CreateApiOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new LenientDateOnlyConverter());
        return options;
    }

    private static List<ValidationResult> Validate(object record)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(record, new ValidationContext(record), results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void Unknown_api_fields_are_stored_in_the_extra_column_and_flattened_back()
    {
        var lead = JsonSerializer.Deserialize<Lead>(
            """{"id":"lead-1","contactName":"Ayesha","company":"Acme","dealValue":1200,"score":87,"customFlag":true}""", Api)!;

        var row = JsonDocument.Parse(JsonSerializer.Serialize(lead, SupabaseJson.Options)).RootElement;
        Assert.Equal("Ayesha", row.GetProperty("contact_name").GetString());
        Assert.Equal(87, row.GetProperty("extra").GetProperty("score").GetInt32());
        Assert.False(row.TryGetProperty("score", out _));
        Assert.False(row.TryGetProperty("created_at", out _)); // server-managed, omitted when null

        var fromDb = JsonSerializer.Deserialize<Lead>(row.GetRawText(), SupabaseJson.Options)!;
        var api = JsonDocument.Parse(JsonSerializer.Serialize(fromDb, Api)).RootElement;
        Assert.Equal(87, api.GetProperty("score").GetInt32());
        Assert.True(api.GetProperty("customFlag").GetBoolean());
        Assert.False(api.TryGetProperty("extra", out _));
    }

    [Fact]
    public void Dates_accept_empty_strings_and_iso_timestamps()
    {
        var deal = JsonSerializer.Deserialize<Deal>("""{"expectedClose":"","closedAt":"2026-10-20T08:15:00.000Z"}""", Api)!;
        Assert.Null(deal.ExpectedClose);
        Assert.Equal(new DateOnly(2026, 10, 20), deal.ClosedAt);
    }

    [Fact]
    public void Validation_fills_defaults_before_checking_rules()
    {
        var lead = new Lead { ContactName = "  Ayesha  ", Company = "Acme", Status = null, Source = "" };
        Assert.Empty(Validate(lead));
        Assert.Equal("Ayesha", lead.ContactName);
        Assert.Equal("New", lead.Status);
        Assert.Equal("Other", lead.Source);
        Assert.Equal(0, lead.DealValue);
    }

    [Fact]
    public void Validation_rejects_unknown_status_and_missing_required_fields()
    {
        var deal = new Deal { Name = "", Company = "Acme", Stage = "Somewhere", Value = -5 };
        var members = Validate(deal).SelectMany(r => r.MemberNames).ToHashSet();
        Assert.Contains("name", members);
        Assert.Contains("stage", members);
        Assert.Contains("value", members);
    }

    [Fact]
    public void Account_logo_initials_default_from_name()
    {
        var account = new Account { Name = "Gulf Logistics FZE" };
        Assert.Empty(Validate(account));
        Assert.Equal("GL", account.LogoText);
        Assert.Equal("Prospect", account.Relationship);
    }
}
