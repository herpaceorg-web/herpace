using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.AI;

/// <summary>
/// Fallback training plan generator using rule-based templates.
/// Used when Gemini API is unavailable or fails (FR-015).
/// Implements template selection based on race distance and fitness level.
/// </summary>
public class FallbackPlanGenerator : IAIPlanGenerator
{
    private readonly ILogger<FallbackPlanGenerator> _logger;

    public FallbackPlanGenerator(ILogger<FallbackPlanGenerator> logger)
    {
        _logger = logger;
    }

    public Task<GeneratedPlanDto> GeneratePlanAsync(
        PlanGenerationRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Using fallback template-based plan generator for race: {RaceName}", request.RaceName);

        var distanceTypeStr = request.DistanceType switch
        {
            DistanceType.FiveK => "5K",
            DistanceType.TenK => "10K",
            DistanceType.HalfMarathon => "Half Marathon",
            DistanceType.Marathon => "Marathon",
            _ => $"{request.Distance:F1}km"
        };

        var plan = new GeneratedPlanDto
        {
            PlanName = $"{distanceTypeStr} Training Plan (Template)",
            TrainingDaysPerWeek = SelectTrainingDaysPerWeek(request.FitnessLevel),
            LongRunDay = DayOfWeek.Sunday,
            DaysBeforePeriodToReduceIntensity = 3,
            DaysAfterPeriodToReduceIntensity = 2,
            PlanCompletionGoal = $"Complete {distanceTypeStr} strong and injury-free",
            GenerationSource = GenerationSource.Fallback,
            AiModel = null,
            AiRationale = "Generated from rule-based template due to AI unavailability (FR-015)",
            Sessions = GenerateTemplateSessions(request)
        };

        _logger.LogInformation("Fallback plan generated with {Count} sessions for {Distance} race",
            plan.Sessions.Count, distanceTypeStr);

        return Task.FromResult(plan);
    }

    public Task<GeneratedPlanDto> RecalculatePlanAsync(
        PlanRecalculationRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Using fallback template-based plan recalculation for plan: {PlanName}", request.PlanName);

        // Analyze recent performance to determine adjustment factor
        var adjustmentFactor = CalculateAdjustmentFactor(request.RecentSessions);

        _logger.LogInformation(
            "Recalculation adjustment factor: {Factor} based on {Count} recent sessions",
            adjustmentFactor,
            request.RecentSessions.Count);

        var distanceTypeStr = request.DistanceType switch
        {
            DistanceType.FiveK => "5K",
            DistanceType.TenK => "10K",
            DistanceType.HalfMarathon => "Half Marathon",
            DistanceType.Marathon => "Marathon",
            _ => $"{request.Distance:F1}km"
        };

        var plan = new GeneratedPlanDto
        {
            PlanName = $"{request.PlanName} (Adapted)",
            Sessions = GenerateRecalculatedSessions(request, adjustmentFactor)
        };

        _logger.LogInformation("Fallback recalculation generated {Count} adapted sessions", plan.Sessions.Count);

        return Task.FromResult(plan);
    }

    private decimal CalculateAdjustmentFactor(List<CompletedSessionContext> recentSessions)
    {
        if (!recentSessions.Any())
            return 1.0m;

        var skippedCount = recentSessions.Count(s => s.IsSkipped);
        var modifiedCount = recentSessions.Count(s => s.WasModified);
        var offTrackCount = skippedCount + modifiedCount;
        var offTrackRatio = (decimal)offTrackCount / recentSessions.Count;

        // Calculate average RPE if available
        var avgRPE = recentSessions
            .Where(s => s.RPE.HasValue && !s.IsSkipped)
            .Select(s => s.RPE!.Value)
            .DefaultIfEmpty(6)
            .Average();

        // Adjustment logic:
        // - If >50% off-track: reduce to 0.7 (30% reduction)
        // - If 33-50% off-track: reduce to 0.85 (15% reduction)
        // - If RPE consistently high (>7.5): reduce by additional 10%
        // - If RPE consistently low (<5) and on track: maintain or slight increase

        decimal factor = offTrackRatio switch
        {
            > 0.50m => 0.70m,
            >= 0.33m => 0.85m,
            _ => 1.0m
        };

        // Adjust based on RPE
        if (avgRPE > 7.5)
        {
            factor *= 0.9m; // Additional 10% reduction for high RPE
        }
        else if (avgRPE < 5.0 && offTrackRatio < 0.20m)
        {
            factor = Math.Min(1.05m, factor * 1.05m); // Slight increase if handling well
        }

        return Math.Max(0.6m, Math.Min(1.1m, factor)); // Clamp between 60% and 110%
    }

