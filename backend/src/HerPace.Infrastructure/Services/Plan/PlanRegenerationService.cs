using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.Services.Plan;

public class PlanRegenerationService : IPlanRegenerationService
{
    private readonly HerPaceDbContext _context;
    private readonly IAIPlanGenerator _aiPlanGenerator;
    private readonly ICyclePhaseCalculator _cyclePhaseCalculator;
    private readonly ILogger<PlanRegenerationService> _logger;

    public PlanRegenerationService(
        HerPaceDbContext context,
        IAIPlanGenerator aiPlanGenerator,
        ICyclePhaseCalculator cyclePhaseCalculator,
        ILogger<PlanRegenerationService> logger)
    {
        _context = context;
        _aiPlanGenerator = aiPlanGenerator;
        _cyclePhaseCalculator = cyclePhaseCalculator;
        _logger = logger;
    }

    public async Task<int> RegenerateNext4WeeksAsync(Guid trainingPlanId, DateTime newLastPeriodStart, int cycleLength)
    {
        _logger.LogInformation(
            "Starting regeneration of next 4 weeks for plan {PlanId} with updated cycle start {PeriodStart}",
            trainingPlanId, newLastPeriodStart);

        // Load training plan with sessions and related data
        var trainingPlan = await _context.TrainingPlans
            .Include(tp => tp.Sessions)
            .Include(tp => tp.Race)
            .Include(tp => tp.Runner)
            .FirstOrDefaultAsync(tp => tp.Id == trainingPlanId);

        if (trainingPlan == null)
        {
            throw new InvalidOperationException($"Training plan {trainingPlanId} not found");
        }

        if (trainingPlan.Status != PlanStatus.Active)
        {
            _logger.LogWarning("Plan {PlanId} is not active (Status: {Status}), skipping regeneration",
                trainingPlanId, trainingPlan.Status);
            return 0;
        }

        // Calculate 4-week window
        var today = DateTime.UtcNow.Date;
        var cutoffDate = today.AddDays(28); // 4 weeks from today

        // Get sessions to regenerate (upcoming, incomplete sessions within 4 weeks)
        var sessionsToRegenerate = trainingPlan.Sessions
            .Where(s => s.ScheduledDate >= today &&
                       s.ScheduledDate <= cutoffDate &&
                       s.CompletedAt == null)
            .OrderBy(s => s.ScheduledDate)
            .ToList();

        if (!sessionsToRegenerate.Any())
        {
            _logger.LogInformation("No upcoming sessions found in next 4 weeks for plan {PlanId}", trainingPlanId);
            return 0;
        }

        _logger.LogInformation("Found {Count} sessions to regenerate for plan {PlanId}",
            sessionsToRegenerate.Count, trainingPlanId);

        // Calculate new cycle phases for the 4-week window
        var cyclePhases = _cyclePhaseCalculator.PredictPhasesForRange(
            newLastPeriodStart,
            cycleLength,
            today,
            cutoffDate);

        _logger.LogInformation("Calculated {Count} cycle phases for regeneration window", cyclePhases.Count);

        // Build request for AI regeneration
        var request = new PlanGenerationRequest
        {
            RunnerId = trainingPlan.RunnerId,
            RaceName = trainingPlan.Race.RaceName,
            RaceDate = trainingPlan.Race.RaceDate,
            Distance = trainingPlan.Race.Distance,
            DistanceType = trainingPlan.Race.DistanceType,
            GoalTime = trainingPlan.Race.GoalTime,
            FitnessLevel = trainingPlan.Runner.FitnessLevel,
            TypicalWeeklyMileage = trainingPlan.Runner.TypicalWeeklyMileage,
            CycleLength = cycleLength,
            LastPeriodStart = newLastPeriodStart,
            TypicalCycleRegularity = trainingPlan.Runner.TypicalCycleRegularity,
            StartDate = today,
            EndDate = cutoffDate,
            CyclePhases = cyclePhases
        };

        // Call AI plan generator
        GeneratedPlanDto aiResponse;
        try
        {
            aiResponse = await _aiPlanGenerator.GeneratePlanAsync(request);
            _logger.LogInformation("AI regeneration completed using {Source}", aiResponse.GenerationSource);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI plan regeneration failed for plan {PlanId}", trainingPlanId);
            throw new InvalidOperationException("Failed to regenerate training sessions. Please try again.", ex);
        }

        if (aiResponse.Sessions == null || !aiResponse.Sessions.Any())
        {
            _logger.LogWarning("AI returned no sessions for regeneration of plan {PlanId}", trainingPlanId);
            return 0;
        }

        // Update existing sessions with new AI-generated data
        var regeneratedCount = 0;

        foreach (var existingSession in sessionsToRegenerate)
        {
            // Find matching AI session by date
            var aiSession = aiResponse.Sessions
                .FirstOrDefault(s => s.ScheduledDate.Date == existingSession.ScheduledDate.Date);

            if (aiSession != null)
            {
                // Update session with new data while preserving identity and timestamps
                existingSession.SessionName = aiSession.SessionName;
                existingSession.WorkoutType = aiSession.WorkoutType;
                existingSession.WarmUp = aiSession.WarmUp;
                existingSession.SessionDescription = aiSession.SessionDescription;
                existingSession.DurationMinutes = aiSession.DurationMinutes;
                existingSession.Distance = aiSession.Distance;
                existingSession.IntensityLevel = aiSession.IntensityLevel;
                existingSession.HRZones = aiSession.HRZones;
                existingSession.CyclePhase = aiSession.CyclePhase;
                existingSession.PhaseGuidance = aiSession.PhaseGuidance;
                existingSession.UpdatedAt = DateTime.UtcNow;

                regeneratedCount++;

                _logger.LogDebug(
                    "Updated session {SessionId} on {Date} with new cycle phase {Phase}",
                    existingSession.Id, existingSession.ScheduledDate.Date, aiSession.CyclePhase);
            }
            else
            {
                // If no matching session from AI, just update cycle phase
                if (cyclePhases.TryGetValue(existingSession.ScheduledDate.Date, out var phase))
                {
                    existingSession.CyclePhase = phase;
                    existingSession.PhaseGuidance = GetPhaseGuidance(phase);
                    existingSession.UpdatedAt = DateTime.UtcNow;

                    regeneratedCount++;

                    _logger.LogDebug(
                        "Updated session {SessionId} on {Date} with cycle phase {Phase} only",
                        existingSession.Id, existingSession.ScheduledDate.Date, phase);
                }
            }
        }

        // Save all changes
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Regeneration complete: Updated {Count} sessions for plan {PlanId}",
            regeneratedCount, trainingPlanId);

