using HerPace.Core.Enums;

namespace HerPace.Core.DTOs;

/// <summary>
/// Request to recalculate a portion of an existing training plan based on recent performance.
/// Used when user deviates from plan significantly (33% of sessions skipped/modified).
/// </summary>
public class PlanRecalculationRequest
{
    // Original plan context
    public Guid TrainingPlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public string RaceName { get; set; } = string.Empty;
    public DateTime RaceDate { get; set; }
    public decimal Distance { get; set; }
    public DistanceType DistanceType { get; set; }
    public string? GoalTime { get; set; }

    // Runner profile
    public FitnessLevel FitnessLevel { get; set; }
    public decimal? TypicalWeeklyMileage { get; set; }
    public int? CycleLength { get; set; }
    public DateTime? LastPeriodStart { get; set; }
    public CycleRegularity? TypicalCycleRegularity { get; set; }

    // Recalculation scope
    public DateTime RecalculationStartDate { get; set; } // First date to recalculate
    public DateTime RecalculationEndDate { get; set; } // Last date to recalculate
    public int SessionsToRecalculate { get; set; } // Number of sessions to regenerate (e.g., 7)

    // Historical context from last N completed sessions
    public List<CompletedSessionContext> RecentSessions { get; set; } = new();

    // Recent imported activities (from fitness trackers) for richer performance context
    public List<ImportedActivityContext> RecentImportedActivities { get; set; } = new();

    // Updated cycle phases for recalculation period
    public Dictionary<DateTime, CyclePhase>? UpdatedCyclePhases { get; set; }
}

/// <summary>
/// Summary of a recent imported activity from a fitness tracker.
/// Provides additional performance context for AI plan recalculation.
/// </summary>
public class ImportedActivityContext
{
    public DateTime ActivityDate { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public double? DistanceMeters { get; set; }
    public int? DurationSeconds { get; set; }
    public double? AveragePaceSecondsPerKm { get; set; }
    public int? AverageHeartRate { get; set; }
    public int? MaxHeartRate { get; set; }
    public bool IsMatchedToSession { get; set; }
}

/// <summary>
/// Historical context from a completed or skipped session.
/// Used to inform AI recalculation decisions.
/// </summary>
public class CompletedSessionContext
{
    public DateTime ScheduledDate { get; set; }
    public WorkoutType WorkoutType { get; set; }
    public int? PlannedDuration { get; set; }
    public decimal? PlannedDistance { get; set; }
    public bool IsSkipped { get; set; }
    public string? SkipReason { get; set; }
    public int? ActualDuration { get; set; }
    public decimal? ActualDistance { get; set; }
    public int? RPE { get; set; } // Rate of Perceived Exertion (1-10)
    public string? UserNotes { get; set; }
    public bool WasModified { get; set; } // >20% deviation from planned
}