    private List<TrainingSessionDto> GenerateRecalculatedSessions(
        PlanRecalculationRequest request,
        decimal adjustmentFactor)
    {
        var sessions = new List<TrainingSessionDto>();
        var template = SelectTemplate(request.DistanceType, request.FitnessLevel);

        // Calculate how many days we need to generate
        var daysToGenerate = (request.RecalculationEndDate - request.RecalculationStartDate).Days + 1;
        var currentDate = request.RecalculationStartDate;

        // Generate sessions for the recalculation period
        for (int day = 0; day < daysToGenerate; day++)
        {
            var sessionDate = currentDate.AddDays(day);
            var dayOfWeek = sessionDate.DayOfWeek;

            // Find matching template session for this day of week
            var templateSession = template.FirstOrDefault(t => t.DayOfWeek == dayOfWeek);

            if (templateSession != null)
            {
                // Get cycle phase for this date
                CyclePhase? cyclePhase = null;
                if (request.UpdatedCyclePhases != null && request.UpdatedCyclePhases.ContainsKey(sessionDate))
                {
                    cyclePhase = request.UpdatedCyclePhases[sessionDate];
                }

                // Adjust workout based on cycle phase and performance
                var adjustedIntensity = AdjustIntensityForCyclePhase(templateSession.IntensityLevel, cyclePhase);
                var adjustedWorkoutType = AdjustWorkoutTypeForCyclePhase(templateSession.WorkoutType, cyclePhase);

                // Apply adjustment factor to volume
                sessions.Add(new TrainingSessionDto
                {
                    SessionName = templateSession.SessionName + " (Adapted)",
                    ScheduledDate = sessionDate,
                    WorkoutType = adjustedWorkoutType,
                    WarmUp = templateSession.WarmUp,
                    Recovery = templateSession.Recovery,
                    SessionDescription = templateSession.SessionDescription + " - Adjusted based on recent performance.",
                    DurationMinutes = templateSession.DurationMinutes.HasValue
                        ? (int)(templateSession.DurationMinutes.Value * adjustmentFactor)
                        : null,
                    Distance = templateSession.Distance.HasValue
                        ? Math.Round(templateSession.Distance.Value * adjustmentFactor)
                        : null,
                    IntensityLevel = adjustedIntensity,
                    HRZones = templateSession.HRZones,
                    CyclePhase = cyclePhase,
                    PhaseGuidance = GetPhaseGuidance(cyclePhase, adjustedWorkoutType)
                });
            }
        }

        return sessions.OrderBy(s => s.ScheduledDate).ToList();
    }

    private int SelectTrainingDaysPerWeek(FitnessLevel fitnessLevel)
    {
        return fitnessLevel switch
        {
            FitnessLevel.Beginner => 3,
            FitnessLevel.Intermediate => 4,
            FitnessLevel.Advanced => 5,
            FitnessLevel.Elite => 6,
            _ => 4
        };
    }

    private List<TrainingSessionDto> GenerateTemplateSessions(PlanGenerationRequest request)
    {
        var sessions = new List<TrainingSessionDto>();
        var currentDate = request.StartDate;
        var raceDate = request.EndDate;
        var totalWeeks = (int)Math.Ceiling((raceDate - currentDate).TotalDays / 7.0);

        // Select template based on race distance and fitness level
        var template = SelectTemplate(request.DistanceType, request.FitnessLevel);

        // Generate sessions week by week
        for (int week = 0; week < totalWeeks; week++)
        {
            var weekStart = currentDate.AddDays(week * 7);

            // Taper in final 2 weeks (30-50% volume reduction)
            var isTaper = week >= totalWeeks - 2;
            var volumeMultiplier = isTaper ? 0.6m : 1.0m;

            foreach (var templateSession in template)
            {
                var sessionDate = GetNextDayOfWeek(weekStart, templateSession.DayOfWeek);

                if (sessionDate > raceDate)
                    continue;

                // Get cycle phase for this date
                CyclePhase? cyclePhase = null;
                if (request.CyclePhases != null && request.CyclePhases.ContainsKey(sessionDate))
                {
                    cyclePhase = request.CyclePhases[sessionDate];
                }

                // Adjust workout based on cycle phase (reduce intensity during menstrual/luteal)
                var adjustedIntensity = AdjustIntensityForCyclePhase(templateSession.IntensityLevel, cyclePhase);
                var adjustedWorkoutType = AdjustWorkoutTypeForCyclePhase(templateSession.WorkoutType, cyclePhase);

                sessions.Add(new TrainingSessionDto
                {
                    SessionName = templateSession.SessionName,
                    ScheduledDate = sessionDate,
                    WorkoutType = adjustedWorkoutType,
                    WarmUp = templateSession.WarmUp,
                    Recovery = templateSession.Recovery,
                    SessionDescription = templateSession.SessionDescription,
                    DurationMinutes = templateSession.DurationMinutes.HasValue
                        ? (int)(templateSession.DurationMinutes.Value * volumeMultiplier)
                        : null,
                    Distance = templateSession.Distance.HasValue
                        ? templateSession.Distance.Value * volumeMultiplier
                        : null,
                    IntensityLevel = adjustedIntensity,
                    HRZones = templateSession.HRZones,
                    CyclePhase = cyclePhase,
                    PhaseGuidance = GetPhaseGuidance(cyclePhase, adjustedWorkoutType)
                });
            }
        }

        return sessions.OrderBy(s => s.ScheduledDate).ToList();
    }

