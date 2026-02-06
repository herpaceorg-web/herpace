using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.Services.Cycle;

public class CycleTrackingService : ICycleTrackingService
{
    private readonly HerPaceDbContext _context;
    private readonly ICyclePhaseCalculator _cyclePhaseCalculator;
    private readonly IPlanRegenerationService _planRegenerationService;
    private readonly ILogger<CycleTrackingService> _logger;

    public CycleTrackingService(
        HerPaceDbContext context,
        ICyclePhaseCalculator cyclePhaseCalculator,
        IPlanRegenerationService planRegenerationService,
        ILogger<CycleTrackingService> logger)
    {
        _context = context;
        _cyclePhaseCalculator = cyclePhaseCalculator;
        _planRegenerationService = planRegenerationService;
        _logger = logger;
    }

    public async Task<CyclePositionDto?> GetCurrentCyclePositionAsync(Guid runnerId, DateTime? clientDate = null)
    {
        var runner = await _context.Runners
            .FirstOrDefaultAsync(r => r.Id == runnerId);

        if (runner == null)
        {
            _logger.LogWarning("Runner {RunnerId} not found", runnerId);
            return null;
        }

        // Check if cycle tracking is enabled
        if (!runner.LastPeriodStart.HasValue || !runner.CycleLength.HasValue)
        {
            _logger.LogInformation("Cycle tracking not enabled for runner {RunnerId}", runnerId);
            return null;
        }

        var lastPeriodStart = runner.LastPeriodStart.Value;
        var cycleLength = runner.CycleLength.Value;
        var today = clientDate ?? DateTime.UtcNow;

        // Calculate current position
        var dayInCycle = _cyclePhaseCalculator.GetDayInCycle(lastPeriodStart, today);
        var currentPhase = _cyclePhaseCalculator.CalculateCurrentPhase(lastPeriodStart, cycleLength, today);
        var nextPredictedPeriod = _cyclePhaseCalculator.EstimateNextPeriod(lastPeriodStart, cycleLength);

        // Normalize day in cycle if we've passed the cycle length
        var normalizedDay = ((dayInCycle - 1) % cycleLength) + 1;

        // Calculate days until next period
        var daysUntilNextPeriod = (nextPredictedPeriod.Date - today.Date).Days;

        // If we're past the predicted period, calculate the next one
        while (daysUntilNextPeriod < 0)
        {
            nextPredictedPeriod = nextPredictedPeriod.AddDays(cycleLength);
            daysUntilNextPeriod = (nextPredictedPeriod.Date - today.Date).Days;
        }

        return new CyclePositionDto
        {
            CurrentDayInCycle = normalizedDay,
            CycleLength = cycleLength,
            CurrentPhase = currentPhase,
            LastPeriodStart = lastPeriodStart,
            NextPredictedPeriod = nextPredictedPeriod,
            DaysUntilNextPeriod = daysUntilNextPeriod,
            PhaseDescription = GetPhaseDescription(currentPhase),
            PhaseGuidance = GetPhaseGuidance(currentPhase)
        };
    }

