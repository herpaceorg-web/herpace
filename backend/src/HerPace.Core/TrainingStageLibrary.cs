using HerPace.Core.DTOs;
using HerPace.Core.Enums;

namespace HerPace.Core;

/// <summary>
/// Provides training-stage calculation and static descriptive content.
/// Stages are computed from plan timeline position — nothing is persisted.
/// </summary>
public static class TrainingStageLibrary
{
    private static readonly Dictionary<TrainingStage, TrainingStageInfoDto> _stageInfo = new()
    {
        [TrainingStage.Base] = new TrainingStageInfoDto
        {
            Name = "Base",
            Tagline = "Building Your Foundation",
            Description = "This is where endurance begins. Your body is adapting to consistent training — " +
                          "building mitochondria, strengthening connective tissue, and establishing aerobic efficiency.",
            Focus = "Consistent easy-pace running, building weekly mileage gradually (no more than 10% per week).",
            WhatToExpect = "Volume increases slowly. Most runs feel comfortable and conversational.",
            Tip = "Don't skip easy days to do harder ones. Consistency here is what everything else is built on."
        },
        [TrainingStage.Build] = new TrainingStageInfoDto
        {
            Name = "Build",
            Tagline = "Raising the Bar",
            Description = "Your aerobic base is solid — now it's time to sharpen race-specific fitness. " +
                          "Tempo runs and intervals appear more frequently to push your lactate threshold and VO2 max.",
            Focus = "Introducing quality workouts alongside your endurance base. Long runs get longer.",
            WhatToExpect = "You'll feel the workouts more. Recovery between hard days becomes important.",
            Tip = "Nail your easy days between hard sessions. Fuel properly — your glycogen needs go up."
        },
        [TrainingStage.Peak] = new TrainingStageInfoDto
        {
            Name = "Peak",
            Tagline = "Race-Ready Power",
            Description = "This is your highest-volume, highest-intensity phase. Your body is performing close to " +
                          "race-day conditions. These weeks simulate the demands of your goal race.",
            Focus = "Race-pace work, long runs at goal effort, back-to-back quality sessions.",
            WhatToExpect = "This is the hardest stretch. Fatigue is normal — your body is building the fitness it needs on race day.",
            Tip = "Trust the plan. Sleep and nutrition are just as important as the workouts themselves."
        },
        [TrainingStage.Taper] = new TrainingStageInfoDto
        {
            Name = "Taper",
            Tagline = "Sharpening for Race Day",
            Description = "Volume drops intentionally — 30–50% less running. This isn't slacking off; " +
                          "it's when your body consolidates all that training into peak performance.",
            Focus = "Reduced volume, maintained intensity on key sessions, mental preparation for race day.",
            WhatToExpect = "Legs may feel heavy or restless. This is normal — your body is recovering and getting faster.",
            Tip = "Resist the urge to do more. Stay active but light. Focus on sleep, hydration, and race-day logistics."
        }
    };

    /// <summary>
    /// Returns the static descriptive info for a given training stage.
    /// </summary>
    public static TrainingStageInfoDto GetInfo(TrainingStage stage)
    {
        return _stageInfo[stage];
    }

    /// <summary>
    /// Calculates which training stage a session falls in based on its position
    /// within the plan's start–end timeline. Uses week-based boundaries that
    /// mirror the existing 2-week taper convention in both the AI prompt and the fallback generator.
    /// </summary>
    public static TrainingStage CalculateStage(DateTime sessionDate, DateTime planStart, DateTime planEnd)
    {
        var totalDays = (planEnd.Date - planStart.Date).Days;
        if (totalDays <= 0)
            return TrainingStage.Build;

        var totalWeeks = (int)Math.Ceiling(totalDays / 7.0);
        var sessionDay = (sessionDate.Date - planStart.Date).Days;
        var sessionWeek = sessionDay / 7; // 0-indexed

        // Taper: final 2 weeks (matches existing FallbackPlanGenerator and Gemini prompt convention)
        if (sessionWeek >= totalWeeks - 2)
            return TrainingStage.Taper;

        // Plans shorter than 6 weeks: everything before taper is Build
        if (totalWeeks < 6)
            return TrainingStage.Build;

        // Peak: the 2 weeks immediately before taper
        if (sessionWeek >= totalWeeks - 4)
            return TrainingStage.Peak;

        // Plans 6–9 weeks: split the remaining pre-peak weeks into Base and Build at the midpoint
        if (totalWeeks < 10)
        {
            var prePeakWeeks = totalWeeks - 4;
            var midpoint = prePeakWeeks / 2;
            return sessionWeek < midpoint ? TrainingStage.Base : TrainingStage.Build;
        }

        // Plans 10+ weeks: Base is the first 35%, Build is everything between Base and Peak
        var baseEndWeek = (int)(totalWeeks * 0.35);
        return sessionWeek < baseEndWeek ? TrainingStage.Base : TrainingStage.Build;
    }
}
