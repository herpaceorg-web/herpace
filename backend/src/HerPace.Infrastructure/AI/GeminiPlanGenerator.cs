using System.Text;
using System.Text.Json;
using HerPace.Core.DTOs;
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

        _apiKey = _configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API key is not configured in appsettings.json");

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
                    MaxOutputTokens = 4096,
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

            // Parse the training plan JSON from response
            var plan = JsonSerializer.Deserialize<GeneratedPlanDto>(responseText, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (plan == null)
            {
                throw new InvalidOperationException("Failed to parse Gemini API response as training plan");
            }

            // Set metadata
            plan.GenerationSource = "AI";
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
        var cyclePhases = string.Join("\n", request.CyclePhases.Select(p =>
            $"- {p.Date:yyyy-MM-dd}: {p.Phase} (Day {p.DayInCycle})"));

        return $@"Create a personalized running training plan in JSON format.

**User Profile**:
- Fitness Level: {request.FitnessLevel}
- Typical Weekly Mileage: {request.TypicalWeeklyMileage ?? 0} {request.DistanceUnit}
- Recent Race Performance: {request.RecentRaceTime ?? "Not provided"}

**Race Goal**:
- Race: {request.RaceName}
- Date: {request.RaceDate:yyyy-MM-dd}
- Distance: {request.RaceDistance} {request.DistanceUnit}
- Goal Time: {request.GoalTime ?? "Not specified"}

**Cycle Phases** (optimize workouts based on these):
{cyclePhases}

**Workout Types** (use ONLY these):
- Easy: Low intensity, conversational pace
- Long: Extended duration, endurance building
- Tempo: Moderate-hard, sustained effort
- Interval: High intensity intervals with recovery
- Rest: Complete rest day

**Cycle-Aware Guidelines**:
- Follicular Phase (Days 6-13): High energy period → Schedule Interval & Tempo workouts (muscle building)
- Ovulatory Phase (Days 14-15): Peak performance window → Quality hard work
- Luteal Phase (Days 16-28): Reduce intensity → More Easy runs, focus on volume
- Menstrual Phase (Days 1-5): Recovery focus → Easy & Rest emphasis

**Response Format** (JSON):
{{
  ""metadata"": {{
    ""totalWeeks"": <number>,
    ""weeklyMileageRange"": ""<low>-<high> {request.DistanceUnit}""
  }},
  ""sessions"": [
    {{
      ""scheduledDate"": ""YYYY-MM-DD"",
      ""workoutType"": ""Easy|Long|Tempo|Interval|Rest"",
      ""durationMinutes"": <number or null for Rest>,
      ""distance"": <number or null for Rest>,
      ""intensityLevel"": ""Low|Moderate|High"",
      ""cyclePhase"": ""Follicular|Ovulatory|Luteal|Menstrual"",
      ""phaseGuidance"": ""Brief tip for this workout given the cycle phase""
    }}
  ]
}}

Generate a complete training plan from today through race day, optimizing workout intensity based on predicted cycle phases. Return ONLY valid JSON, no additional text.";
    }
}