    public async Task<ReportPeriodResponse> ReportPeriodStartAsync(Guid runnerId, ReportPeriodRequest request)
    {
        var runner = await _context.Runners
            .FirstOrDefaultAsync(r => r.Id == runnerId);

        if (runner == null)
        {
            throw new InvalidOperationException($"Runner {runnerId} not found");
        }

        // Extract dates from request
        var periodStartDate = request.PeriodStartDate;
        var periodEndDate = request.PeriodEndDate;

        // Get the previous cycle log to calculate prediction accuracy
        var previousLog = await _context.CycleLogs
            .Where(cl => cl.RunnerId == runnerId && cl.ActualPeriodStart.HasValue)
            .OrderByDescending(cl => cl.ActualPeriodStart)
            .FirstOrDefaultAsync();

        DateTime? predictedPeriodStart = null;
        int? daysDifference = null;
        bool wasPredictionAccurate = false;

        // Calculate actual cycle length (days since last reported period)
        int actualCycleLength = runner.CycleLength ?? 28; // Default to 28 if not set

        // Only do cycle tracking if we have a start date
        if (periodStartDate.HasValue)
        {
            if (previousLog?.ActualPeriodStart != null)
            {
                // Calculate predicted period start based on previous actual period
                predictedPeriodStart = previousLog.ActualPeriodStart.Value.AddDays(runner.CycleLength ?? 28);

                // Calculate difference
                daysDifference = (periodStartDate.Value.Date - predictedPeriodStart.Value.Date).Days;

                // Was prediction accurate? (within ±2 days)
                wasPredictionAccurate = Math.Abs(daysDifference.Value) <= 2;

                // Calculate actual cycle length
                actualCycleLength = (periodStartDate.Value.Date - previousLog.ActualPeriodStart.Value.Date).Days;

                _logger.LogInformation(
                    "Period report for runner {RunnerId}: Predicted {PredictedDate}, Actual {ActualDate}, Difference {DaysDifference} days",
                    runnerId, predictedPeriodStart, periodStartDate, daysDifference);
            }
            else
            {
                _logger.LogInformation(
                    "First period report for runner {RunnerId}: {ActualDate}",
                    runnerId, periodStartDate);
            }

            // Update runner's last period start
            runner.LastPeriodStart = DateTime.SpecifyKind(periodStartDate.Value, DateTimeKind.Utc);

            // Optionally adjust cycle length based on actual cycle
            if (previousLog?.ActualPeriodStart != null && actualCycleLength != runner.CycleLength)
            {
                _logger.LogInformation(
                    "Updating cycle length for runner {RunnerId} from {OldLength} to {NewLength} based on actual cycle",
                    runnerId, runner.CycleLength, actualCycleLength);

                // Only update if the difference is reasonable (not an anomaly)
                if (actualCycleLength >= 21 && actualCycleLength <= 45)
                {
                    runner.CycleLength = actualCycleLength;
                }
            }
        }
        else
        {
            _logger.LogInformation(
                "Period end only reported for runner {RunnerId}: {EndDate}. Cycle tracking not updated.",
                runnerId, periodEndDate);
        }

        // Determine if regeneration is needed (only if we have start date)
        bool triggeredRegeneration = false;
        Guid? affectedTrainingPlanId = null;

        if (periodStartDate.HasValue && daysDifference.HasValue && predictedPeriodStart.HasValue
            && ShouldTriggerRegeneration(predictedPeriodStart.Value, periodStartDate.Value))
        {
            // Find active training plan
            var activePlan = await _context.TrainingPlans
                .FirstOrDefaultAsync(tp => tp.RunnerId == runnerId && tp.Status == PlanStatus.Active);

            if (activePlan != null)
            {
                var canRegenerate = await _planRegenerationService.CanRegeneratePlanAsync(activePlan.Id);

                if (canRegenerate)
                {
                    _logger.LogInformation(
                        "Triggering plan regeneration for runner {RunnerId}, plan {PlanId} due to {DaysDifference} day difference",
                        runnerId, activePlan.Id, daysDifference);

                    try
                    {
                        var regeneratedCount = await _planRegenerationService.RegenerateNext4WeeksAsync(
                            activePlan.Id,
                            periodStartDate.Value,
                            runner.CycleLength ?? actualCycleLength);

                        triggeredRegeneration = regeneratedCount > 0;
                        affectedTrainingPlanId = activePlan.Id;

                        _logger.LogInformation(
                            "Regenerated {Count} sessions for plan {PlanId}",
                            regeneratedCount, activePlan.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex,
                            "Failed to regenerate plan {PlanId} for runner {RunnerId}",
                            activePlan.Id, runnerId);
                        // Continue with cycle logging even if regeneration fails
                    }
                }
                else
                {
                    _logger.LogInformation(
                        "Cannot regenerate plan {PlanId} for runner {RunnerId} - no upcoming sessions or cycle data missing",
                        activePlan.Id, runnerId);
                }
            }
            else
            {
                _logger.LogInformation(
                    "No active plan found for runner {RunnerId}, skipping regeneration",
                    runnerId);
            }
        }

        // Create cycle log entry
        var cycleLog = new CycleLog
        {
            Id = Guid.NewGuid(),
            RunnerId = runnerId,
            ActualPeriodStart = periodStartDate.HasValue ? DateTime.SpecifyKind(periodStartDate.Value, DateTimeKind.Utc) : null,
            ActualPeriodEnd = periodEndDate.HasValue ? DateTime.SpecifyKind(periodEndDate.Value, DateTimeKind.Utc) : null,
            ReportedAt = DateTime.UtcNow,
            PredictedPeriodStart = predictedPeriodStart,
            DaysDifference = daysDifference,
            WasPredictionAccurate = wasPredictionAccurate,
            ActualCycleLength = actualCycleLength,
            TriggeredRegeneration = triggeredRegeneration,
            AffectedTrainingPlanId = affectedTrainingPlanId
        };

        _context.CycleLogs.Add(cycleLog);
        await _context.SaveChangesAsync();

        // Get updated cycle position (only if we have start date)
        var updatedPosition = periodStartDate.HasValue ? await GetCurrentCyclePositionAsync(runnerId, periodStartDate) : null;

        var message = periodStartDate.HasValue && periodEndDate.HasValue
            ? (triggeredRegeneration
                ? "Period recorded (with date range) and training plan updated for the next 4 weeks based on your actual cycle."
                : "Period recorded successfully (with date range).")
            : periodStartDate.HasValue
                ? (triggeredRegeneration
                    ? "Period start recorded and training plan updated for the next 4 weeks based on your actual cycle."
                    : "Period start recorded successfully.")
                : "Period end recorded successfully.";

        return new ReportPeriodResponse
        {
            Success = true,
            Message = message,
            TriggeredRegeneration = triggeredRegeneration,
            DaysDifference = daysDifference,
            UpdatedCyclePosition = updatedPosition
        };
    }

