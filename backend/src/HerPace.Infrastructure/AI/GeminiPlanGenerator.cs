using System.Text;
using System.Text.Json;
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

            // Parse the recalculated sessions JSON
            var plan = JsonSerializer.Deserialize<GeneratedPlanDto>(jsonText, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
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
      ""distance"": 5.0,
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

**CRITICAL**:
- Return ONLY valid JSON (no markdown code fences)
- Generate EXACTLY {request.SessionsToRecalculate} sessions
- Sessions must cover dates {request.RecalculationStartDate:yyyy-MM-dd} to {request.RecalculationEndDate:yyyy-MM-dd}
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
}
