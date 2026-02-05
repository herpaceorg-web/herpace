using HerPace.Core.DTOs;

namespace HerPace.Core.Interfaces;

/// <summary>
/// Service for managing training session completion and tracking.
/// </summary>
public interface ISessionCompletionService
{
    /// <summary>
    /// Marks a session as completed with actual performance data.
    /// Calculates if session was modified and triggers recalculation check.
    /// </summary>
    Task<SessionCompletionResult> CompleteSessionAsync(
        Guid sessionId,
        Guid runnerId,
        CompleteSessionRequest request);

    /// <summary>
    /// Marks a session as skipped with optional reason.
    /// Triggers recalculation check.
    /// </summary>
    Task<SessionCompletionResult> SkipSessionAsync(
        Guid sessionId,
        Guid runnerId,
        SkipSessionRequest request);

    /// <summary>
    /// Retrieves upcoming sessions (after today) for a runner.
    /// clientDate overrides the server's UTC date to match the user's local timezone.
    /// </summary>
    Task<List<SessionDetailDto>> GetUpcomingSessionsAsync(
        Guid runnerId,
        int count,
        string? clientDate = null);

    /// <summary>
    /// Retrieves detailed information for a single session.
    /// </summary>
    Task<SessionDetailDto?> GetSessionDetailAsync(
        Guid sessionId,
        Guid runnerId);
}

/// <summary>
/// Result of a session completion or skip operation.
/// </summary>
public class SessionCompletionResult
{
    public bool Success { get; set; }
    public bool RecalculationTriggered { get; set; }
    public string? ErrorMessage { get; set; }
}
