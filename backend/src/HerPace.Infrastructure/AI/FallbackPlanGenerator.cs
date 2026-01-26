using HerPace.Core.DTOs;
using HerPace.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.AI;

/// <summary>
/// Fallback training plan generator using rule-based templates.
/// Used when Gemini API is unavailable or fails (FR-015).
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

        var plan = new GeneratedPlanDto
        {
            GenerationSource = "Fallback",
            AiModel = null,
            AiRationale = "Generated from template due to AI unavailability",
            Metadata = new PlanMetadata
            {
                TotalWeeks = CalculateTotalWeeks(request.RaceDate),
                WeeklyMileageRange = $"20-40 {request.DistanceUnit}"
            },
            Sessions = GenerateTemplateSessions(request)
        };

        _logger.LogInformation("Fallback plan generated with {Count} sessions", plan.Sessions.Count);

        return Task.FromResult(plan);
    }

    private int CalculateTotalWeeks(DateTime raceDate)
    {
        var daysUntilRace = (raceDate - DateTime.UtcNow).Days;
        return Math.Max(1, daysUntilRace / 7);
    }

    private List<TrainingSessionDto> GenerateTemplateSessions(PlanGenerationRequest request)
    {
        var sessions = new List<TrainingSessionDto>();
        var currentDate = DateTime.UtcNow.Date;
        var raceDate = request.RaceDate.Date;
        var totalWeeks = CalculateTotalWeeks(raceDate);

        // Simple 3-day per week template (beginner-friendly)
        var weekTemplate = new[]
        {
            (DayOfWeek.Tuesday, "Easy", 30, 5.0m, "Low"),
            (DayOfWeek.Thursday, "Tempo", 40, 6.0m, "Moderate"),
            (DayOfWeek.Saturday, "Long", 60, 10.0m, "Low")
        };

        // Generate sessions week by week
        for (int week = 0; week < totalWeeks; week++)
        {
            var weekStart = currentDate.AddDays(week * 7);

            // Taper in final 2 weeks
            var isTaper = week >= totalWeeks - 2;
            var distanceMultiplier = isTaper ? 0.6m : 1.0m;
            var durationMultiplier = isTaper ? 0.7 : 1.0;

            foreach (var (dayOfWeek, workoutType, baseDuration, baseDistance, intensity) in weekTemplate)
            {
                var sessionDate = GetNextDayOfWeek(weekStart, dayOfWeek);

                if (sessionDate > raceDate)
                    continue;

                // Find cycle phase for this date
                var cyclePhase = request.CyclePhases
                    .FirstOrDefault(p => p.Date.Date == sessionDate)?
                    .Phase ?? "Follicular";

                sessions.Add(new TrainingSessionDto
                {
                    ScheduledDate = sessionDate,
                    WorkoutType = workoutType,
                    DurationMinutes = (int)(baseDuration * durationMultiplier),
                    Distance = baseDistance * distanceMultiplier,
                    IntensityLevel = intensity,
                    CyclePhase = cyclePhase,
                    PhaseGuidance = GetPhaseGuidance(cyclePhase, workoutType)
                });
            }

            // Add rest days
            var restDays = new[] { DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday, DayOfWeek.Sunday };
            foreach (var dayOfWeek in restDays)
            {
                var restDate = GetNextDayOfWeek(weekStart, dayOfWeek);
                if (restDate > raceDate)
                    continue;

                var cyclePhase = request.CyclePhases
                    .FirstOrDefault(p => p.Date.Date == restDate)?
                    .Phase ?? "Follicular";

                sessions.Add(new TrainingSessionDto
                {
                    ScheduledDate = restDate,
                    WorkoutType = "Rest",
                    DurationMinutes = null,
                    Distance = null,
                    IntensityLevel = "Low",
                    CyclePhase = cyclePhase,
                    PhaseGuidance = "Recovery day - active rest or complete rest"
                });
            }
        }

        return sessions.OrderBy(s => s.ScheduledDate).ToList();
    }

    private DateTime GetNextDayOfWeek(DateTime startDate, DayOfWeek targetDay)
    {
        int daysToAdd = ((int)targetDay - (int)startDate.DayOfWeek + 7) % 7;
        return startDate.AddDays(daysToAdd);
    }

    private string GetPhaseGuidance(string cyclePhase, string workoutType)
    {
        return cyclePhase switch
        {
            "Follicular" => "High energy phase - great time for quality work!",
            "Ovulatory" => "Peak performance window - push hard today!",
            "Luteal" => "Focus on consistent effort, listen to your body.",
            "Menstrual" => "Recovery focus - easy effort is perfect.",
            _ => "Listen to your body and adjust as needed."
        };
    }
}
