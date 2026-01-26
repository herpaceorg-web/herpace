using HerPace.Core.Enums;

namespace HerPace.Core.Entities;

/// <summary>
/// Represents a runner's profile with health and training preferences.
/// One-to-one relationship with User.
/// </summary>
public class Runner
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // Fitness & Training Information
    public FitnessLevel FitnessLevel { get; set; }
    public decimal? TypicalWeeklyMileage { get; set; }
    public string? RecentRaceTime { get; set; } // e.g., "3:45:30" or "45:23"
    public DistanceUnit DistanceUnit { get; set; } = DistanceUnit.Kilometers;

    // Menstrual Cycle Information
    public int? CycleLength { get; set; } // 21-45 days, nullable if DoNotTrack
    public DateTime? LastPeriodStart { get; set; } // Nullable if DoNotTrack
    public CycleRegularity TypicalCycleRegularity { get; set; } = CycleRegularity.Regular;

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Race> Races { get; set; } = new List<Race>();
    public ICollection<TrainingPlan> TrainingPlans { get; set; } = new List<TrainingPlan>();
}

