using HerPace.Core.Enums;

namespace HerPace.Core.Interfaces;

/// <summary>
/// Service for calculating menstrual cycle phases based on cycle data.
/// </summary>
public interface ICyclePhaseCalculator
{
    /// <summary>
    /// Calculates the current cycle phase for a given date.
    /// </summary>
    /// <param name="lastPeriodStart">Date of last period start</param>
    /// <param name="cycleLength">Average cycle length in days (21-45)</param>
    /// <param name="currentDate">Date to calculate phase for (defaults to today)</param>
    /// <returns>The cycle phase for the given date</returns>
    CyclePhase CalculateCurrentPhase(
        DateTime lastPeriodStart,
        int cycleLength,
        DateTime? currentDate = null);

    /// <summary>
    /// Predicts cycle phases for a date range (used during plan generation).
    /// </summary>
    /// <param name="lastPeriodStart">Date of last period start</param>
    /// <param name="cycleLength">Average cycle length in days (21-45)</param>
    /// <param name="startDate">Start of date range</param>
    /// <param name="endDate">End of date range</param>
    /// <returns>Dictionary mapping dates to cycle phases</returns>
    Dictionary<DateTime, CyclePhase> PredictPhasesForRange(
        DateTime lastPeriodStart,
        int cycleLength,
        DateTime startDate,
        DateTime endDate);

    /// <summary>
    /// Gets the day number within the current cycle (1-based).
    /// </summary>
    /// <param name="lastPeriodStart">Date of last period start</param>
    /// <param name="currentDate">Date to calculate for (defaults to today)</param>
    /// <returns>Day number in cycle (e.g., day 14 = ovulation)</returns>
    int GetDayInCycle(DateTime lastPeriodStart, DateTime? currentDate = null);

    /// <summary>
    /// Estimates the next period start date based on cycle length.
    /// </summary>
    /// <param name="lastPeriodStart">Date of last period start</param>
    /// <param name="cycleLength">Average cycle length in days (21-45)</param>
    /// <returns>Estimated next period start date</returns>
    DateTime EstimateNextPeriod(DateTime lastPeriodStart, int cycleLength);
}
