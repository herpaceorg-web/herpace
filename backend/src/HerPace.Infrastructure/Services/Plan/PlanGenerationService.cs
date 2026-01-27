using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.Services.Plan;

/// <summary>
/// Orchestrates training plan generation including cycle calculation,
/// AI integration, and FR-017 single active plan enforcement.
/// </summary>
public class PlanGenerationService : IPlanGenerationService
{
    private readonly HerPaceDbContext _context;
    private readonly IAIPlanGenerator _aiPlanGenerator;
    private readonly ICyclePhaseCalculator _cyclePhaseCalculator;
    private readonly ILogger<PlanGenerationService> _logger;

    public PlanGenerationService(
        HerPaceDbContext context,
        IAIPlanGenerator aiPlanGenerator,
        ICyclePhaseCalculator cyclePhaseCalculator,
        ILogger<PlanGenerationService> logger)
    {
        _context = context;
        _aiPlanGenerator = aiPlanGenerator;
        _cyclePhaseCalculator = cyclePhaseCalculator;
        _logger = logger;
    }

    /// <summary>
    /// Generates a new training plan for a race with FR-017 enforcement.
    /// </summary>
    public async Task<TrainingPlan> GeneratePlanAsync(Guid raceId, Guid runnerId)
    {
        _logger.LogInformation("Generating plan for race {RaceId}, runner {RunnerId}", raceId, runnerId);

        // FR-017: Check if runner already has an active plan
        if (await HasActivePlanAsync(runnerId))
        {
            throw new InvalidOperationException(
                "You already have an active training plan. Please archive or complete your current plan before creating a new one.");
        }

        // Fetch race and runner with related data
        var race = await _context.Races
            .Include(r => r.Runner)
            .FirstOrDefaultAsync(r => r.Id == raceId && r.RunnerId == runnerId);

        if (race == null)
        {
            throw new InvalidOperationException("Race not found or does not belong to this runner.");
        }

        var runner = race.Runner;

        // Calculate cycle phases for the date range (today to race date)
        var startDate = DateTime.UtcNow.Date;
        var endDate = race.RaceDate.Date;

        Dictionary<DateTime, CyclePhase>? cyclePhases = null;

        if (runner.LastPeriodStart.HasValue && runner.CycleLength.HasValue)
        {
            cyclePhases = _cyclePhaseCalculator.PredictPhasesForRange(
                runner.LastPeriodStart.Value,
                runner.CycleLength.Value,
                startDate,
                endDate);

            _logger.LogInformation("Calculated cycle phases for {DayCount} days", cyclePhases.Count);
        }
        else
        {
            _logger.LogWarning("Runner {RunnerId} has no cycle data, generating plan without cycle awareness", runnerId);
        }

        // Build request for AI plan generator
        var request = new PlanGenerationRequest
        {
            RunnerId = runnerId,
            RaceName = race.RaceName,
            RaceDate = race.RaceDate,
            Distance = race.Distance,
            DistanceType = race.DistanceType,
            GoalTime = race.GoalTime,
            FitnessLevel = runner.FitnessLevel,
            TypicalWeeklyMileage = runner.TypicalWeeklyMileage,
            CycleLength = runner.CycleLength,
            LastPeriodStart = runner.LastPeriodStart,
            TypicalCycleRegularity = runner.TypicalCycleRegularity,
            StartDate = startDate,
            EndDate = endDate,
            CyclePhases = cyclePhases
        };

        // Call AI plan generator (Gemini or Fallback)
        GeneratedPlanDto aiResponse;
        try
        {
            aiResponse = await _aiPlanGenerator.GeneratePlanAsync(request);
            _logger.LogInformation("AI plan generated successfully using {Source}", aiResponse.GenerationSource);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI plan generation failed");
            throw new InvalidOperationException("Failed to generate training plan. Please try again.", ex);
        }

        // Validate AI response (FR-021)
        if (!ValidateAIResponse(aiResponse))
        {
            _logger.LogError("AI response validation failed");
            throw new InvalidOperationException("AI generated an invalid plan. Please try again.");
        }

        // Create TrainingPlan entity
        var trainingPlan = new TrainingPlan
        {
            Id = Guid.NewGuid(),
            RaceId = raceId,
            RunnerId = runnerId,
            PlanName = aiResponse.PlanName ?? $"{race.RaceName} Training Plan",
            Status = PlanStatus.Active,
            GenerationSource = aiResponse.GenerationSource,
            AiModel = aiResponse.AiModel,
            AiRationale = aiResponse.AiRationale,
            StartDate = startDate,
            EndDate = endDate,
            TrainingDaysPerWeek = aiResponse.TrainingDaysPerWeek ?? 4,
            LongRunDay = aiResponse.LongRunDay ?? DayOfWeek.Sunday,
            DaysBeforePeriodToReduceIntensity = aiResponse.DaysBeforePeriodToReduceIntensity ?? 3,
            DaysAfterPeriodToReduceIntensity = aiResponse.DaysAfterPeriodToReduceIntensity ?? 2,
            PlanCompletionGoal = aiResponse.PlanCompletionGoal,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create TrainingSession entities
        var sessions = aiResponse.Sessions.Select(sessionDto => new TrainingSession
        {
            Id = Guid.NewGuid(),
            TrainingPlanId = trainingPlan.Id,
            SessionName = sessionDto.SessionName,
            ScheduledDate = DateTime.SpecifyKind(sessionDto.ScheduledDate, DateTimeKind.Utc), // Ensure UTC for PostgreSQL
            WorkoutType = sessionDto.WorkoutType,
            WarmUp = sessionDto.WarmUp,
            SessionDescription = sessionDto.SessionDescription,
            DurationMinutes = sessionDto.DurationMinutes,
            Distance = sessionDto.Distance,
            IntensityLevel = sessionDto.IntensityLevel,
            HRZones = sessionDto.HRZones,
            CyclePhase = sessionDto.CyclePhase,
            PhaseGuidance = sessionDto.PhaseGuidance,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        trainingPlan.Sessions = sessions;

        // Persist to database
        _context.TrainingPlans.Add(trainingPlan);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Training plan {PlanId} created with {SessionCount} sessions", trainingPlan.Id, sessions.Count);

        return trainingPlan;
    }

    /// <summary>
    /// Validates an AI-generated plan response against schema requirements (FR-021).
    /// </summary>
    public bool ValidateAIResponse(GeneratedPlanDto aiResponse)
    {
        if (aiResponse == null)
        {
            _logger.LogError("AI response is null");
            return false;
        }

        if (aiResponse.Sessions == null || !aiResponse.Sessions.Any())
        {
            _logger.LogError("AI response has no sessions");
            return false;
        }

        // Validate each session has required fields
        foreach (var session in aiResponse.Sessions)
        {
            if (string.IsNullOrEmpty(session.SessionName))
            {
                _logger.LogError("Session missing SessionName");
                return false;
            }

            if (session.ScheduledDate == default)
            {
                _logger.LogError("Session has invalid ScheduledDate");
                return false;
            }

            // Rest days can have null duration/distance, but other workout types should have values
            if (session.WorkoutType != WorkoutType.Rest)
            {
                if (!session.DurationMinutes.HasValue && !session.Distance.HasValue)
                {
                    _logger.LogError("Non-rest session missing both Duration and Distance");
                    return false;
                }
            }
        }

        _logger.LogInformation("AI response validation passed: {SessionCount} sessions validated", aiResponse.Sessions.Count);
        return true;
    }

    /// <summary>
    /// Checks if a runner already has an active training plan (FR-017).
    /// </summary>
    public async Task<bool> HasActivePlanAsync(Guid runnerId)
    {
        return await _context.TrainingPlans
            .AnyAsync(tp => tp.RunnerId == runnerId && tp.Status == PlanStatus.Active);
    }

    /// <summary>
    /// Archives the current active plan for a runner (sets status to Archived).
    /// </summary>
    public async Task ArchiveActivePlanAsync(Guid runnerId)
    {
        var activePlans = await _context.TrainingPlans
            .Where(tp => tp.RunnerId == runnerId && tp.Status == PlanStatus.Active)
            .ToListAsync();

        foreach (var plan in activePlans)
        {
            plan.Status = PlanStatus.Archived;
            plan.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Archived {Count} active plans for runner {RunnerId}", activePlans.Count, runnerId);
    }
}
