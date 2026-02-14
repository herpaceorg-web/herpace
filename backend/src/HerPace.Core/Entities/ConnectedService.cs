using HerPace.Core.Enums;

namespace HerPace.Core.Entities;

/// <summary>
/// Represents a user's authenticated connection to an external fitness platform.
/// One connection per platform per runner (unique constraint on RunnerId + Platform).
/// </summary>
public class ConnectedService
{
    public Guid Id { get; set; }
    public Guid RunnerId { get; set; }

    // Platform & Status
    public FitnessPlatform Platform { get; set; }
    public ConnectionStatus Status { get; set; } = ConnectionStatus.Connected;
    public string? ExternalUserId { get; set; } // Platform-specific user/athlete ID

    // OAuth Tokens (null for Health Connect which uses on-device permissions)
    public string? AccessToken { get; set; } // Encrypted at rest via EF Core value converter
    public string? RefreshToken { get; set; } // Encrypted at rest via EF Core value converter
    public DateTime? TokenExpiresAt { get; set; }
    public string? Scopes { get; set; } // Granted OAuth scopes (comma-separated)

    // Connection Lifecycle
    public DateTime ConnectedAt { get; set; }
    public DateTime? DisconnectedAt { get; set; }

    // Sync Tracking
    public DateTime? LastSyncAt { get; set; }
    public string? LastSyncError { get; set; }

    // Garmin Women's Health (opt-in for cycle data sync)
    public bool WomensHealthDataOptIn { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Runner Runner { get; set; } = null!;
    public ICollection<SyncLog> SyncLogs { get; set; } = new List<SyncLog>();
}
