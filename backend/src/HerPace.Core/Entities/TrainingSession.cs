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
    public DateTime ScheduledDate { get; set; }
    public WorkoutType WorkoutType { get; set; }
    public int? DurationMinutes { get; set; } // Null for Rest days
    public decimal? Distance { get; set; } // Null for Rest days
    public IntensityLevel IntensityLevel { get; set; }

    // Cycle-Aware Information
    public CyclePhase? CyclePhase { get; set; } // Null if cycle tracking disabled
    public string? PhaseGuidance { get; set; } // AI-generated guidance based on cycle phase

    // Session Tracking (for future User Story 2)
    public DateTime? CompletedAt { get; set; }
    public string? UserNotes { get; set; }
    public bool IsSkipped { get; set; } = false;
    public string? SkipReason { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public TrainingPlan TrainingPlan { get; set; } = null!;
}
