using HerPace.Core.Enums;

namespace HerPace.Core.Entities;

/// <summary>
/// Represents a running activity imported from an external fitness service.
/// Unique constraint on (Platform, ExternalActivityId) prevents duplicate imports.
/// </summary>
public class ImportedActivity
{
    public Guid Id { get; set; }
    public Guid RunnerId { get; set; }

    // Source Information
    public FitnessPlatform Platform { get; set; }
    public string ExternalActivityId { get; set; } = string.Empty; // Platform-specific activity ID

    // Session Matching (optional link to a planned training session)
    public Guid? TrainingSessionId { get; set; }

    // Activity Details
    public DateTime ActivityDate { get; set; } // Start time of the activity
    public string ActivityType { get; set; } = string.Empty; // "Run" or "TreadmillRun"
    public string? ActivityTitle { get; set; } // Name/title from source platform

    // Metrics (all metric units: meters, seconds, BPM)
    public double? DistanceMeters { get; set; }
    public int? DurationSeconds { get; set; }
    public int? MovingTimeSeconds { get; set; } // Excluding pauses
    public double? AveragePaceSecondsPerKm { get; set; }
    public int? AverageHeartRate { get; set; }
    public int? MaxHeartRate { get; set; }
    public int? Cadence { get; set; } // Steps per minute
    public double? ElevationGainMeters { get; set; }
    public int? CaloriesBurned { get; set; }

    // Route & Raw Data
    public string? GpsRouteJson { get; set; } // JSON array of [{lat, lng, altitude?}]
    public string? RawResponseJson { get; set; } // Full API response for debugging

    // Timestamps
    public DateTime ImportedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Runner Runner { get; set; } = null!;
    public TrainingSession? TrainingSession { get; set; }
}
