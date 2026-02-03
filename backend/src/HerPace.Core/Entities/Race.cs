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
    public string? Location { get; set; } // Race location (e.g., "Boston, MA")
    public DateTime RaceDate { get; set; }
    public DateTime? TrainingStartDate { get; set; } // User-selected start date for training
    public decimal Distance { get; set; } // In kilometers or miles based on runner's preference
    public DistanceType DistanceType { get; set; }
    public string? GoalTime { get; set; } // Optional goal time (e.g., "3:45:00")
    public string? RaceCompletionGoal { get; set; } // Qualitative goal text
    public bool IsPublic { get; set; } = false; // Future feature for social sharing

    // Race Results (post-race)
    public RaceCompletionStatus CompletionStatus { get; set; } = RaceCompletionStatus.NotAttempted;
    public TimeSpan? RaceResult { get; set; } // Actual finish time
    public DateTime? ResultLoggedAt { get; set; } // When result was logged

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Runner Runner { get; set; } = null!;
    public TrainingPlan? TrainingPlan { get; set; } // One race can have 0..1 active training plan
}
