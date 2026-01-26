using HerPace.Core.Enums;

namespace HerPace.Core.Entities;

/// <summary>
/// Represents a single training session (workout) within a training plan.
/// </summary>
public class TrainingSession
{
    public Guid Id { get; set; }
    public Guid TrainingPlanId { get; set; }

    // Session Details
    public string SessionName { get; set; } = string.Empty; // e.g., "Long Run", "Tempo Run"
    public DateTime ScheduledDate { get; set; }
    public WorkoutType WorkoutType { get; set; }
    public string? WarmUp { get; set; } // Warm-up instructions
    public string? SessionDescription { get; set; } // Detailed workout description

    // Planned Workout
    public int? DurationMinutes { get; set; } // Null for Rest days
    public decimal? Distance { get; set; } // Null for Rest days
    public IntensityLevel IntensityLevel { get; set; }
    public string? HRZones { get; set; } // Heart rate zones (e.g., "Zone 2-3")

    // Cycle-Aware Information
    public CyclePhase? CyclePhase { get; set; } // Null if cycle tracking disabled
    public string? PhaseGuidance { get; set; } // AI-generated guidance based on cycle phase

    // Session Tracking & Actual Workout (for User Story 2)
    public DateTime? CompletedAt { get; set; }
    public decimal? ActualDistance { get; set; } // Actual distance completed
    public int? ActualDuration { get; set; } // Actual duration in minutes
    public int? RPE { get; set; } // Rate of Perceived Exertion (1-10 scale)
    public string? UserNotes { get; set; }
    public bool IsSkipped { get; set; } = false;
    public string? SkipReason { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public TrainingPlan TrainingPlan { get; set; } = null!;
}
