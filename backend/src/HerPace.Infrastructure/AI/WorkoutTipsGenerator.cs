using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.AI;

/// <summary>
/// Generates workout-specific tips using Gemini Flash.
/// Creates 3 actionable tips per session combining pacing, technique, and hormone cycle guidance.
/// Tips now include research citations from the evidence library.
/// </summary>
public class WorkoutTipsGenerator
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WorkoutTipsGenerator> _logger;
    private readonly HerPaceDbContext _context;
    private readonly string _apiKey;
    private readonly string _apiUrl;

    public WorkoutTipsGenerator(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<WorkoutTipsGenerator> logger,
        HerPaceDbContext context)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _context = context;

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
    public async Task<Dictionary<Guid, List<WorkoutTipDto>>> GenerateTipsForSessionsAsync(
        List<TrainingSession> sessions,
        string raceGoal,
        CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<Guid, List<WorkoutTipDto>>();

        // Pre-load phase-relevant research for all phases in this batch
        var phases = sessions
            .Where(s => s.CyclePhase.HasValue)
            .Select(s => s.CyclePhase!.Value)
            .Distinct()
            .ToList();

        var phaseResearch = await LoadPhaseResearchAsync(phases, cancellationToken);

        // Process in batches of 15 sessions to avoid context window issues
        const int batchSize = 15;
        for (int i = 0; i < sessions.Count; i += batchSize)
        {
            var batch = sessions.Skip(i).Take(batchSize).ToList();
            var batchTips = await GenerateTipsBatchAsync(batch, raceGoal, phaseResearch, cancellationToken);

            foreach (var kvp in batchTips)
            {
                result[kvp.Key] = kvp.Value;
            }
        }

        return result;
    }

    /// <summary>
    /// Legacy overload returning List&lt;string&gt; for backward compatibility.
    /// </summary>
    public async Task<Dictionary<Guid, List<string>>> GenerateTipsForSessionsAsStringsAsync(
        List<TrainingSession> sessions,
        string raceGoal,
        CancellationToken cancellationToken = default)
    {
        var richTips = await GenerateTipsForSessionsAsync(sessions, raceGoal, cancellationToken);
        return richTips.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.Select(t => t.Text).ToList());
    }

    private async Task<Dictionary<CyclePhase, List<(int StudyId, string ShortCitation, string Finding)>>> LoadPhaseResearchAsync(
        List<CyclePhase> phases,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<CyclePhase, List<(int, string, string)>>();

        if (!phases.Any())
            return result;

        var mappings = await _context.PhaseStudyMappings
            .Where(psm => phases.Contains(psm.Phase))
            .Include(psm => psm.ResearchStudy)
            .Where(psm => psm.ResearchStudy.EvidenceTier == "A" || psm.ResearchStudy.EvidenceTier == "B")
            .OrderBy(psm => psm.ResearchStudy.EvidenceTier)
            .ToListAsync(cancellationToken);

        foreach (var phase in phases)
        {
            var phaseMappings = mappings
                .Where(m => m.Phase == phase)
                .Take(5) // Limit to 5 studies per phase to keep prompt manageable
                .Select(m =>
                {
                    var shortCitation = ExtractShortCitation(m.ResearchStudy.Citation, m.ResearchStudy.PublicationYear);
                    var finding = m.ResearchStudy.KeyFindings.Length > 200
                        ? m.ResearchStudy.KeyFindings[..200] + "..."
                        : m.ResearchStudy.KeyFindings;
                    return (m.ResearchStudyId, shortCitation, finding);
                })
                .ToList();
            result[phase] = phaseMappings;
        }

        return result;
    }

    private static string ExtractShortCitation(string fullCitation, int? year)
    {
        // Extract "LastName et al., Year" from full APA citation
        var match = Regex.Match(fullCitation, @"^([A-Za-zÀ-ÿ\-]+),");
        var lastName = match.Success ? match.Groups[1].Value : "Unknown";
        var yearStr = year?.ToString() ?? "n.d.";

        // Check if there are multiple authors
        var hasMultipleAuthors = fullCitation.Contains("&") || fullCitation.Contains("et al.");
        return hasMultipleAuthors ? $"{lastName} et al., {yearStr}" : $"{lastName}, {yearStr}";
    }

    private async Task<Dictionary<Guid, List<WorkoutTipDto>>> GenerateTipsBatchAsync(
        List<TrainingSession> sessions,
        string raceGoal,
        Dictionary<CyclePhase, List<(int StudyId, string ShortCitation, string Finding)>> phaseResearch,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Generating tips for {Count} sessions", sessions.Count);

            var prompt = BuildTipsPrompt(sessions, raceGoal, phaseResearch);

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
                return new Dictionary<Guid, List<WorkoutTipDto>>();
            }

            // Build a lookup of all studies referenced in phaseResearch
            var allStudies = phaseResearch.Values
                .SelectMany(v => v)
                .GroupBy(v => v.StudyId)
                .ToDictionary(g => g.Key, g => g.First());

            // Map session names back to IDs and parse citations
            var result = new Dictionary<Guid, List<WorkoutTipDto>>();
            foreach (var session in sessions)
            {
                var key = $"{session.SessionName}_{session.ScheduledDate:yyyy-MM-dd}";
                if (tipsResponse.TryGetValue(key, out var tips))
                {
                    result[session.Id] = tips.Select(tipText => ParseTipWithCitations(tipText, allStudies)).ToList();
                }
                else
                {
                    _logger.LogWarning("No tips generated for session {SessionId} ({Name})",
                        session.Id, session.SessionName);
                    result[session.Id] = new List<WorkoutTipDto>();
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate workout tips batch");
            // Return empty tips on failure
            return sessions.ToDictionary(s => s.Id, _ => new List<WorkoutTipDto>());
        }
    }

    /// <summary>
    /// Parses a tip string for [Study N] markers and resolves them to StudyCitationDto objects.
    /// </summary>
    private static WorkoutTipDto ParseTipWithCitations(
        string tipText,
        Dictionary<int, (int StudyId, string ShortCitation, string Finding)> allStudies)
    {
        var citations = new List<StudyCitationDto>();
        var cleanText = tipText;

        // Find all [Study N] markers
        var matches = Regex.Matches(tipText, @"\[Study\s+(\d+)\]");
        foreach (Match match in matches)
        {
            if (int.TryParse(match.Groups[1].Value, out var studyId) && allStudies.TryGetValue(studyId, out var study))
            {
                citations.Add(new StudyCitationDto
                {
                    Id = studyId,
                    ShortCitation = study.ShortCitation
                });
            }
            // Remove the marker from the display text
            cleanText = cleanText.Replace(match.Value, "").Trim();
        }

        // Clean up double spaces
        cleanText = Regex.Replace(cleanText, @"\s{2,}", " ").Trim();
        // Remove trailing period-space patterns
        cleanText = cleanText.TrimEnd();

        return new WorkoutTipDto
        {
            Text = cleanText,
            Citations = citations
        };
    }

    private string BuildTipsPrompt(
        List<TrainingSession> sessions,
        string raceGoal,
        Dictionary<CyclePhase, List<(int StudyId, string ShortCitation, string Finding)>> phaseResearch)
    {
        var sb = new StringBuilder();

        sb.AppendLine("You are an expert running coach creating specific, actionable workout guidance backed by scientific research.");
        sb.AppendLine($"The runner is training for: {raceGoal}");
        sb.AppendLine();

        // Add research context
        if (phaseResearch.Any())
        {
            sb.AppendLine("=== RESEARCH CONTEXT ===");
            sb.AppendLine("Use these peer-reviewed findings to inform your tips. Cite studies using [Study N] format.");
            sb.AppendLine();
            foreach (var (phase, studies) in phaseResearch)
            {
                sb.AppendLine($"**{phase} Phase Research:**");
                foreach (var (studyId, shortCitation, finding) in studies)
                {
                    sb.AppendLine($"- [Study {studyId}] ({shortCitation}): {finding}");
                }
                sb.AppendLine();
            }
        }

        sb.AppendLine("For each training session below, generate EXACTLY 3 concise, actionable tips that combine:");
        sb.AppendLine("1. Pacing/effort guidance (heart rate zones, perceived effort, breathing)");
        sb.AppendLine("2. Technique or focus points specific to this workout type");
        sb.AppendLine("3. Hormone cycle considerations for the session's cycle phase, citing relevant studies with [Study N]");
        sb.AppendLine();
        sb.AppendLine("Guidelines:");
        sb.AppendLine("- Each tip should be 1-2 sentences maximum");
        sb.AppendLine("- Use conversational, encouraging language");
        sb.AppendLine("- Make tips actionable and specific to the workout");
        sb.AppendLine("- Include at least one [Study N] citation per session where relevant research exists");
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
        sb.AppendLine("    \"During the follicular phase, caffeine has the largest ergogenic effect [Study 27]. Consider a cup of coffee 30-60 min before your interval session.\",");
        sb.AppendLine("    \"Your body recovers faster during this phase [Study 6] — enjoy the extra energy!\"");
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
