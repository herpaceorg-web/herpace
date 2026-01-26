namespace HerPace.Core.DTOs;

/// <summary>
/// DTO for an AI-generated training plan.
/// </summary>
public class GeneratedPlanDto
{
    public PlanMetadata Metadata { get; set; } = new();
    public List<TrainingSessionDto> Sessions { get; set; } = new();
    public string GenerationSource { get; set; } = "AI"; // "AI" or "Fallback"
    public string? AiModel { get; set; } // e.g., "gemini-3-flash-preview"
    public string? AiRationale { get; set; } // Optional explanation from AI
}

public class PlanMetadata
{
    public int TotalWeeks { get; set; }
    public string WeeklyMileageRange { get; set; } = string.Empty;
}

public class TrainingSessionDto
{
    public DateTime ScheduledDate { get; set; }
    public string WorkoutType { get; set; } = string.Empty; // Easy, Long, Tempo, Interval, Rest
    public int? DurationMinutes { get; set; }
    public decimal? Distance { get; set; }
    public string IntensityLevel { get; set; } = string.Empty; // Low, Moderate, High
    public string CyclePhase { get; set; } = string.Empty; // Follicular, Ovulatory, Luteal, Menstrual
    public string? PhaseGuidance { get; set; }
}
