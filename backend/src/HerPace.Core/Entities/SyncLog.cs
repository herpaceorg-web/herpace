using HerPace.Core.Enums;

namespace HerPace.Core.Entities;

/// <summary>
/// Tracks synchronization events for auditing, troubleshooting, and monitoring.
/// Each record represents a single sync attempt (initial, webhook, manual, or background).
/// </summary>
public class SyncLog
{
    public Guid Id { get; set; }
    public Guid ConnectedServiceId { get; set; }
    public Guid RunnerId { get; set; }

    // Sync Details
    public FitnessPlatform Platform { get; set; }
    public string SyncType { get; set; } = string.Empty; // "initial", "webhook", "manual", "background"
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; } // Null if in-progress or failed

    // Activity Counts
    public int ActivitiesFound { get; set; }
    public int ActivitiesImported { get; set; }
    public int ActivitiesDuplicate { get; set; }
    public int ActivitiesFiltered { get; set; }

    // Result
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; } // e.g., "TOKEN_EXPIRED", "RATE_LIMITED", "SERVICE_UNAVAILABLE"

    // Navigation properties
    public ConnectedService ConnectedService { get; set; } = null!;
    public Runner Runner { get; set; } = null!;
}
