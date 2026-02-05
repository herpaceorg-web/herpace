using HerPace.Core.Enums;

namespace HerPace.Core.DTOs;

/// <summary>
/// Captures the before/after state of a training session during plan recalculation.
/// Used to show users what changed when their plan was adapted.
/// </summary>
public class SessionChangeDto
{
    public Guid SessionId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string SessionName { get; set; } = string.Empty;

    // Before values (from before recalculation)
    public decimal? OldDistance { get; set; }
    public int? OldDuration { get; set; }
    public WorkoutType? OldWorkoutType { get; set; }
    public IntensityLevel? OldIntensityLevel { get; set; }

    // After values (from after recalculation)
    public decimal? NewDistance { get; set; }
    public int? NewDuration { get; set; }
    public WorkoutType NewWorkoutType { get; set; }
    public IntensityLevel NewIntensityLevel { get; set; }

    /// <summary>
    /// Helper to determine if this session actually changed
    /// </summary>
    public bool HasChanges()
    {
        return OldDistance != NewDistance
               || OldDuration != NewDuration
               || OldWorkoutType != NewWorkoutType
               || OldIntensityLevel != NewIntensityLevel;
    }
}
