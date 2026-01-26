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
                    "5 min walk + 5 min easy jog", "Comfortable pace, conversational effort", "Zone 2"),
                new("Recovery Run", DayOfWeek.Thursday, WorkoutType.Easy, IntensityLevel.Low, 25, 4.0m,
                    "5 min walk", "Very easy effort, focus on form", "Zone 1-2"),
                new("Long Run", DayOfWeek.Sunday, WorkoutType.Long, IntensityLevel.Low, 45, 7.0m,
                    "10 min easy jog", "Build endurance at comfortable pace", "Zone 2"),
                new("Rest Day", DayOfWeek.Monday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                    null, "Complete rest or light stretching", null),
                new("Rest Day", DayOfWeek.Wednesday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                    null, "Complete rest or active recovery (walk)", null),
                new("Rest Day", DayOfWeek.Friday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                    null, "Complete rest day", null),
                new("Rest Day", DayOfWeek.Saturday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                    null, "Rest before long run", null)
            };
        }

        // Intermediate/Advanced 4-5 day template
        return new List<TemplateSession>
        {
            new("Easy Run", DayOfWeek.Monday, WorkoutType.Easy, IntensityLevel.Low, 40, 6.0m,
                "10 min easy jog", "Relaxed pace, recovery focus", "Zone 2"),
            new("Interval Training", DayOfWeek.Wednesday, WorkoutType.Interval, IntensityLevel.High, 50, 8.0m,
                "15 min easy + dynamic drills", "8x400m @ 5K pace with 90s recovery jog", "Zone 4-5"),
            new("Tempo Run", DayOfWeek.Friday, WorkoutType.Tempo, IntensityLevel.Moderate, 45, 7.0m,
                "10 min easy jog", "20 min at comfortably hard pace (threshold)", "Zone 3-4"),
            new("Long Run", DayOfWeek.Sunday, WorkoutType.Long, IntensityLevel.Low, 75, 12.0m,
                "15 min easy jog", "Build endurance at steady, comfortable pace", "Zone 2-3"),
            new("Rest Day", DayOfWeek.Tuesday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                null, "Complete rest or active recovery", null),
            new("Rest Day", DayOfWeek.Thursday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                null, "Recovery day between hard efforts", null),
            new("Rest Day", DayOfWeek.Saturday, WorkoutType.Rest, IntensityLevel.Low, null, null,
                null, "Rest before long run", null)
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

    private record TemplateSession(
        string SessionName,
        DayOfWeek DayOfWeek,
        WorkoutType WorkoutType,
        IntensityLevel IntensityLevel,
        int? DurationMinutes,
        decimal? Distance,
        string? WarmUp,
        string? SessionDescription,
        string? HRZones);
}

