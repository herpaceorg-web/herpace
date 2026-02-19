using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.AI;

/// <summary>
/// Generates training plans using Google Gemini 3 (Flash or Pro) via REST API.
/// Supports configurable thinking levels for advanced reasoning.
/// Uses direct API key authentication (x-goog-api-key header).
/// </summary>
public class GeminiPlanGenerator : IAIPlanGenerator
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiPlanGenerator> _logger;
    private readonly string _apiKey;
    private readonly string _apiUrl;
    private readonly string _model;
    private readonly string? _thinkingLevel;

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

        _model = _configuration["Gemini:Model"] ?? "gemini-3-flash-preview";
        _thinkingLevel = null; // ThinkingConfig not yet supported by API
        _apiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent";

        _logger.LogInformation("GeminiPlanGenerator initialized with model: {Model}",
            _model);
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
                    Temperature = 1.0, // Keep at default for Gemini 3 as per documentation
                    MaxOutputTokens = 65536, // Maximum allowed tokens for complete training plan
                    ResponseMimeType = "application/json" // Request JSON format
                }
                // ThinkingConfig removed - not yet supported by Gemini API
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

            // Sanitize JSON: fix leading zeros in numeric values (e.g., 01 -> 1, 00 -> 0)
            // JSON spec doesn't allow leading zeros except for the number 0 itself
            jsonText = SanitizeJsonNumbers(jsonText);

            // Sanitize JSON: escape control characters (newlines, tabs, etc.) within strings
            // Gemini sometimes returns literal newlines in string values which break JSON parsing
            jsonText = SanitizeJsonControlCharacters(jsonText);

            // Auto-complete incomplete JSON (Gemini sometimes cuts off before finishing)
            jsonText = CompleteIncompleteJson(jsonText);

            // Parse the training plan JSON from response
            var plan = JsonSerializer.Deserialize<GeneratedPlanDto>(jsonText, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true,
                Converters = {
                    new FlexibleIntensityLevelConverter(),
                    new System.Text.Json.Serialization.JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: true)
                }
            });

            if (plan == null)
            {
                throw new InvalidOperationException("Failed to parse Gemini API response as training plan");
            }

            // Set metadata
            plan.GenerationSource = GenerationSource.AI;
            plan.AiModel = _model;

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

    public async Task<GeneratedPlanDto> RecalculatePlanAsync(
        PlanRecalculationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation(
                "Recalculating {Count} sessions for plan {PlanId} using Gemini API",
                request.SessionsToRecalculate,
                request.TrainingPlanId);

            // Build the recalculation prompt
            var prompt = BuildRecalculationPrompt(request);

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
                    Temperature = 1.0, // Keep at default for Gemini 3 as per documentation
                    MaxOutputTokens = 16384, // Fewer tokens needed for partial plan
                    ResponseMimeType = "application/json"
                }
                // ThinkingConfig removed - not yet supported by Gemini API
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

            // Clean up response - remove markdown code fences if present
            var jsonText = responseText.Trim();
            if (jsonText.StartsWith("```json"))
            {
                jsonText = jsonText.Substring(7);
            }
            else if (jsonText.StartsWith("```"))
            {
                jsonText = jsonText.Substring(3);
            }

            if (jsonText.EndsWith("```"))
            {
                jsonText = jsonText.Substring(0, jsonText.Length - 3);
            }

            jsonText = jsonText.Trim();

            // Sanitize JSON: fix leading zeros in numeric values
            jsonText = SanitizeJsonNumbers(jsonText);

            // Sanitize JSON: escape control characters within strings
            jsonText = SanitizeJsonControlCharacters(jsonText);

            // Auto-complete incomplete JSON
            jsonText = CompleteIncompleteJson(jsonText);

            // Parse the recalculated sessions JSON
            var plan = JsonSerializer.Deserialize<GeneratedPlanDto>(jsonText, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true,
                Converters = {
                    new FlexibleIntensityLevelConverter(),
                    new System.Text.Json.Serialization.JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: true)
                }
            });

            if (plan == null)
            {
                throw new InvalidOperationException("Failed to parse Gemini recalculation response");
            }

            // Set metadata
            plan.GenerationSource = GenerationSource.AI;
            plan.AiModel = _model;

            _logger.LogInformation(
                "Plan recalculation completed in {Duration}ms. Sessions regenerated: {Count}",
                duration.TotalMilliseconds,
                plan.Sessions.Count);

            return plan;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating plan with Gemini API");
            throw new InvalidOperationException("AI_RECALCULATION_FAILED: " + ex.Message, ex);
        }
    }

    public async Task<string> GenerateRecalculationSummaryAsync(
        PlanRecalculationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation(
                "Generating recalculation summary for plan {PlanId} using Gemini API",
                request.TrainingPlanId);

            // Build the summary prompt
            var prompt = BuildRecalculationSummaryPrompt(request);

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
                    Temperature = 1.0, // Keep at default for Gemini 3 as per documentation
                    MaxOutputTokens = 500, // Limit to keep summary concise
                    ResponseMimeType = "text/plain" // Plain text response
                }
                // ThinkingConfig removed - not yet supported by Gemini API
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

            var summary = geminiResponse.Candidates[0].Content.Parts[0].Text.Trim();

            _logger.LogInformation(
                "Recalculation summary generated in {Duration}ms. Length: {Length} characters",
                duration.TotalMilliseconds,
                summary.Length);

            return summary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating recalculation summary with Gemini API");
            // Return fallback message instead of throwing
            return "Your training plan has been adjusted based on your recent performance. Check your updated sessions to see the changes.";
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