    private List<TemplateSession> SelectTemplate(DistanceType distanceType, FitnessLevel fitnessLevel)
    {
        // Beginner-friendly 3-4 day template
        if (fitnessLevel == FitnessLevel.Beginner)
        {
            return new List<TemplateSession>
            {
                new("Easy Run", DayOfWeek.Tuesday, WorkoutType.Easy, IntensityLevel.Low, 30, 5.0m,
                    "5 min walk + 5 min easy jog", "5 min easy walk, static stretches, hydrate", "Comfortable pace, conversational effort", "Zone 2"),
                new("Recovery Run", DayOfWeek.Thursday, WorkoutType.Easy, IntensityLevel.Low, 25, 4.0m,
                    "5 min walk", "5 min walk, gentle stretches", "Very easy effort, focus on form", "Zone 1-2"),
                new("Long Run", DayOfWeek.Sunday, WorkoutType.Long, IntensityLevel.Low, 45, 7.0m,
                    "10 min easy jog", "10 min easy walk, thorough stretches, refuel within 30 min", "Build endurance at comfortable pace", "Zone 2"),
                new("Rest Day", DayOfWeek.Monday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                    null, null, "Complete rest or light stretching", null),
                new("Rest Day", DayOfWeek.Wednesday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                    null, null, "Complete rest or active recovery (walk)", null),
                new("Rest Day", DayOfWeek.Friday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                    null, null, "Complete rest day", null),
                new("Rest Day", DayOfWeek.Saturday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                    null, null, "Rest before long run", null)
            };
        }

        // Intermediate/Advanced 4-5 day template
        return new List<TemplateSession>
        {
            new("Easy Run", DayOfWeek.Monday, WorkoutType.Easy, IntensityLevel.Low, 40, 6.0m,
                "10 min easy jog", "10 min easy walk, static stretches, hydrate", "Relaxed pace, recovery focus", "Zone 2"),
            new("Interval Training", DayOfWeek.Wednesday, WorkoutType.Interval, IntensityLevel.High, 50, 8.0m,
                "15 min easy + dynamic drills", "15 min easy cool-down jog, thorough stretches, refuel with carbs + protein within 30 min", "8x400m @ 5K pace with 90s recovery jog", "Zone 4-5"),
            new("Tempo Run", DayOfWeek.Friday, WorkoutType.Tempo, IntensityLevel.Moderate, 45, 7.0m,
                "10 min easy jog", "10 min easy cool-down, focus on leg stretches, hydrate and refuel", "20 min at comfortably hard pace (threshold)", "Zone 3-4"),
            new("Long Run", DayOfWeek.Sunday, WorkoutType.Long, IntensityLevel.Low, 75, 12.0m,
                "15 min easy jog", "15 min easy walk, comprehensive stretches (quads, hamstrings, calves, IT band), hydrate well, refuel within 45 min", "Build endurance at steady, comfortable pace", "Zone 2-3"),
            new("Rest Day", DayOfWeek.Tuesday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                null, null, "Complete rest or active recovery", null),
            new("Rest Day", DayOfWeek.Thursday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                null, null, "Recovery day between hard efforts", null),
            new("Rest Day", DayOfWeek.Saturday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                null, null, "Rest before long run", null)
        };
    }

    private IntensityLevel AdjustIntensityForCyclePhase(IntensityLevel baseIntensity, CyclePhase? cyclePhase)
    {
        if (cyclePhase == null)
            return baseIntensity;

        // Reduce intensity during menstrual and late luteal phases
        if ((cyclePhase == CyclePhase.Menstrual || cyclePhase == CyclePhase.Luteal) && baseIntensity == IntensityLevel.High)
        {
            return IntensityLevel.Moderate;
        }

        return baseIntensity;
    }

