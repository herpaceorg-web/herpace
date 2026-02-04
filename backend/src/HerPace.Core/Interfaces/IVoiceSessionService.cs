namespace HerPace.Core.Interfaces;

/// <summary>
/// Service for generating ephemeral tokens for Gemini Live API voice sessions.
/// </summary>
public interface IVoiceSessionService
{
    /// <summary>
    /// Generates an ephemeral token for a voice session with the specified training session context.
    /// </summary>
    /// <param name="runnerId">The runner's ID (for ownership verification).</param>
    /// <param name="sessionId">The training session ID (optional - for session-specific context).</param>
    /// <returns>Token response containing the ephemeral token and session context.</returns>
    Task<DTOs.VoiceSessionTokenResponse> GenerateSessionTokenAsync(Guid runnerId, Guid? sessionId);
}