    public async Task<CycleHistoryResponse> GetCycleHistoryAsync(Guid runnerId)
    {
        var logs = await _context.CycleLogs
            .Where(cl => cl.RunnerId == runnerId)
            .OrderByDescending(cl => cl.ActualPeriodStart)
            .Select(cl => new CycleAccuracyDto
            {
                ActualPeriodStart = cl.ActualPeriodStart,
                ActualPeriodEnd = cl.ActualPeriodEnd,
                PredictedPeriodStart = cl.PredictedPeriodStart,
                DaysDifference = cl.DaysDifference,
                WasAccurate = cl.WasPredictionAccurate,
                ActualCycleLength = cl.ActualCycleLength,
                ReportedAt = cl.ReportedAt
            })
            .ToListAsync();

        // Calculate stats
        var totalCycles = logs.Count;
        var accuratePredictions = logs.Count(l => l.WasAccurate && l.PredictedPeriodStart.HasValue);
        var accuracyPercentage = totalCycles > 1 ? (accuratePredictions / (double)(totalCycles - 1)) * 100 : 0;
        var averageCycleLength = logs.Any() ? logs.Average(l => l.ActualCycleLength) : 0;

        var stats = new CycleAccuracyStatsDto
        {
            TotalCycles = totalCycles,
            AccuratePredictions = accuratePredictions,
            AccuracyPercentage = Math.Round(accuracyPercentage, 1),
            AverageCycleLength = Math.Round(averageCycleLength, 1)
        };

        return new CycleHistoryResponse
        {
            History = logs,
            Stats = stats
        };
    }

    public bool ShouldTriggerRegeneration(DateTime predictedDate, DateTime actualDate)
    {
        return Math.Abs((actualDate.Date - predictedDate.Date).Days) > 2;
    }

    private string GetPhaseDescription(CyclePhase phase)
    {
        return phase switch
        {
            CyclePhase.Menstrual => "Menstrual Phase - Rest and Recovery",
            CyclePhase.Follicular => "Follicular Phase - Rising Energy",
            CyclePhase.Ovulatory => "Ovulatory Phase - Peak Performance",
            CyclePhase.Luteal => "Luteal Phase - Recovery Focus",
            _ => "Unknown Phase"
        };
    }

    private string GetPhaseGuidance(CyclePhase phase)
    {
        return phase switch
        {
            CyclePhase.Menstrual => "Your body needs extra rest and recovery. Focus on easy runs and listen to your body. It's okay to take extra rest days.",
            CyclePhase.Follicular => "You're in your power phase! This is a great time for harder workouts, speed work, and building strength.",
            CyclePhase.Ovulatory => "Peak performance time! Your body is primed for high-intensity workouts and PRs. Make the most of this window.",
            CyclePhase.Luteal => "Your body needs more recovery now. Focus on easy miles and listen to fatigue signals. Prioritize sleep and nutrition.",
            _ => ""
        };
    }
}
