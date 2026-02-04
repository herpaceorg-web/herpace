using System.Text;
using System.Text.Json;
using HerPace.Core.Entities;
using HerPace.Core.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.AI;

/// <summary>
/// Generates workout-specific tips using Gemini Flash.
/// Creates 3 actionable tips per session combining pacing, technique, and hormone cycle guidance.
/// </summary>
public class WorkoutTipsGenerator
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WorkoutTipsGenerator> _logger;
    private readonly string _apiKey;
    private readonly string _apiUrl;

    public WorkoutTipsGenerator(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<WorkoutTipsGenerator> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        _apiKey = (_configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API key is not configured")).Trim();

        // Use Flash model for cost-effective tip generation
        var model = "gemini-2.0-flash-exp";
        _apiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";
    }

    /// <summary>
    /// Generate workout tips for a list of training sessions.
    /// Processes sessions in batches to avoid context window issues.
    /// </summary>
    public async Task<Dictionary<Guid, List<string>>> GenerateTipsForSessionsAsync(
        List<TrainingSession> sessions,
        string raceGoal,
        CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<Guid, List<string>>();

        // Process in batches of 15 sessions to avoid context window issues
        const int batchSize = 15;
        for (int i = 0; i < sessions.Count; i += batchSize)
        {
            var batch = sessions.Skip(i).Take(batchSize).ToList();
            var batchTips = await GenerateTipsBatchAsync(batch, raceGoal, cancellationToken);

            foreach (var kvp in batchTips)
            {
                result[kvp.Key] = kvp.Value;
            }
        }

        return result;
    }

    private async Task<Dictionary<Guid, List<string>>> GenerateTipsBatchAsync(
        List<TrainingSession> sessions,
        string raceGoal,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Generating tips for {Count} sessions", sessions.Count);

            var prompt = BuildTipsPrompt(sessions, raceGoal);

            // Create Gemini API request
            var geminiRequest = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.9,
                    maxOutputTokens = 8192,
                    responseMimeType = "application/json"
                }
            };

            var jsonRequest = JsonSerializer.Serialize(geminiRequest, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, _apiUrl);
            httpRequest.Headers.Add("x-goog-api-key", _apiKey);
            httpRequest.Content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

            var httpResponse = await _httpClient.SendAsync(httpRequest, cancellationToken);
            httpResponse.EnsureSuccessStatusCode();

            var jsonResponse = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
            var geminiResponse = JsonSerializer.Deserialize<JsonElement>(jsonResponse);

            // Extract text from response
            var text = geminiResponse
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "{}";

            // Parse the JSON response into our format
            var tipsResponse = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(text);

            if (tipsResponse == null)
            {
                _logger.LogWarning("Failed to parse tips response, returning empty dictionary");
                return new Dictionary<Guid, List<string>>();
            }

            // Map session names back to IDs
            var result = new Dictionary<Guid, List<string>>();
            foreach (var session in sessions)
            {
                var key = $"{session.SessionName}_{session.ScheduledDate:yyyy-MM-dd}";
                if (tipsResponse.TryGetValue(key, out var tips))
                {
                    result[session.Id] = tips;
                }
                else
                {
                    _logger.LogWarning("No tips generated for session {SessionId} ({Name})",
                        session.Id, session.SessionName);
                    result[session.Id] = new List<string>();
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate workout tips batch");
            // Return empty tips on failure
            return sessions.ToDictionary(s => s.Id, s => new List<string>());
        }
    }

    private string BuildTipsPrompt(List<TrainingSession> sessions, string raceGoal)
    {
        var sb = new StringBuilder();

        sb.AppendLine("You are an expert running coach creating specific, actionable workout guidance.");
        sb.AppendLine($"The runner is training for: {raceGoal}");
        sb.AppendLine();
        sb.AppendLine("For each training session below, generate EXACTLY 3 concise, actionable tips that combine:");
        sb.AppendLine("1. Pacing/effort guidance (heart rate zones, perceived effort, breathing)");
        sb.AppendLine("2. Technique or focus points specific to this workout type");
        sb.AppendLine("3. Hormone cycle considerations for the session's cycle phase");
        sb.AppendLine();
        sb.AppendLine("Guidelines:");
        sb.AppendLine("- Each tip should be 1-2 sentences maximum");
        sb.AppendLine("- Use conversational, encouraging language");
        sb.AppendLine("- Make tips actionable and specific to the workout");
        sb.AppendLine("- For menstrual phase: acknowledge lower energy, suggest gentler approaches");
        sb.AppendLine("- For follicular phase: emphasize building strength and endurance");
        sb.AppendLine("- For ovulatory phase: encourage intensity and performance");
        sb.AppendLine("- For luteal phase: focus on consistency and recovery");
        sb.AppendLine();
        sb.AppendLine("Return a JSON object where keys are \"SessionName_YYYY-MM-DD\" and values are arrays of 3 tip strings.");
        sb.AppendLine();
        sb.AppendLine("Sessions:");

        foreach (var session in sessions)
        {
            var key = $"{session.SessionName}_{session.ScheduledDate:yyyy-MM-dd}";
            var phaseLabel = session.CyclePhase.HasValue ? GetPhaseLabel(session.CyclePhase.Value) : "N/A";
            var workoutTypeLabel = GetWorkoutTypeLabel(session.WorkoutType);

            sb.AppendLine($"- {key}:");
            sb.AppendLine($"  Type: {workoutTypeLabel}");
            sb.AppendLine($"  Duration: {session.DurationMinutes ?? 0} min");
            sb.AppendLine($"  Distance: {session.Distance ?? 0} km");
            sb.AppendLine($"  Intensity: {session.IntensityLevel}");
            sb.AppendLine($"  Cycle Phase: {phaseLabel}");
            if (!string.IsNullOrEmpty(session.SessionDescription))
            {
                sb.AppendLine($"  Description: {session.SessionDescription}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("Example response format:");
        sb.AppendLine("{");
        sb.AppendLine("  \"30 Minute Easy Run_2026-02-05\": [");
        sb.AppendLine("    \"Aim to keep your heart rate in Zone 2, or run at a pace you can breathe in and out of your mouth comfortably.\",");
        sb.AppendLine("    \"If you feel good, you can pick up the pace slightly in the last 5 minutes.\",");
        sb.AppendLine("    \"During menstruation, energy may be lower - listen to your body and adjust effort as needed.\"");
        sb.AppendLine("  ]");
        sb.AppendLine("}");

        return sb.ToString();
    }

    private string GetPhaseLabel(CyclePhase phase)
    {
        return phase switch
        {
            CyclePhase.Menstrual => "Menstrual (Days 1-5)",
            CyclePhase.Follicular => "Follicular (Days 6-14)",
            CyclePhase.Ovulatory => "Ovulatory (Days 15-17)",
            CyclePhase.Luteal => "Luteal (Days 18-28)",
            _ => "Unknown"
        };
    }

    private string GetWorkoutTypeLabel(WorkoutType type)
    {
        return type switch
        {
            WorkoutType.Easy => "Easy Run",
            WorkoutType.Long => "Long Run",
            WorkoutType.Tempo => "Tempo Run",
            WorkoutType.Interval => "Interval Training",
            WorkoutType.Rest => "Rest Day",
            _ => "Unknown"
        };
    }
}
