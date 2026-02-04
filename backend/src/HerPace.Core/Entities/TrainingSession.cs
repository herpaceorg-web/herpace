using HerPace.Core.Enums;
using System.ComponentModel.DataAnnotations.Schema;

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
    public string? WorkoutTips { get; set; } // JSON array of workout-specific tips (3 tips combining pacing, technique, and hormone guidance)

    // Session Tracking & Actual Workout (for User Story 2)
    public DateTime? CompletedAt { get; set; }
    public decimal? ActualDistance { get; set; } // Actual distance completed
    public int? ActualDuration { get; set; } // Actual duration in minutes
    public int? RPE { get; set; } // Rate of Perceived Exertion (1-10 scale)
    public string? UserNotes { get; set; }
    public bool IsSkipped { get; set; } = false;
    public string? SkipReason { get; set; }

    /// <summary>
    /// Computed property indicating if session was significantly modified (>20% deviation).
    /// Not persisted to database - calculated on-demand.
    /// </summary>
    [NotMapped]
    public bool WasModified
    {
        get
        {
            // Rest days and skipped sessions are never "modified"
            if (WorkoutType == WorkoutType.Rest || IsSkipped)
                return false;

            // Check distance deviation if both planned and actual exist
            if (Distance.HasValue && ActualDistance.HasValue && Distance.Value > 0)
            {
                var distanceDeviation = Math.Abs(ActualDistance.Value - Distance.Value) / Distance.Value;
                if (distanceDeviation > 0.20m) // >20%
                    return true;
            }

            // Check duration deviation if both planned and actual exist
            if (DurationMinutes.HasValue && ActualDuration.HasValue && DurationMinutes.Value > 0)
            {
                var durationDeviation = Math.Abs(ActualDuration.Value - DurationMinutes.Value) / (decimal)DurationMinutes.Value;
                if (durationDeviation > 0.20m) // >20%
                    return true;
            }

            return false;
        }
    }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public TrainingPlan TrainingPlan { get; set; } = null!;
}
