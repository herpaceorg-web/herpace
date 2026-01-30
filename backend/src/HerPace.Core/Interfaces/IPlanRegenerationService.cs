namespace HerPace.Core.Interfaces;

public interface IPlanRegenerationService
{
    Task<int> RegenerateNext4WeeksAsync(Guid trainingPlanId, DateTime newLastPeriodStart, int cycleLength);
    Task<bool> CanRegeneratePlanAsync(Guid trainingPlanId);
}
