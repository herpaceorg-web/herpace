namespace HerPace.Core.Entities;

public class CycleLog
{
    public Guid Id { get; set; }
    public Guid RunnerId { get; set; }

    // Period reporting
    public DateTime ActualPeriodStart { get; set; }
    public DateTime ReportedAt { get; set; }

    // Prediction tracking
    public DateTime? PredictedPeriodStart { get; set; }
    public int? DaysDifference { get; set; }
    public bool WasPredictionAccurate { get; set; }

    // Context
    public int ActualCycleLength { get; set; }
    public bool TriggeredRegeneration { get; set; }
    public Guid? AffectedTrainingPlanId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Runner Runner { get; set; } = null!;
    public TrainingPlan? AffectedTrainingPlan { get; set; }
}
