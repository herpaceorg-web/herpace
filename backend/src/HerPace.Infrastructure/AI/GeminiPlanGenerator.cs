using System.Text;
using System.Text.Json;
using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.AI;

/// <summary>
/// Generates training plans using Google Gemini 3 Flash Preview via REST API.
/// Uses direct API key authentication (x-goog-api-key header).
/// </summary>
public class GeminiPlanGenerator : IAIPlanGenerator
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiPlanGenerator> _logger;
    private readonly string _apiKey;
    private readonly string _apiUrl;

    public GeminiPlanGenerator(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeminiPlanGenerator> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        _apiKey = (_configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API key is not configured in appsettings.json")).Trim();

        var model = _configuration["Gemini:Model"] ?? "gemini-3-flash-preview";
        _apiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";
    }

    public async Task<GeneratedPlanDto> GeneratePlanAsync(
        PlanGenerationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating training plan using Gemini API for race: {RaceName}", request.RaceName);

            // Build the prompt
            var prompt = BuildPlanPrompt(request);

            // Create Gemini API request
            var geminiRequest = new GeminiRequest
            {
                Contents = new List<GeminiContent>
                {
                    new GeminiContent
                    {
                        Parts = new List<GeminiPart>
                        {
                            new GeminiPart { Text = prompt }
                        }
                    }
                },
                GenerationConfig = new GeminiGenerationConfig
                {
                    Temperature = 0.2, // Lower temperature for consistent output
                    MaxOutputTokens = 65536, // Maximum allowed tokens for complete training plan
                    ResponseMimeType = "application/json" // Request JSON format
                }
            };

            // Serialize request
            var jsonRequest = JsonSerializer.Serialize(geminiRequest, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            // Create HTTP request
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, _apiUrl);
            httpRequest.Headers.Add("x-goog-api-key", _apiKey);
            httpRequest.Content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

            // Send request
            var startTime = DateTime.UtcNow;
            var httpResponse = await _httpClient.SendAsync(httpRequest, cancellationToken);
            var duration = DateTime.UtcNow - startTime;

            httpResponse.EnsureSuccessStatusCode();

            // Parse response
            var jsonResponse = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
            var geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(jsonResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (geminiResponse?.Candidates == null || geminiResponse.Candidates.Count == 0)
            {
                throw new InvalidOperationException("Gemini API returned no candidates");
            }

            var responseText = geminiResponse.Candidates[0].Content.Parts[0].Text;

            // Log the raw response for debugging
            _logger.LogInformation("Raw Gemini response length: {Length} characters. First 500: {Response}",
                responseText.Length,
                responseText.Length > 500 ? responseText.Substring(0, 500) + "..." : responseText);
            _logger.LogInformation("Last 500 characters: {Response}",
                responseText.Length > 500 ? "..." + responseText.Substring(responseText.Length - 500) : responseText);

            // Clean up response - remove markdown code fences if present
            var jsonText = responseText.Trim();
            if (jsonText.StartsWith("```json"))
            {
                jsonText = jsonText.Substring(7); // Remove ```json
            }
            else if (jsonText.StartsWith("```"))
            {
                jsonText = jsonText.Substring(3); // Remove ```
            }

            if (jsonText.EndsWith("```"))
            {
                jsonText = jsonText.Substring(0, jsonText.Length - 3); // Remove trailing ```
            }

            jsonText = jsonText.Trim();

            // Parse the training plan JSON from response
            var plan = JsonSerializer.Deserialize<GeneratedPlanDto>(jsonText, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
            });

            if (plan == null)
            {
                throw new InvalidOperationException("Failed to parse Gemini API response as training plan");
            }

            // Set metadata
            plan.GenerationSource = GenerationSource.AI;
            plan.AiModel = "gemini-3-flash-preview";

            _logger.LogInformation(
                "Training plan generated successfully in {Duration}ms. Sessions: {Count}",
                duration.TotalMilliseconds,
                plan.Sessions.Count);

            return plan;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating training plan with Gemini API");
            throw new InvalidOperationException("AI_GENERATION_FAILED: " + ex.Message, ex);
        }
    }

    private string BuildPlanPrompt(PlanGenerationRequest request)
    {
        var totalDays = (request.EndDate - request.StartDate).Days + 1;
        var totalWeeks = (int)Math.Ceiling(totalDays / 7.0);

        // Build cycle phase overview if available
        var cycleInfo = "";
        if (request.CyclePhases != null && request.CyclePhases.Any())
        {
            var phaseCounts = request.CyclePhases
                .GroupBy(p => p.Value)
                .Select(g => $"{g.Key}: {g.Count()} days")
                .ToList();

            cycleInfo = $@"
**Cycle Phase Distribution** (optimize workouts based on these predicted phases):
{string.Join("\n", phaseCounts)}

**Cycle-Aware Training Guidelines**:
- Menstrual Phase (Days 1-5): Low energy, prioritize recovery → Easy runs & Rest days
- Follicular Phase (Days 6-13): Rising energy, muscle building window → Interval & Tempo workouts
- Ovulatory Phase (Days 14-15): Peak performance window → Quality hard workouts
- Luteal Phase (Days 16-28): Declining energy, increased recovery needs → More Easy runs, reduced intensity

**Cycle Regularity**: {request.TypicalCycleRegularity} (adjust plan flexibility accordingly)";
        }
        else
        {
            cycleInfo = "\n**Cycle Tracking**: Not enabled for this runner (generate plan without cycle phase optimization)";
        }

        var distanceTypeStr = request.DistanceType switch
        {
            DistanceType.FiveK => "5K",
            DistanceType.TenK => "10K",
            DistanceType.HalfMarathon => "Half Marathon",
            DistanceType.Marathon => "Marathon",
            _ => request.Distance.ToString("F1") + " km"
        };

        return $@"Create a personalized hormone-aware running training plan in JSON format for a woman runner.

**Runner Profile**:
- Fitness Level: {request.FitnessLevel}
- Typical Weekly Mileage: {request.TypicalWeeklyMileage ?? 0:F1} km
- Cycle Length: {request.CycleLength ?? 28} days
{cycleInfo}

**Race Goal**:
- Race Name: {request.RaceName}
- Race Date: {request.RaceDate:yyyy-MM-dd} ({totalDays} days from start, ~{totalWeeks} weeks)
- Distance: {distanceTypeStr} ({request.Distance:F1} km)
- Goal Time: {request.GoalTime ?? "Not specified - focus on completion"}

**Training Plan Requirements**:
1. Plan Duration: {request.StartDate:yyyy-MM-dd} to {request.RaceDate:yyyy-MM-dd} ({totalWeeks} weeks)
2. Training Days: 4-5 days per week (include rest days)
3. Long Run Day: Sunday (or specify another day)
4. Progressive Overload: Gradual weekly mileage increases (≤10% per week)
5. Taper Period: Final 2 weeks should reduce volume by 30-50%

**Workout Types** (use ONLY these enum values):
- Easy: Low intensity, conversational pace (foundation building)
- Long: Extended duration run, steady effort (endurance)
- Tempo: Moderate-hard, sustained threshold effort (lactate threshold)
- Interval: High intensity intervals with recovery (VO2 max)
- Rest: Complete rest or active recovery (essential for adaptation)

**Intensity Levels**:
- Low: Easy, conversational effort (recovery/base building)
- Moderate: Comfortably hard, sustainable (tempo work)
- High: Hard effort, challenging pace (intervals/races)

**Session Details Required**:
- sessionName: Descriptive name (e.g., ""Easy Recovery Run"", ""Long Run"", ""Interval Training"")
- warmUp: Brief warm-up instructions (e.g., ""10 min easy jog + dynamic stretches"")
- sessionDescription: Detailed workout description (e.g., ""8x400m @ 5K pace with 90s recovery"")
- hrZones: Heart rate zones if applicable (e.g., ""Zone 2-3"", ""Zone 4-5"")
- durationMinutes: Estimated workout duration (null for Rest days)
- distance: Planned distance in km (null for Rest days)
- cyclePhase: The menstrual cycle phase for this date (Menstrual, Follicular, Ovulatory, Luteal)
- phaseGuidance: Brief cycle-specific tip (e.g., ""Follicular phase - great day for speed work!"")

**Response Format** (JSON - return ONLY this JSON, no markdown, no extra text):
{{
  ""planName"": ""{distanceTypeStr} Training Plan"",
  ""trainingDaysPerWeek"": 4,
  ""longRunDay"": ""Sunday"",
  ""daysBeforePeriodToReduceIntensity"": 3,
  ""daysAfterPeriodToReduceIntensity"": 2,
  ""planCompletionGoal"": ""Complete {distanceTypeStr} strong and injury-free"",
  ""sessions"": [
    {{
      ""sessionName"": ""Easy Recovery Run"",
      ""scheduledDate"": ""2026-01-27"",
      ""workoutType"": 0,
      ""warmUp"": ""5-10 min easy jog"",
      ""sessionDescription"": ""Relaxed pace, focus on form and recovery"",
      ""durationMinutes"": 30,
      ""distance"": 5.0,
      ""intensityLevel"": 0,
      ""hrZones"": ""Zone 2"",
      ""cyclePhase"": 1,
      ""phaseGuidance"": ""Follicular phase - rising energy, good day for base building""
    }}
  ]
}}

**Enum Value Mappings**:
- workoutType: Easy=0, Long=1, Tempo=2, Interval=3, Rest=4
- intensityLevel: Low=0, Moderate=1, High=2
- cyclePhase: Menstrual=0, Follicular=1, Ovulatory=2, Luteal=3

**CRITICAL**:
- Return ONLY valid JSON (no markdown code fences, no explanatory text)
- Include ALL sessions from {request.StartDate:yyyy-MM-dd} to {request.RaceDate:yyyy-MM-dd}
- Use numeric enum values (0, 1, 2, 3) for workoutType, intensityLevel, and cyclePhase
- Align workouts with cycle phases when provided
- Include proper taper in final 2 weeks
- Generate complete, detailed, actionable training plan";
    }
}
