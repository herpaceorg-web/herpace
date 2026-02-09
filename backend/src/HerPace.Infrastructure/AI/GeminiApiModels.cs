using System.Text.Json;
using System.Text.Json.Serialization;
using HerPace.Core.Enums;

namespace HerPace.Infrastructure.AI;

/// <summary>
/// Flexible converter for IntensityLevel that handles numeric values and common string variations.
/// </summary>
public class FlexibleIntensityLevelConverter : JsonConverter<IntensityLevel>
{
    public override IntensityLevel Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            var value = reader.GetInt32();
            return value switch
            {
                0 => IntensityLevel.Low,
                1 => IntensityLevel.Moderate,
                2 => IntensityLevel.High,
                _ => IntensityLevel.Moderate // Default fallback
            };
        }

        if (reader.TokenType == JsonTokenType.String)
        {
            var value = reader.GetString()?.ToLowerInvariant() ?? "";
            return value switch
            {
                "low" or "easy" or "light" or "0" => IntensityLevel.Low,
                "moderate" or "medium" or "normal" or "1" => IntensityLevel.Moderate,
                "high" or "hard" or "intense" or "2" => IntensityLevel.High,
                _ => IntensityLevel.Moderate // Default fallback
            };
        }

        return IntensityLevel.Moderate; // Default fallback
    }

    public override void Write(Utf8JsonWriter writer, IntensityLevel value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}

/// <summary>
/// Request/Response models for Gemini API.
/// Based on: https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent
/// </summary>

public class GeminiRequest
{
    [JsonPropertyName("contents")]
    public List<GeminiContent> Contents { get; set; } = new();

    [JsonPropertyName("generationConfig")]
    public GeminiGenerationConfig? GenerationConfig { get; set; }

    // ThinkingConfig is commented out - not yet supported by the Gemini API
    // [JsonPropertyName("thinkingConfig")]
    // public GeminiThinkingConfig? ThinkingConfig { get; set; }
}

public class GeminiContent
{
    [JsonPropertyName("parts")]
    public List<GeminiPart> Parts { get; set; } = new();
}

public class GeminiPart
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

public class GeminiGenerationConfig
{
    [JsonPropertyName("temperature")]
    public double? Temperature { get; set; }

    [JsonPropertyName("maxOutputTokens")]
    public int? MaxOutputTokens { get; set; }

    [JsonPropertyName("responseMimeType")]
    public string? ResponseMimeType { get; set; } // "application/json" for structured output
}

public class GeminiResponse
{
    [JsonPropertyName("candidates")]
    public List<GeminiCandidate> Candidates { get; set; } = new();
}

public class GeminiCandidate
{
    [JsonPropertyName("content")]
    public GeminiContent Content { get; set; } = new();

    [JsonPropertyName("finishReason")]
    public string? FinishReason { get; set; }
}

public class GeminiThinkingConfig
{
    /// <summary>
    /// Controls the maximum depth of the model's internal reasoning process.
    /// Supported values:
    /// - Both Pro and Flash: "low", "high" (default)
    /// - Flash-only: "minimal", "medium"
    /// </summary>
    [JsonPropertyName("thinking_level")]
    public string? ThinkingLevel { get; set; }
}
