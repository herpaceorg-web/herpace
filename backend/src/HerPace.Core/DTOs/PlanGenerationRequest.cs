namespace HerPace.Core.DTOs;

/// <summary>
/// Request data for AI training plan generation.
/// </summary>
public class PlanGenerationRequest
{
    // Runner information
    public string FitnessLevel { get; set; } = string.Empty;
    public decimal? TypicalWeeklyMileage { get; set; }
    public string? RecentRaceTime { get; set; }
    public string DistanceUnit { get; set; } = "km";

    // Race information
    public string RaceName { get; set; } = string.Empty;
    public DateTime RaceDate { get; set; }
    public decimal RaceDistance { get; set; }
    public string? GoalTime { get; set; }

    // Cycle phase predictions
    public List<CyclePhaseDto> CyclePhases { get; set; } = new();
}
