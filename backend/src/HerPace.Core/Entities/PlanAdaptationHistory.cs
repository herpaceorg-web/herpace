namespace HerPace.Core.Entities;

/// <summary>
/// Tracks the history of training plan adaptations/recalculations.
/// Each entry represents a single recalculation event with details about what changed.
/// </summary>
public class PlanAdaptationHistory
{
    public Guid Id { get; set; }

    /// <summary>
    /// The training plan that was adapted
    /// </summary>
    public Guid TrainingPlanId { get; set; }

    /// <summary>
    /// When the adaptation was completed
    /// </summary>
    public DateTime AdaptedAt { get; set; }

    /// <summary>
    /// When the user viewed/dismissed this adaptation summary (null if not yet viewed)
    /// </summary>
    public DateTime? ViewedAt { get; set; }

    /// <summary>
    /// AI-generated summary explaining why the plan was adapted and what changed
    /// </summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>
    /// Number of training sessions that were modified in this adaptation
    /// </summary>
    public int SessionsAffectedCount { get; set; }

    /// <summary>
    /// Reason why the adaptation was triggered (e.g., "Training pattern deviation detected")
    /// </summary>
    public string TriggerReason { get; set; } = string.Empty;

    /// <summary>
    /// JSON-serialized array of SessionChangeDto capturing before/after state of each modified session
    /// </summary>
    public string? ChangesJson { get; set; }

    // Navigation property
    public TrainingPlan TrainingPlan { get; set; } = null!;
}
