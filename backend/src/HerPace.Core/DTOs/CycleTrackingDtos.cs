using HerPace.Core.Enums;

namespace HerPace.Core.DTOs;

// Request to report period (at least one date must be provided)
public class ReportPeriodRequest
{
    public DateTime? PeriodStartDate { get; set; }
    public DateTime? PeriodEndDate { get; set; }
}

// Response after reporting
public class ReportPeriodResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool TriggeredRegeneration { get; set; }
    public int? DaysDifference { get; set; }
    public CyclePositionDto? UpdatedCyclePosition { get; set; }
}

// Current cycle position for dashboard
public class CyclePositionDto
{
    public int CurrentDayInCycle { get; set; }
    public int CycleLength { get; set; }
    public CyclePhase CurrentPhase { get; set; }
    public DateTime LastPeriodStart { get; set; }
    public DateTime NextPredictedPeriod { get; set; }
    public int DaysUntilNextPeriod { get; set; }
    public string PhaseDescription { get; set; } = string.Empty;
    public string PhaseGuidance { get; set; } = string.Empty;
}

// Cycle accuracy history
public class CycleAccuracyDto
{
    public DateTime? ActualPeriodStart { get; set; }
    public DateTime? ActualPeriodEnd { get; set; }
    public DateTime? PredictedPeriodStart { get; set; }
    public int? DaysDifference { get; set; }
    public bool WasAccurate { get; set; }
    public int ActualCycleLength { get; set; }
    public DateTime ReportedAt { get; set; }
}

public class CycleHistoryResponse
{
    public List<CycleAccuracyDto> History { get; set; } = new();
    public CycleAccuracyStatsDto Stats { get; set; } = new();
}

public class CycleAccuracyStatsDto
{
    public int TotalCycles { get; set; }
    public int AccuratePredictions { get; set; }
    public double AccuracyPercentage { get; set; }
    public double AverageCycleLength { get; set; }
}
