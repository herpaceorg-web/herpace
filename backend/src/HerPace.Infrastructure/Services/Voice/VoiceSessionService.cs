using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.Services.Voice;

/// <summary>
/// Service for generating ephemeral tokens for Gemini Live API voice sessions.
/// Uses client-to-server architecture where the browser connects directly to Gemini.
/// </summary>
public class VoiceSessionService : IVoiceSessionService
{
    private readonly HttpClient _httpClient;
    private readonly HerPaceDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<VoiceSessionService> _logger;
    private readonly string _apiKey;
    private readonly string _liveModel;

    // Gemini Live API model for native audio
    private const string DefaultLiveModel = "gemini-2.5-flash-native-audio-preview-12-2025";

    public VoiceSessionService(
        HttpClient httpClient,
        HerPaceDbContext context,
        IConfiguration configuration,
        ILogger<VoiceSessionService> logger)
    {
        _httpClient = httpClient;
        _context = context;
        _configuration = configuration;
        _logger = logger;

        _apiKey = (_configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API key is not configured")).Trim();

        _liveModel = _configuration["Gemini:LiveModel"] ?? DefaultLiveModel;

        _logger.LogInformation("VoiceSessionService initialized with model: {Model}", _liveModel);
    }

    public async Task<VoiceSessionTokenResponse> GenerateSessionTokenAsync(Guid runnerId, Guid? sessionId)
    {
        _logger.LogInformation("Generating voice session token for runner {RunnerId}, session {SessionId}", runnerId, sessionId);

        // Get session context if provided
        VoiceSessionContextDto? sessionContext = null;
        if (sessionId.HasValue)
        {
            sessionContext = await GetSessionContextAsync(sessionId.Value, runnerId);
        }

        // Build system instruction for the frontend to use
        var systemInstruction = BuildSystemInstruction(sessionContext);

        // Note: The ephemeral token REST API is not publicly available.
        // For now, we return the API key directly for use in the WebSocket URL.
        // The frontend will include the system instruction in the setup message.
        // In production, consider using a server-side WebSocket proxy for better security.

        var expiresAt = DateTime.UtcNow.AddMinutes(30);

        return new VoiceSessionTokenResponse
        {
            Token = _apiKey,
            WebSocketUrl = $"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={_apiKey}",
            ExpiresAt = expiresAt,
            SessionContext = sessionContext,
            SystemInstruction = systemInstruction,
            Model = $"models/{_liveModel}"
        };
    }

    private async Task<VoiceSessionContextDto?> GetSessionContextAsync(Guid sessionId, Guid runnerId)
    {
        // Get the session with its training plan to verify ownership
        var session = await _context.TrainingSessions
            .Include(s => s.TrainingPlan)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.TrainingPlan.RunnerId == runnerId);

        if (session == null)
        {
            _logger.LogWarning("Session {SessionId} not found or does not belong to runner {RunnerId}", sessionId, runnerId);
            return null;
        }

        // Parse workout tips from JSON
        var workoutTips = new List<string>();
        if (!string.IsNullOrEmpty(session.WorkoutTips))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<string>>(session.WorkoutTips);
                if (parsed != null) workoutTips = parsed;
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse workout tips for session {SessionId}", sessionId);
            }
        }

        return new VoiceSessionContextDto
        {
            SessionId = session.Id,
            SessionName = session.SessionName,
            WorkoutType = session.WorkoutType,
            PlannedDistance = session.Distance,
            PlannedDuration = session.DurationMinutes,
            CyclePhase = session.CyclePhase,
            PhaseGuidance = session.PhaseGuidance,
            WorkoutTips = workoutTips,
            IntensityLevel = session.IntensityLevel,
            HRZones = session.HRZones
        };
    }

    private string BuildSystemInstruction(VoiceSessionContextDto? sessionContext)
    {
        var sb = new StringBuilder();

        sb.AppendLine("You are a supportive running coach assistant for HerPace, a hormone-aware training app for women runners.");
        sb.AppendLine();
        sb.AppendLine("IMPORTANT GUIDELINES:");
        sb.AppendLine("- Keep responses brief and conversational - the user may be mid-workout");
        sb.AppendLine("- Be warm, encouraging, and supportive");
        sb.AppendLine("- Consider the user's menstrual cycle phase in your advice");
        sb.AppendLine("- Use simple language, avoid jargon");
        sb.AppendLine();

        if (sessionContext != null)
        {
            sb.AppendLine("TODAY'S SESSION:");
            sb.AppendLine($"- Name: {sessionContext.SessionName}");
            sb.AppendLine($"- Workout Type: {sessionContext.WorkoutType}");

            if (sessionContext.PlannedDistance.HasValue)
                sb.AppendLine($"- Planned Distance: {sessionContext.PlannedDistance:F1} km");

            if (sessionContext.PlannedDuration.HasValue)
                sb.AppendLine($"- Planned Duration: {sessionContext.PlannedDuration} minutes");

            sb.AppendLine($"- Intensity: {sessionContext.IntensityLevel}");

            if (!string.IsNullOrEmpty(sessionContext.HRZones))
                sb.AppendLine($"- Heart Rate Zones: {sessionContext.HRZones}");

            if (sessionContext.CyclePhase.HasValue)
            {
                sb.AppendLine($"- Cycle Phase: {sessionContext.CyclePhase}");
                sb.AppendLine($"- Phase Guidance: {sessionContext.PhaseGuidance ?? "Listen to your body"}");
            }

            if (sessionContext.WorkoutTips.Any())
            {
                sb.AppendLine("- Tips: " + string.Join("; ", sessionContext.WorkoutTips));
            }

            sb.AppendLine();
        }

        sb.AppendLine("USER INTENT DETECTION:");
        sb.AppendLine("Listen carefully to determine if the user is:");
        sb.AppendLine();
        sb.AppendLine("1. LOGGING COMPLETION - They've finished their workout and want to record it");
        sb.AppendLine("   - Ask for: actual distance, duration, how they felt (effort 1-10), any notes");
        sb.AppendLine("   - Once you have distance, duration, and effort from the user, call the log_workout_completion tool with those values");
        sb.AppendLine("   - Be encouraging and acknowledge their achievement");
        sb.AppendLine("   - Example: \"Great job finishing your run! How far did you go?\"");
        sb.AppendLine();
        sb.AppendLine("2. ASKING FOR HELP - They're struggling mid-workout and need guidance");
        sb.AppendLine("   - Acknowledge their struggle with empathy");
        sb.AppendLine("   - Consider their cycle phase in your advice");
        sb.AppendLine("   - Provide specific, actionable guidance");
        sb.AppendLine("   - Keep responses SHORT - they're mid-workout!");
        sb.AppendLine("   - Example: \"It's okay to walk for a bit. Take 2 minutes, then try a light jog.\"");
        sb.AppendLine();
        sb.AppendLine("CYCLE PHASE CONSIDERATIONS:");
        sb.AppendLine("- Menstrual (days 1-5): Energy may be low, be extra gentle, prioritize comfort");
        sb.AppendLine("- Follicular (days 6-13): Energy rising, good time for building strength");
        sb.AppendLine("- Ovulatory (days 14-15): Peak performance window, great for hard efforts");
        sb.AppendLine("- Luteal (days 16-28): Energy declining, focus on consistency over intensity");
        sb.AppendLine();
        sb.AppendLine("TONE: Warm, supportive, coach-like. Brief responses during workout, more celebratory for completion.");

        return sb.ToString();
    }

    private async Task<(string Token, DateTime ExpiresAt)> CreateEphemeralTokenAsync(string systemInstruction)
    {
        var now = DateTime.UtcNow;
        var expireTime = now.AddMinutes(30);
        var newSessionExpireTime = now.AddMinutes(2);

        // Build the request to create an ephemeral token
        // Using v1alpha API endpoint for auth tokens with API key as query parameter
        var tokenEndpoint = $"https://generativelanguage.googleapis.com/v1alpha/authTokens?key={_apiKey}";

        var requestBody = new
        {
            config = new
            {
                uses = 1,
                expire_time = expireTime.ToString("o"),
                new_session_expire_time = newSessionExpireTime.ToString("o"),
                live_connect_constraints = new
                {
                    model = $"models/{_liveModel}",
                    config = new
                    {
                        response_modalities = new[] { "AUDIO" },
                        system_instruction = new
                        {
                            parts = new[]
                            {
                                new { text = systemInstruction }
                            }
                        },
                        speech_config = new
                        {
                            voice_config = new
                            {
                                prebuilt_voice_config = new
                                {
                                    voice_name = "Aoede"  // Warm, friendly female voice
                                }
                            }
                        }
                    }
                }
            }
        };

        var jsonRequest = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        _logger.LogDebug("Creating ephemeral token with request: {Request}", jsonRequest);

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint);
        httpRequest.Content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(httpRequest);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("Failed to create ephemeral token. Status: {Status}, Error: {Error}",
                response.StatusCode, errorContent);
            throw new InvalidOperationException($"Failed to create ephemeral token: {response.StatusCode} - {errorContent}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        _logger.LogDebug("Ephemeral token response: {Response}", responseJson);

        var tokenResponse = JsonSerializer.Deserialize<EphemeralTokenResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });

        if (string.IsNullOrEmpty(tokenResponse?.Token))
        {
            throw new InvalidOperationException("Ephemeral token response did not contain a token");
        }

        _logger.LogInformation("Ephemeral token created successfully, expires at {ExpiresAt}", expireTime);

        return (tokenResponse.Token, expireTime);
    }

    private class EphemeralTokenResponse
    {
        public string? Token { get; set; }
        public string? ExpireTime { get; set; }
        public string? Name { get; set; }
    }
}