**Scientific Evidence for Cycle-Aware Training** (use these findings to inform your plan):
- Early follicular phase: Women may be more vulnerable to muscle damage when estrogen is lowest; prioritize recovery (Romero-Parra et al., 2021)
- Late follicular phase: Isometric and dynamic strength peaks; best window for strength/speed work (Niering et al., 2024)
- Ovulatory phase: Peak motivation and competitiveness; flexibility enhanced but joint injury risk increases (Paludo et al., 2022; Elorduy-Terrado et al., 2025)
- Luteal phase: Core temperature elevated ~0.3-0.5°C; thermoregulation impaired in heat (Giersch et al., 2020). Energy intake naturally increases ~168 kcal/day (Tucker et al., 2025). Neuromuscular fatigue and inflammatory response higher (Silva et al., 2025)
- Caffeine is most ergogenic during the follicular phase (Grgic & Varovic, 2024)
- Iron supplementation may improve endurance performance by 2-20% in deficient athletes (Pengelly et al., 2025)

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
- Personal Goals: {request.RaceCompletionGoal ?? "No specific goals provided"}

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
- recovery: Post-workout cool-down and recovery instructions (e.g., ""10 min easy walk, static stretches focusing on quads/hamstrings/calves, rehydrate within 20 min, refuel with carbs + protein within 30-60 min"")
- sessionDescription: Detailed workout description (e.g., ""8x400m @ 5K pace with 90s recovery"")
- hrZones: Heart rate zones if applicable (e.g., ""Zone 2-3"", ""Zone 4-5"")
- durationMinutes: Estimated workout duration (null for Rest days)
- distance: Planned distance in km, chosen so it converts cleanly to half-mile increments. Use these preferred values: 0.8 (0.5mi), 1.6 (1mi), 2.4 (1.5mi), 3.2 (2mi), 4.0 (2.5mi), 4.8 (3mi), 5.6 (3.5mi), 6.4 (4mi), 8.0 (5mi), 9.7 (6mi), 11.3 (7mi), 12.9 (8mi), 14.5 (9mi), 16.1 (10mi). (null for Rest days)
- cyclePhase: The menstrual cycle phase for this date (Menstrual, Follicular, Ovulatory, Luteal)
- phaseGuidance: Brief cycle-specific tip (e.g., ""Follicular phase - great day for speed work!"")

