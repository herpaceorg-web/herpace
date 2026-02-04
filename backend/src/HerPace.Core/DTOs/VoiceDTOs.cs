using HerPace.Core.Enums;

namespace HerPace.Core.DTOs;

/// <summary>
/// Request to generate an ephemeral token for a voice session.
/// </summary>
public class VoiceSessionTokenRequest
{
    /// <summary>
    /// The training session ID to provide context for (optional).
    /// If not provided, general coaching context will be used.
    /// </summary>
    public Guid? SessionId { get; set; }
}

/// <summary>
/// Response containing the ephemeral token and session context for voice interaction.
/// </summary>
public class VoiceSessionTokenResponse
{
    /// <summary>
    /// The ephemeral token for authenticating with Gemini Live API.
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// The WebSocket URL to connect to for the Live API.
    /// </summary>
    public string WebSocketUrl { get; set; } = string.Empty;

    /// <summary>
    /// When the token expires.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Context about the training session for the voice interaction.
    /// </summary>
    public VoiceSessionContextDto? SessionContext { get; set; }
}

/// <summary>
/// Context about the training session provided to the voice assistant.
/// </summary>
public class VoiceSessionContextDto
{
    public Guid SessionId { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public WorkoutType WorkoutType { get; set; }
    public decimal? PlannedDistance { get; set; }
    public int? PlannedDuration { get; set; }
    public CyclePhase? CyclePhase { get; set; }
    public string? PhaseGuidance { get; set; }
    public List<string> WorkoutTips { get; set; } = new();
    public IntensityLevel IntensityLevel { get; set; }
    public string? HRZones { get; set; }
}

/// <summary>
/// Request to complete a session via voice with extracted data.
/// </summary>
public class VoiceCompletionRequest
{
    public decimal? ActualDistance { get; set; }
    public int? ActualDuration { get; set; }
    public int? RPE { get; set; }
    public string? UserNotes { get; set; }

    /// <summary>
    /// Transcript of the voice interaction for logging/debugging.
    /// </summary>
    public string? VoiceTranscript { get; set; }
}
