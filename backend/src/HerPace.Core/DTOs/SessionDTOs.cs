using HerPace.Core.Enums;

namespace HerPace.Core.DTOs;

/// <summary>
/// Request to mark a session as completed with actual performance data.
/// </summary>
public class CompleteSessionRequest
{
    public decimal? ActualDistance { get; set; } // Actual distance in km
    public int? ActualDuration { get; set; } // Actual duration in minutes
    public int? RPE { get; set; } // Rate of Perceived Exertion (1-10 scale)
    public string? UserNotes { get; set; } // Optional user feedback/comments
}

/// <summary>
/// Request to mark a session as skipped.
/// </summary>
public class SkipSessionRequest
{
    public string? SkipReason { get; set; } // Reason for skipping the session
}

/// <summary>
/// Response containing upcoming sessions.
/// </summary>
public class UpcomingSessionsResponse
{
    public List<SessionDetailDto> Sessions { get; set; } = new();
    public bool HasPendingRecalculation { get; set; } // Is a recalculation job currently running?
}

/// <summary>
/// Detailed session information including completion data.
/// </summary>
public class SessionDetailDto
{
    public Guid Id { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public WorkoutType WorkoutType { get; set; }
    public string? WarmUp { get; set; }
    public string? Recovery { get; set; }
    public string? SessionDescription { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? Distance { get; set; }
    public IntensityLevel IntensityLevel { get; set; }
    public string? HRZones { get; set; }
    public CyclePhase? CyclePhase { get; set; }
    public string? PhaseGuidance { get; set; }
    public int? SessionNumberInPhase { get; set; } // Which session number in current cycle phase (e.g., 5)
    public int? TotalSessionsInPhase { get; set; } // Total sessions in this phase (e.g., 15)
    public int? MenstruationDay { get; set; } // Day of period if in menstrual phase (e.g., 1, 2, 3)
    public List<string> WorkoutTips { get; set; } = new(); // AI-generated tips (3 tips combining pacing, technique, and hormone guidance)

    // Completion data
    public DateTime? CompletedAt { get; set; }
    public decimal? ActualDistance { get; set; }
    public int? ActualDuration { get; set; }
    public int? RPE { get; set; }
    public string? UserNotes { get; set; }
    public bool IsSkipped { get; set; }
    public string? SkipReason { get; set; }

    // Training stage (computed from plan timeline, not persisted)
    public TrainingStage? TrainingStage { get; set; }
    public TrainingStageInfoDto? TrainingStageInfo { get; set; }

    // Computed fields
    public bool WasModified { get; set; } // >20% deviation from planned
    public bool IsCompleted { get; set; } // CompletedAt != null && !IsSkipped
    public bool IsRecentlyUpdated { get; set; } // Updated by plan recalculation within last 7 days
}

/// <summary>
/// Response after completing or skipping a session.
/// </summary>
public class SessionCompletionResponse
{
    public Guid SessionId { get; set; }
    public bool Success { get; set; }
    public bool RecalculationTriggered { get; set; } // Legacy - kept for compatibility
    public bool RecalculationRequested { get; set; } // NEW - threshold met, recalculation needed
    public bool PendingConfirmation { get; set; } // NEW - user needs to respond to confirmation modal
    public string? Message { get; set; }
}

/// <summary>
/// Summary of active training plan including today's session and recalculation status.
/// </summary>
public class PlanSummaryDto
{
    public Guid PlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public string RaceName { get; set; } = string.Empty;
    public DateTime RaceDate { get; set; }
    public int DaysUntilRace { get; set; }
    public bool HasPendingRecalculation { get; set; } // Is a recalculation job currently running?
    public bool PendingConfirmation { get; set; } // NEW - user needs to confirm recalculation
    public string? RecalculationSummary { get; set; } // AI-generated summary (null if viewed or no recalculation)
    public LatestAdaptationDto? LatestAdaptation { get; set; } // Latest adaptation details with before/after changes
    public SessionDetailDto? TodaysSession { get; set; } // Today's session (null if no session today)
    public CyclePhaseTipsDto? CyclePhaseTips { get; set; } // Wellness tips for today's cycle phase
}

/// <summary>
/// Empty request to dismiss the recalculation summary.
/// </summary>
public class DismissSummaryRequest
{
    // Empty - just triggers timestamp update
}

/// <summary>
/// Response after confirming or declining plan recalculation.
/// </summary>
public class RecalculationConfirmationResponse
{
    public bool Success { get; set; }
    public bool RecalculationEnqueued { get; set; } // Was job enqueued after confirmation?
    public string? Message { get; set; }
}
