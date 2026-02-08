using HerPace.Core.Enums;

namespace HerPace.Core.DTOs;

/// <summary>
/// Request data for AI training plan generation.
/// </summary>
public class PlanGenerationRequest
{
    // Runner identification
    public Guid RunnerId { get; set; }

    // Runner fitness information
    public FitnessLevel FitnessLevel { get; set; }
    public decimal? TypicalWeeklyMileage { get; set; }

    // Race information
    public string RaceName { get; set; } = string.Empty;
    public DateTime RaceDate { get; set; }
    public decimal Distance { get; set; }
    public DistanceType DistanceType { get; set; }
    public string? GoalTime { get; set; }
    public string? RaceCompletionGoal { get; set; }

    // Cycle information
    public int? CycleLength { get; set; }
    public DateTime? LastPeriodStart { get; set; }
    public CycleRegularity TypicalCycleRegularity { get; set; }

    // Plan date range
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Cycle phase predictions (calculated by CyclePhaseCalculator)
    public Dictionary<DateTime, CyclePhase>? CyclePhases { get; set; }
}
