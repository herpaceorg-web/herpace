namespace HerPace.Core.Configuration;

/// <summary>
/// Configuration options for fitness tracker integrations.
/// Bound from appsettings "FitnessTracker" section.
/// </summary>
public class FitnessTrackerOptions
{
    public const string SectionName = "FitnessTracker";

    public StravaOptions Strava { get; set; } = new();
    public GarminOptions Garmin { get; set; } = new();
    public int InitialImportDays { get; set; } = 30;
    public int SyncCooldownMinutes { get; set; } = 5;
    public int DuplicateTimeToleranceSeconds { get; set; } = 60;
    public int DuplicateDistanceTolerancePercent { get; set; } = 1;
}

public class StravaOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public string WebhookVerifyToken { get; set; } = string.Empty;
}

public class GarminOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
}
