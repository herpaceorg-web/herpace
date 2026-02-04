using HerPace.Core.Enums;

namespace HerPace.Core.DTOs;

/// <summary>
/// DTO for an AI-generated training plan.
/// </summary>
public class GeneratedPlanDto
{
    // Plan metadata
    public string? PlanName { get; set; }
    public int? TrainingDaysPerWeek { get; set; }
    public DayOfWeek? LongRunDay { get; set; }
    public int? DaysBeforePeriodToReduceIntensity { get; set; }
    public int? DaysAfterPeriodToReduceIntensity { get; set; }
    public string? PlanCompletionGoal { get; set; }

    // Sessions
    public List<TrainingSessionDto> Sessions { get; set; } = new();

    // Generation metadata
    public GenerationSource GenerationSource { get; set; }
    public string? AiModel { get; set; } // e.g., "gemini-3-flash-preview"
    public string? AiRationale { get; set; } // Optional explanation from AI
}

public class TrainingSessionDto
{
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
}
