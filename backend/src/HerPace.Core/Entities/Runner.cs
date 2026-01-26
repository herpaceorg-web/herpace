namespace HerPace.Core.Entities;

/// <summary>
/// Represents a runner's profile with health and training preferences.
/// This is a placeholder that will be fully implemented in Phase 3 (User Story 1 - T029).
/// </summary>
public class Runner
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
}
