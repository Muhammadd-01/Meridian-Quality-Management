using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using Meridian.Api.Infrastructure.Json;

namespace Meridian.Api.Infrastructure.Supabase;

/// <summary>
/// Serializer settings for talking to PostgREST. The same record classes serve
/// the public API (camelCase, unknown fields flattened via [JsonExtensionData])
/// and the database (snake_case, unknown fields stored in the <c>extra</c> jsonb column).
/// </summary>
public static class SupabaseJson
{
    public const string ExtraColumn = "extra";

    public static readonly JsonSerializerOptions Options = Create();

    private static JsonSerializerOptions Create()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.Never,
            TypeInfoResolver = new DefaultJsonTypeInfoResolver
            {
                Modifiers = { StoreExtensionDataAsColumn },
            },
        };
        options.Converters.Add(new LenientDateOnlyConverter());
        return options;
    }

    // [JsonExtensionData] flattens unknown fields into the API payload; for the
    // database we want them kept together in a single jsonb column instead.
    private static void StoreExtensionDataAsColumn(JsonTypeInfo typeInfo)
    {
        if (typeInfo.Kind != JsonTypeInfoKind.Object) return;
        foreach (var property in typeInfo.Properties)
        {
            if (!property.IsExtensionData) continue;
            property.IsExtensionData = false;
            property.Name = ExtraColumn;
        }
    }
}
