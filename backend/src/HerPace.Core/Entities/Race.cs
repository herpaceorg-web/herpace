using HerPace.Core.Enums;

namespace HerPace.Core.Entities;

/// <summary>
/// Represents a race goal that a runner is training for.
/// </summary>
public class Race
{
    public Guid Id { get; set; }
    public Guid RunnerId { get; set; }

    // Race Details
    public string RaceName { get; set; } = string.Empty;
    public DateTime RaceDate { get; set; }
    public decimal Distance { get; set; } // In kilometers or miles based on runner's preference
    public DistanceType DistanceType { get; set; }
    public string? GoalTime { get; set; } // Optional goal time (e.g., "3:45:00")
    public bool IsPublic { get; set; } = false; // Future feature for social sharing

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Runner Runner { get; set; } = null!;
    public TrainingPlan? TrainingPlan { get; set; } // One race can have 0..1 active training plan
}
