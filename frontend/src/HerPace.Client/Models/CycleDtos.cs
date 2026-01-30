namespace HerPace.Client.Models;

// Request to report period
public class ReportPeriodRequest
{
    public DateTime PeriodStartDate { get; set; }
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
    public int CurrentPhase { get; set; }
    public DateTime LastPeriodStart { get; set; }
    public DateTime NextPredictedPeriod { get; set; }
    public int DaysUntilNextPeriod { get; set; }
    public string PhaseDescription { get; set; } = string.Empty;
    public string PhaseGuidance { get; set; } = string.Empty;
}