**Response Format** (JSON - return ONLY this JSON, no markdown, no extra text):
{{
  ""planName"": ""{distanceTypeStr} Training Plan"",
  ""trainingDaysPerWeek"": 4,
  ""longRunDay"": ""Sunday"",
  ""daysBeforePeriodToReduceIntensity"": 3,
  ""daysAfterPeriodToReduceIntensity"": 2,
  ""planCompletionGoal"": ""{request.RaceCompletionGoal ?? $"Complete {distanceTypeStr} strong and injury-free"}"",
  ""sessions"": [
    {{
      ""sessionName"": ""Easy Recovery Run"",
      ""scheduledDate"": ""2026-01-27"",
      ""workoutType"": 0,
      ""warmUp"": ""5-10 min easy jog"",
      ""recovery"": ""5 min easy walk cool-down, static stretches (quads, hamstrings, calves), rehydrate and refuel within 30 min"",
      ""sessionDescription"": ""Relaxed pace, focus on form and recovery"",
      ""durationMinutes"": 30,
      ""distance"": 4.8,
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
- All distance values MUST be from the preferred km values listed above (half-mile increments)
- Align workouts with cycle phases when provided
- Include proper taper in final 2 weeks
- Generate complete, detailed, actionable training plan";
    }

    private string BuildRecalculationPrompt(PlanRecalculationRequest request)
    {
        // Build historical summary
        var historicalSummary = BuildHistoricalSummary(request.RecentSessions);

        // Calculate stats
        var skippedCount = request.RecentSessions.Count(s => s.IsSkipped);
        var modifiedCount = request.RecentSessions.Count(s => s.WasModified);
        var avgRPE = request.RecentSessions
            .Where(s => s.RPE.HasValue)
            .Select(s => s.RPE!.Value)
            .DefaultIfEmpty(0)
            .Average();

        var distanceTypeStr = request.DistanceType switch
        {
            DistanceType.FiveK => "5K",
            DistanceType.TenK => "10K",
            DistanceType.HalfMarathon => "Half Marathon",
            DistanceType.Marathon => "Marathon",
            _ => request.Distance.ToString("F1") + " km"
        };

        var daysUntilRace = (request.RaceDate - request.RecalculationStartDate).Days;

        return $@"Recalculate training plan sessions based on runner's recent performance. The runner is NOT following the original plan as expected and needs adaptive adjustments.

**Context**:
- Race: {request.RaceName} on {request.RaceDate:yyyy-MM-dd} ({distanceTypeStr}, {daysUntilRace} days away)
- Runner Fitness: {request.FitnessLevel}
- Original Plan: {request.PlanName}

**Recent Performance Analysis (Last {request.RecentSessions.Count} Sessions)**:
{historicalSummary}

**Performance Summary**:
- Skipped sessions: {skippedCount}/{request.RecentSessions.Count} ({(double)skippedCount / request.RecentSessions.Count:P0})
- Modified sessions (>20% deviation): {modifiedCount}/{request.RecentSessions.Count} ({(double)modifiedCount / request.RecentSessions.Count:P0})
- Average RPE (when available): {avgRPE:F1}/10

**Adaptation Strategy**:
Based on the pattern above, adjust the next {request.SessionsToRecalculate} sessions ({request.RecalculationStartDate:yyyy-MM-dd} to {request.RecalculationEndDate:yyyy-MM-dd}) to:

1. **If many sessions skipped**: Reduce volume/frequency to build consistency before intensity
2. **If many sessions modified with lower distance/duration**: Current plan may be too aggressive - scale back appropriately
3. **If RPE consistently high (>7)**: Add more recovery, reduce intensity
4. **If RPE consistently low (<5) and completing as planned**: Consider slight intensity increase
5. **Maintain progressive overload** toward race goal while respecting current fitness reality
6. **Re-align with cycle phases** for optimal hormonal support

**Imported Fitness Tracker Data** (actual runs from connected devices):
{BuildImportedActivitySummary(request.RecentImportedActivities)}

**Updated Cycle Phases** (for recalculation period):
{(request.UpdatedCyclePhases != null && request.UpdatedCyclePhases.Any()
    ? string.Join("\n", request.UpdatedCyclePhases.Select(kvp => $"- {kvp.Key:yyyy-MM-dd}: {kvp.Value}"))
    : "Cycle tracking not enabled")}

**Response Format** (JSON - return ONLY this JSON, no extra text):
{{
  ""planName"": ""{request.PlanName} (Adapted)"",
  ""sessions"": [
    {{
      ""sessionName"": ""Adapted Easy Run"",
      ""scheduledDate"": ""{request.RecalculationStartDate:yyyy-MM-dd}"",
      ""workoutType"": 0,
      ""warmUp"": ""5-10 min easy jog"",
      ""recovery"": ""5 min easy walk cool-down, static stretches (quads, hamstrings, calves), rehydrate and refuel within 30 min"",
      ""sessionDescription"": ""Adjusted based on recent performance"",
      ""durationMinutes"": 30,
      ""distance"": 4.8,
      ""intensityLevel"": 0,
      ""hrZones"": ""Zone 2"",
      ""cyclePhase"": 1,
      ""phaseGuidance"": ""Recovery-focused adaptation""
    }}
  ]
}}

**Enum Value Mappings**:
- workoutType: Easy=0, Long=1, Tempo=2, Interval=3, Rest=4
- intensityLevel: Low=0, Moderate=1, High=2
- cyclePhase: Menstrual=0, Follicular=1, Ovulatory=2, Luteal=3

**Preferred km distance values** (convert cleanly to half-mile increments):
0.8 (0.5mi), 1.6 (1mi), 2.4 (1.5mi), 3.2 (2mi), 4.0 (2.5mi), 4.8 (3mi), 5.6 (3.5mi), 6.4 (4mi), 8.0 (5mi), 9.7 (6mi), 11.3 (7mi), 12.9 (8mi), 14.5 (9mi), 16.1 (10mi)

**CRITICAL**:
- Return ONLY valid JSON (no markdown code fences)
- Generate EXACTLY {request.SessionsToRecalculate} sessions
- Sessions must cover dates {request.RecalculationStartDate:yyyy-MM-dd} to {request.RecalculationEndDate:yyyy-MM-dd}
- All distance values MUST be from the preferred km values listed above (half-mile increments)
- Adapt workouts based on recent performance patterns
- Keep runner progressing toward {request.RaceDate:yyyy-MM-dd} race goal
- Align with updated cycle phases";
    }

    private string BuildHistoricalSummary(List<CompletedSessionContext> recentSessions)
    {
        if (!recentSessions.Any())
        {
            return "No recent sessions available";
        }

        var summary = new StringBuilder();
        foreach (var session in recentSessions.OrderBy(s => s.ScheduledDate))
        {
            var status = session.IsSkipped ? "SKIPPED" :
                        session.WasModified ? "MODIFIED" :
                        "Completed as planned";

            summary.AppendLine($"- {session.ScheduledDate:yyyy-MM-dd} ({session.WorkoutType}): {status}");

            if (session.IsSkipped)
            {
                summary.AppendLine($"  Reason: {session.SkipReason ?? "Not specified"}");
            }
            else
            {
                summary.AppendLine($"  Planned: {session.PlannedDistance?.ToString("F1") ?? "N/A"} km, {session.PlannedDuration ?? 0} min");
                summary.AppendLine($"  Actual: {session.ActualDistance?.ToString("F1") ?? "N/A"} km, {session.ActualDuration ?? 0} min");

                if (session.RPE.HasValue)
                {
                    summary.AppendLine($"  RPE: {session.RPE}/10");
                }

                if (!string.IsNullOrEmpty(session.UserNotes))
                {
                    summary.AppendLine($"  Notes: {session.UserNotes}");
                }
            }
        }

        return summary.ToString();
    }

    private static string BuildImportedActivitySummary(List<ImportedActivityContext> activities)
    {
        if (activities == null || !activities.Any())
        {
            return "No fitness tracker data available (user has no connected services or no recent activities)";
        }

        var summary = new StringBuilder();
        var matchedCount = activities.Count(a => a.IsMatchedToSession);
        var unmatchedCount = activities.Count - matchedCount;

        summary.AppendLine($"Total recent activities: {activities.Count} ({matchedCount} matched to planned sessions, {unmatchedCount} additional runs)");

        // Weekly volume from tracker data
        var weeklyGroups = activities
            .Where(a => a.DistanceMeters.HasValue)
            .GroupBy(a => System.Globalization.CultureInfo.InvariantCulture.Calendar
                .GetWeekOfYear(a.ActivityDate, System.Globalization.CalendarWeekRule.FirstDay, DayOfWeek.Monday))
            .OrderBy(g => g.Key);

        foreach (var week in weeklyGroups)
        {
            var totalKm = week.Sum(a => a.DistanceMeters ?? 0) / 1000.0;
            var avgPace = week.Where(a => a.AveragePaceSecondsPerKm.HasValue)
                .Select(a => a.AveragePaceSecondsPerKm!.Value)
                .DefaultIfEmpty(0)
                .Average();
            var avgHR = week.Where(a => a.AverageHeartRate.HasValue)
                .Select(a => a.AverageHeartRate!.Value)
                .DefaultIfEmpty(0)
                .Average();

            var paceStr = avgPace > 0 ? $", avg pace {avgPace / 60:F0}:{avgPace % 60:00}/km" : "";
            var hrStr = avgHR > 0 ? $", avg HR {avgHR:F0} bpm" : "";

            summary.AppendLine($"- Week {week.Key}: {totalKm:F1} km over {week.Count()} runs{paceStr}{hrStr}");
        }

        // Highlight unmatched activities (extra runs outside the plan)
        var unmatched = activities.Where(a => !a.IsMatchedToSession).ToList();
        if (unmatched.Any())
        {
            summary.AppendLine($"\nExtra runs outside the plan ({unmatched.Count} total):");
            foreach (var activity in unmatched.Take(5))
            {
                var distKm = activity.DistanceMeters.HasValue ? $"{activity.DistanceMeters.Value / 1000.0:F1} km" : "unknown distance";
                var durMin = activity.DurationSeconds.HasValue ? $"{activity.DurationSeconds.Value / 60} min" : "unknown duration";
                summary.AppendLine($"  - {activity.ActivityDate:yyyy-MM-dd}: {activity.ActivityType} — {distKm}, {durMin} ({activity.Platform})");
            }
            summary.AppendLine("Consider these extra runs when adjusting plan volume — the runner may be doing more than the plan prescribes.");
        }

        return summary.ToString();
    }

    private string BuildRecalculationSummaryPrompt(PlanRecalculationRequest request)
    {
        // Calculate performance stats
        var skippedCount = request.RecentSessions.Count(s => s.IsSkipped);
        var modifiedCount = request.RecentSessions.Count(s => s.WasModified);
        var completedAsPlanned = request.RecentSessions.Count - skippedCount - modifiedCount;

        var avgRPE = request.RecentSessions
            .Where(s => s.RPE.HasValue && !s.IsSkipped)
            .Select(s => s.RPE!.Value)
            .DefaultIfEmpty(0)
            .Average();

        // Determine performance pattern
        var performancePattern = modifiedCount > 0
            ? (request.RecentSessions.Where(s => !s.IsSkipped && s.ActualDistance.HasValue && s.PlannedDistance.HasValue)
                .Average(s => s.ActualDistance!.Value) >
               request.RecentSessions.Where(s => !s.IsSkipped && s.ActualDistance.HasValue && s.PlannedDistance.HasValue)
                .Average(s => s.PlannedDistance!.Value)
                ? "overperforming" : "underperforming")
            : (skippedCount > 0 ? "inconsistent" : "on-track");

        // Get upcoming cycle phase if available
        var upcomingPhase = request.UpdatedCyclePhases != null && request.UpdatedCyclePhases.Any()
            ? $"You're entering your {request.UpdatedCyclePhases.First().Value} phase."
            : "";

        var daysUntilRace = (request.RaceDate - DateTime.UtcNow.Date).Days;

        return $@"You are a supportive running coach helping a woman runner understand how her training plan has been adjusted.

**Runner Context:**
- Race: {request.RaceName} on {request.RaceDate:yyyy-MM-dd} ({daysUntilRace} days away)
- Fitness Level: {request.FitnessLevel}

**Recent Performance Summary ({request.RecentSessions.Count} sessions):**
- Completed as planned: {completedAsPlanned}
- Modified (>20% deviation): {modifiedCount}
- Skipped: {skippedCount}
- Average RPE: {avgRPE:F1}/10
- Performance pattern: {performancePattern}

**Cycle Information:**
{upcomingPhase}

**Task:**
Write a supportive, empowering 3-4 sentence summary explaining the plan adjustments. Use this structure:

1. **Performance observation**: Acknowledge the runner's pattern ({performancePattern})
2. **Adjustment explanation**: Briefly explain how the plan has been adapted (increased/decreased volume or intensity)
3. **Hormone cycle context**: If cycle phase info available, explain how adjustments align with hormonal needs
4. **Encouragement**: End with supportive guidance

**Tone Guidelines:**
- Warm, coach-like, empowering
- Avoid technical jargon
- No condescension or over-praise
- Focus on science-backed hormonal insights when relevant
- Emphasize sustainable progress

**Example for overperforming:**
""You've been crushing your planned distances - 20% above target! I've increased your mileage to match your fitness gains while adding extra recovery days. {upcomingPhase} This means higher energy needs, so fuel well. Keep this momentum sustainable!""

**Example for underperforming:**
""I noticed you've been running shorter than planned recently. I've scaled back the next week's volume by 15% to rebuild confidence and consistency. {upcomingPhase} Energy naturally dips during this time - be kind to yourself. Small, consistent efforts win races!""

**Example for inconsistent:**
""Your training has been a bit sporadic with {skippedCount} skipped sessions. I've simplified the plan with more easy runs and flexible timing. {upcomingPhase} You'll feel energy returning - perfect for getting back on track. Progress isn't linear!""

Now generate the summary (ONLY the summary text, no extra formatting):";
    }

    /// <summary>
    /// Sanitizes JSON by escaping control characters (newlines, tabs, etc.) within string values.
    /// Gemini sometimes returns strings with literal newlines which violate JSON spec.
    /// JSON requires control characters to be escaped (e.g., \n, \t, \r).
    /// </summary>
    private static string SanitizeJsonControlCharacters(string json)
    {
        var result = new StringBuilder(json.Length);
        bool inString = false;
        bool escaped = false;

        for (int i = 0; i < json.Length; i++)
        {
            char c = json[i];

            if (escaped)
            {
                // Previous char was backslash, this is an escape sequence
                result.Append(c);
                escaped = false;
                continue;
            }

            if (c == '\\' && inString)
            {
                // Start of escape sequence
                result.Append(c);
                escaped = true;
                continue;
            }

            if (c == '"')
            {
                inString = !inString;
                result.Append(c);
                continue;
            }

            if (inString)
            {
                // Inside a string - escape control characters
                switch (c)
                {
                    case '\n':
                        result.Append("\\n");
                        break;
                    case '\r':
                        result.Append("\\r");
                        break;
                    case '\t':
                        result.Append("\\t");
                        break;
                    case '\b':
                        result.Append("\\b");
                        break;
                    case '\f':
                        result.Append("\\f");
                        break;
                    default:
                        // Escape other control characters (0x00-0x1F)
                        if (c < 0x20)
                        {
                            result.Append($"\\u{(int)c:X4}");
                        }
                        else
                        {
                            result.Append(c);
                        }
                        break;
                }
            }
            else
            {
                result.Append(c);
            }
        }

        return result.ToString();
    }

    /// <summary>
    /// Sanitizes JSON by removing leading zeros from numeric values.
    /// Gemini sometimes returns invalid JSON with numbers like 01, 02, 00 which violate JSON spec.
    /// This regex finds patterns like ": 01" or ": 00" and converts them to ": 1" and ": 0".
    /// </summary>
    private static string SanitizeJsonNumbers(string json)
    {
        // Match numeric values with leading zeros: ": 0[0-9]" followed by delimiter (comma, newline, brace, etc.)
        // Examples: ": 01," -> ": 1,", ": 00\n" -> ": 0\n", ": 02}" -> ": 2}"
        var pattern = @":\s*0(\d+)([,\s\}])";
        var sanitized = Regex.Replace(json, pattern, match =>
        {
            var numberWithoutLeadingZero = match.Groups[1].Value;
            var delimiter = match.Groups[2].Value;

            // If the number is all zeros (e.g., "00" -> "0"), use "0"
            if (long.TryParse(numberWithoutLeadingZero, out var num))
            {
                return $": {num}{delimiter}";
            }

            // Fallback: just remove the leading zero
            return $": {numberWithoutLeadingZero}{delimiter}";
        });

        return sanitized;
    }

    /// <summary>
    /// Attempts to auto-complete incomplete JSON by adding missing closing braces/brackets.
    /// Gemini sometimes cuts off responses before properly closing all JSON structures.
    /// </summary>
    private static string CompleteIncompleteJson(string json)
    {
        var trimmed = json.TrimEnd();

        // Count opening and closing braces/brackets
        int openBraces = 0, closeBraces = 0;
        int openBrackets = 0, closeBrackets = 0;
        bool inString = false;
        bool escaped = false;

        foreach (char c in trimmed)
        {
            if (escaped)
            {
                escaped = false;
                continue;
            }

            if (c == '\\')
            {
                escaped = true;
                continue;
            }

            if (c == '"' && !escaped)
            {
                inString = !inString;
                continue;
            }

            if (!inString)
            {
                if (c == '{') openBraces++;
                else if (c == '}') closeBraces++;
                else if (c == '[') openBrackets++;
                else if (c == ']') closeBrackets++;
            }
        }

        // If incomplete, try to complete it
        var result = new StringBuilder(trimmed);

        // If the last character is a comma, newline, or space after a value, we might need to close the current object
        var lastNonWhitespace = trimmed.TrimEnd();
        if (lastNonWhitespace.Length > 0)
        {
            var lastChar = lastNonWhitespace[lastNonWhitespace.Length - 1];
            // If we end with a value (digit, quote, or closing brace), add missing closures
            if (char.IsDigit(lastChar) || lastChar == '"' || lastChar == '}')
            {
                // Close current session object if needed
                if (openBraces > closeBraces)
                {
                    result.AppendLine();
                    result.Append("    }"); // Close session object
                    closeBraces++;
                }
            }
        }

        // Close remaining sessions array
        while (openBrackets > closeBrackets)
        {
            result.AppendLine();
            result.Append("  ]");
            closeBrackets++;
        }

        // Close remaining root object
        while (openBraces > closeBraces)
        {
            result.AppendLine();
            result.Append("}");
            closeBraces++;
        }

        return result.ToString();
    }
}