    private WorkoutType AdjustWorkoutTypeForCyclePhase(WorkoutType baseWorkoutType, CyclePhase? cyclePhase)
    {
        if (cyclePhase == null)
            return baseWorkoutType;

        // Convert high-intensity workouts to easy during menstrual phase
        if (cyclePhase == CyclePhase.Menstrual && (baseWorkoutType == WorkoutType.Interval || baseWorkoutType == WorkoutType.Tempo))
        {
            return WorkoutType.Easy;
        }

        return baseWorkoutType;
    }

    private DateTime GetNextDayOfWeek(DateTime startDate, DayOfWeek targetDay)
    {
        int daysToAdd = ((int)targetDay - (int)startDate.DayOfWeek + 7) % 7;
        return startDate.AddDays(daysToAdd);
    }

    private string? GetPhaseGuidance(CyclePhase? cyclePhase, WorkoutType workoutType)
    {
        if (cyclePhase == null)
            return "Listen to your body and adjust effort as needed.";

        return cyclePhase.Value switch
        {
            CyclePhase.Menstrual => workoutType == WorkoutType.Rest
                ? "Recovery period - prioritize rest and self-care."
                : "Low energy phase - keep effort easy and comfortable.",
            CyclePhase.Follicular => "Rising energy - great time for quality training and building strength!",
            CyclePhase.Ovulatory => "Peak performance window - harness your maximum power today!",
            CyclePhase.Luteal => "Body needs more recovery - focus on consistent, sustainable effort.",
            _ => "Listen to your body and adjust as needed."
        };
    }

    public Task<string> GenerateRecalculationSummaryAsync(
        PlanRecalculationRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Using fallback summary generation for plan: {PlanName}", request.PlanName);

        // Calculate performance stats
        var skippedCount = request.RecentSessions.Count(s => s.IsSkipped);
        var modifiedCount = request.RecentSessions.Count(s => s.WasModified);
        var avgRPE = request.RecentSessions
            .Where(s => s.RPE.HasValue && !s.IsSkipped)
            .Select(s => s.RPE!.Value)
            .DefaultIfEmpty(0)
            .Average();

        // Generate generic but personalized fallback message
        string summary;

        if (skippedCount >= request.RecentSessions.Count / 2)
        {
            // Many skipped sessions
            summary = $"I noticed you've skipped {skippedCount} recent sessions. I've simplified your plan with more flexibility and easier workouts to help you build consistency. Small steps forward are still progress!";
        }
        else if (modifiedCount > 0)
        {
            // Determine if over or under performing
            var avgActual = request.RecentSessions
                .Where(s => !s.IsSkipped && s.ActualDistance.HasValue)
                .Select(s => s.ActualDistance!.Value)
                .DefaultIfEmpty(0)
                .Average();

            var avgPlanned = request.RecentSessions
                .Where(s => !s.IsSkipped && s.PlannedDistance.HasValue)
                .Select(s => s.PlannedDistance!.Value)
                .DefaultIfEmpty(0)
                .Average();

            if (avgActual > avgPlanned * 1.1m)
            {
                // Overperforming
                summary = "You've been exceeding your planned workouts - great effort! I've increased your training load to match your growing fitness while ensuring adequate recovery. Listen to your body and fuel well!";
            }
            else
            {
                // Underperforming
                summary = "I've noticed you've been running a bit less than planned. I've adjusted your plan to better match your current capacity. Building back gradually will set you up for success. You've got this!";
            }
        }
        else if (avgRPE > 7)
        {
            // High RPE
            summary = "Your recent workouts have felt quite challenging. I've added more recovery and reduced intensity to prevent burnout. Rest is when your body gets stronger. Trust the process!";
        }
        else
        {
            // On track
            summary = "Your training is progressing well! I've fine-tuned your plan to keep you on track for your race goal. Stay consistent and trust your preparation!";
        }

        _logger.LogInformation("Generated fallback summary: {Summary}", summary);

        return Task.FromResult(summary);
    }

    private record TemplateSession(
        string SessionName,
        DayOfWeek DayOfWeek,
        WorkoutType WorkoutType,
        IntensityLevel IntensityLevel,
        int? DurationMinutes,
        decimal? Distance,
        string? WarmUp,
        string? Recovery,
        string? SessionDescription,
        string? HRZones);
}