        return regeneratedCount;
    }

    public async Task<bool> CanRegeneratePlanAsync(Guid trainingPlanId)
    {
        var trainingPlan = await _context.TrainingPlans
            .Include(tp => tp.Sessions)
            .Include(tp => tp.Runner)
            .FirstOrDefaultAsync(tp => tp.Id == trainingPlanId);

        if (trainingPlan == null)
        {
            _logger.LogWarning("Plan {PlanId} not found for regeneration check", trainingPlanId);
            return false;
        }

        // Check if plan is active
        if (trainingPlan.Status != PlanStatus.Active)
        {
            _logger.LogDebug("Plan {PlanId} is not active (Status: {Status})", trainingPlanId, trainingPlan.Status);
            return false;
        }

        // Check if runner has cycle data
        if (!trainingPlan.Runner.LastPeriodStart.HasValue || !trainingPlan.Runner.CycleLength.HasValue)
        {
            _logger.LogDebug("Plan {PlanId} runner has no cycle data", trainingPlanId);
            return false;
        }

        // Check if there are upcoming incomplete sessions
        var today = DateTime.UtcNow.Date;
        var cutoffDate = today.AddDays(28);

        var hasUpcomingSessions = trainingPlan.Sessions
            .Any(s => s.ScheduledDate >= today &&
                     s.ScheduledDate <= cutoffDate &&
                     s.CompletedAt == null);

        if (!hasUpcomingSessions)
        {
            _logger.LogDebug("Plan {PlanId} has no upcoming incomplete sessions in next 4 weeks", trainingPlanId);
        }

        return hasUpcomingSessions;
    }

    private string GetPhaseGuidance(CyclePhase phase)
    {
        return phase switch
        {
            CyclePhase.Menstrual => "Menstrual phase - Your body needs extra rest. Focus on easy runs and listen to your body.",
            CyclePhase.Follicular => "Follicular phase - Rising energy! Great time for harder workouts and building strength.",
            CyclePhase.Ovulatory => "Ovulatory phase - Peak performance window! Your body is primed for high-intensity workouts.",
            CyclePhase.Luteal => "Luteal phase - More recovery needed. Focus on easy miles and prioritize rest.",
            _ => ""
        };
    }
}
