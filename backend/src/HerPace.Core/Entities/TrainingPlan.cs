using HerPace.Core.Enums;

namespace HerPace.Core.Entities;

/// <summary>
/// Represents a training plan for a specific race.
/// FR-017: Only one active plan allowed per runner.
/// </summary>
public class TrainingPlan
{
    public Guid Id { get; set; }
    public Guid RaceId { get; set; }
    public Guid RunnerId { get; set; }

    // Plan Status
    public PlanStatus Status { get; set; } = PlanStatus.Active;

    // Generation Information
    public GenerationSource GenerationSource { get; set; }
    public string? AiModel { get; set; } // e.g., "gemini-3-flash-preview"
    public string? AiRationale { get; set; } // Optional AI explanation

    // Plan Timeline
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Race Race { get; set; } = null!;
    public Runner Runner { get; set; } = null!;
    public ICollection<TrainingSession> Sessions { get; set; } = new List<TrainingSession>();
}
