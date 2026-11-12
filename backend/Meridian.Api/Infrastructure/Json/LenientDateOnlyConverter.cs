using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Meridian.Api.Infrastructure.Json;

/// <summary>
/// Reads optional calendar dates the way the web app sends them: "yyyy-MM-dd",
/// a full ISO timestamp (date part is kept), an empty string or null (both = no date).
/// Always writes "yyyy-MM-dd".
/// </summary>
public sealed class LenientDateOnlyConverter : JsonConverter<DateOnly?>
{
    private const string Format = "yyyy-MM-dd";

    public override bool HandleNull => true;

    public override DateOnly? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;
        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Dates must be strings in yyyy-MM-dd format.");

        var text = reader.GetString()?.Trim();
        if (string.IsNullOrEmpty(text)) return null;

        var datePart = text.Length >= 10 ? text[..10] : text;
        if (DateOnly.TryParseExact(datePart, Format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            return date;

        throw new JsonException($"'{text}' is not a valid date. Use yyyy-MM-dd.");
    }

    public override void Write(Utf8JsonWriter writer, DateOnly? value, JsonSerializerOptions options)
    {
        if (value is null) writer.WriteNullValue();
        else writer.WriteStringValue(value.Value.ToString(Format, CultureInfo.InvariantCulture));
    }
}
