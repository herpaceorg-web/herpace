using HerPace.Core.Enums;
using HerPace.Core.Interfaces;

namespace HerPace.Infrastructure.Services.Cycle;

/// <summary>
/// Calculates menstrual cycle phases based on research-backed phase definitions.
/// Algorithm based on standard 28-day cycle model, adjusted for variable cycle lengths.
/// </summary>
public class CyclePhaseCalculator : ICyclePhaseCalculator
{
    /// <summary>
    /// Calculates the current cycle phase for a given date.
    /// </summary>
    public CyclePhase CalculateCurrentPhase(
        DateTime lastPeriodStart,
        int cycleLength,
        DateTime? currentDate = null)
    {
        var date = currentDate ?? DateTime.UtcNow;
        var dayInCycle = GetDayInCycle(lastPeriodStart, date);

        // Normalize to current cycle (handle dates beyond one cycle)
        dayInCycle = ((dayInCycle - 1) % cycleLength) + 1;

        return GetPhaseForDay(dayInCycle, cycleLength);
    }

    /// <summary>
    /// Predicts cycle phases for a date range (used during plan generation).
    /// </summary>
    public Dictionary<DateTime, CyclePhase> PredictPhasesForRange(
        DateTime lastPeriodStart,
        int cycleLength,
        DateTime startDate,
        DateTime endDate)
    {
        var phases = new Dictionary<DateTime, CyclePhase>();

        for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
        {
            phases[date] = CalculateCurrentPhase(lastPeriodStart, cycleLength, date);
        }

        return phases;
    }

    /// <summary>
    /// Gets the day number within the current cycle (1-based).
    /// </summary>
    public int GetDayInCycle(DateTime lastPeriodStart, DateTime? currentDate = null)
    {
        var date = currentDate ?? DateTime.UtcNow;
        var daysSinceLastPeriod = (int)(date.Date - lastPeriodStart.Date).TotalDays;

        // Day 1 is the first day of period
        return daysSinceLastPeriod + 1;
    }

    /// <summary>
    /// Estimates the next period start date based on cycle length.
    /// </summary>
    public DateTime EstimateNextPeriod(DateTime lastPeriodStart, int cycleLength)
    {
        return lastPeriodStart.AddDays(cycleLength);
    }

    /// <summary>
    /// Determines cycle phase based on day in cycle.
    /// Phase boundaries are scaled proportionally for non-28-day cycles.
    ///
    /// Standard 28-day cycle:
    /// - Menstrual: Days 1-5 (Period, low energy)
    /// - Follicular: Days 6-13 (Rising energy, muscle building)
    /// - Ovulatory: Days 14-15 (Peak performance)
    /// - Luteal: Days 16-28 (Declining energy, more recovery needed)
    /// </summary>
    private CyclePhase GetPhaseForDay(int dayInCycle, int cycleLength)
    {
        // Scale phase boundaries proportionally to cycle length
        // Menstrual phase is fixed at ~5 days
        const int menstrualDays = 5;

        if (dayInCycle <= menstrualDays)
        {
            return CyclePhase.Menstrual;
        }

        // Calculate proportional boundaries for remaining phases
        var remainingDays = cycleLength - menstrualDays;

        // Follicular: ~30% of remaining cycle (after menstrual)
        var follicularEnd = menstrualDays + (int)(remainingDays * 0.30);

        if (dayInCycle <= follicularEnd)
        {
            return CyclePhase.Follicular;
        }

        // Ovulatory: ~7% of remaining cycle (typically 2 days around ovulation)
        var ovulatoryEnd = follicularEnd + (int)Math.Max(2, remainingDays * 0.07);

        if (dayInCycle <= ovulatoryEnd)
        {
            return CyclePhase.Ovulatory;
        }

        // Luteal: Rest of cycle (typically ~63% of remaining cycle)
        return CyclePhase.Luteal;
    }
}
