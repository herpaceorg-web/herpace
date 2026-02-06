namespace HerPace.Core.Interfaces;

/// <summary>
/// Service for adaptive training plan recalculation based on user performance.
/// </summary>
public interface IPlanAdaptationService
{
    /// <summary>
    /// Checks if plan recalculation is needed based on recent session performance.
    /// If threshold is met (33% of last 7 sessions off-track), enqueues a background job.
    /// </summary>
    /// <param name="trainingPlanId">The training plan to check</param>
    /// <returns>True if recalculation was triggered, false otherwise</returns>
    Task<bool> CheckAndTriggerRecalculationAsync(Guid trainingPlanId);

    /// <summary>
    /// Performs the actual plan recalculation (executed as a Hangfire background job).
    /// Recalculates next 7 sessions based on last 7 sessions using AI.
    /// </summary>
    /// <param name="trainingPlanId">The training plan to recalculate</param>
    Task RecalculatePlanAsync(Guid trainingPlanId);

    /// <summary>
    /// Confirms user acceptance of plan recalculation and enqueues the job.
    /// Only works if PendingRecalculationConfirmation is true.
    /// </summary>
    /// <param name="trainingPlanId">The training plan to recalculate</param>
    /// <returns>True if job was enqueued, false if no pending confirmation or error</returns>
    Task<bool> ConfirmRecalculationAsync(Guid trainingPlanId);

    /// <summary>
    /// Declines user acceptance of plan recalculation and clears pending state.
    /// </summary>
    /// <param name="trainingPlanId">The training plan</param>
    /// <returns>True if successfully declined, false if error</returns>
    Task<bool> DeclineRecalculationAsync(Guid trainingPlanId);
}
