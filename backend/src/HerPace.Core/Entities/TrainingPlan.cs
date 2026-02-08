using HerPace.Core.Enums;

namespace HerPace.Core.Entities;

/// <summary>
/// Represents a training plan for a specific race.
/// FR-017: Only one active plan allowed per runner.
/// </summary>
public class TrainingPlan
{
    public Guid Id { get; set; }
    public Guid RaceId { get; set; }
    public Guid RunnerId { get; set; }

    // Plan Status & Details
    public PlanStatus Status { get; set; } = PlanStatus.Active;
    public string PlanName { get; set; } = string.Empty; // e.g., "Marathon Training Plan"

    // Schedule Configuration
    public int TrainingDaysPerWeek { get; set; } = 4; // 1-7 days, default 4
    public DayOfWeek LongRunDay { get; set; } = DayOfWeek.Sunday; // Key scheduling anchor

    // Cycle-Aware Adjustments (FR-003: Menstrual cycle phase awareness)
    public int DaysBeforePeriodToReduceIntensity { get; set; } = 3; // 0-7 days, default 3
    public int DaysAfterPeriodToReduceIntensity { get; set; } = 2; // 0-7 days, default 2

    // Plan Goals
    public string? PlanCompletionGoal { get; set; } // Qualitative goal text

    // Generation Information
    public GenerationSource GenerationSource { get; set; }
    public string? AiModel { get; set; } // e.g., "gemini-3-flash-preview"
    public string? AiRationale { get; set; } // Optional AI explanation

    // Plan Recalculation Tracking (for adaptive plans)
    public string? LastRecalculationJobId { get; set; } // Hangfire job ID for in-progress recalculation
    public DateTime? LastRecalculationRequestedAt { get; set; } // When recalculation was last queued
    public DateTime? LastRecalculatedAt { get; set; } // When recalculation was last completed
    public string? LastRecalculationSummary { get; set; } // AI-generated summary shown to user after recalculation
    public DateTime? RecalculationSummaryViewedAt { get; set; } // When user dismissed the recalculation summary

    // Recalculation Confirmation Tracking
    public bool PendingRecalculationConfirmation { get; set; } = false; // User needs to confirm recalculation
    public DateTime? RecalculationConfirmationRequestedAt { get; set; } // When confirmation was requested
    public DateTime? RecalculationConfirmationRespondedAt { get; set; } // When user responded (yes or no)
    public bool? RecalculationConfirmationAccepted { get; set; } // User's response (true = yes, false = no, null = not answered)

    // Recalculation Preview Data (generated before user confirms)
    public string? PendingRecalculationPreviewJson { get; set; } // Serialized List<SessionChangeDto> - proposed changes
    public string? PendingRecalculationSummary { get; set; } // AI-generated summary for preview modal
    public DateTime? PreviewGeneratedAt { get; set; } // When preview was generated

    // Plan Timeline
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Race Race { get; set; } = null!;
    public Runner Runner { get; set; } = null!;
    public ICollection<TrainingSession> Sessions { get; set; } = new List<TrainingSession>();
}
