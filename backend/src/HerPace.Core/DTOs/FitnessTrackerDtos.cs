using HerPace.Core.Enums;

namespace HerPace.Core.DTOs;

/// <summary>
/// Response for the connected services list endpoint.
/// </summary>
public class ServicesListResponse
{
    public List<ConnectedServiceDto> Services { get; set; } = new();
}

/// <summary>
/// DTO representing a connected fitness service and its status.
/// </summary>
public class ConnectedServiceDto
{
    public string Platform { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ExternalUserId { get; set; }
    public DateTime? ConnectedAt { get; set; }
    public DateTime? LastSyncAt { get; set; }
    public int ActivitiesImported { get; set; }
    public bool Available { get; set; }
    public bool? WomensHealthDataOptIn { get; set; }
}

/// <summary>
/// Summary DTO for imported activities in list view.
/// </summary>
public class ImportedActivitySummaryDto
{
    public Guid Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public DateTime ActivityDate { get; set; }
    public string? ActivityTitle { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public double? DistanceMeters { get; set; }
    public int? DurationSeconds { get; set; }
    public double? AveragePaceSecondsPerKm { get; set; }
    public int? AverageHeartRate { get; set; }
    public int? MaxHeartRate { get; set; }
    public int? Cadence { get; set; }
    public double? ElevationGainMeters { get; set; }
    public int? CaloriesBurned { get; set; }
    public bool HasGpsRoute { get; set; }
    public Guid? MatchedTrainingSessionId { get; set; }
    public DateTime ImportedAt { get; set; }
}

/// <summary>
/// Full detail DTO for a single imported activity, including GPS route and matched session.
/// </summary>
public class ImportedActivityDetailDto
{
    public Guid Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public DateTime ActivityDate { get; set; }
    public string? ActivityTitle { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public double? DistanceMeters { get; set; }
    public int? DurationSeconds { get; set; }
    public int? MovingTimeSeconds { get; set; }
    public double? AveragePaceSecondsPerKm { get; set; }
    public int? AverageHeartRate { get; set; }
    public int? MaxHeartRate { get; set; }
    public int? Cadence { get; set; }
    public double? ElevationGainMeters { get; set; }
    public int? CaloriesBurned { get; set; }
    public List<GpsPoint>? GpsRoute { get; set; }
    public MatchedSessionDto? MatchedTrainingSession { get; set; }
    public DateTime ImportedAt { get; set; }
}

/// <summary>
/// GPS coordinate point for route display.
/// </summary>
public class GpsPoint
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double? Altitude { get; set; }
}

/// <summary>
/// Summary of a matched training session for display alongside imported activity.
/// </summary>
public class MatchedSessionDto
{
    public Guid Id { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public string WorkoutType { get; set; } = string.Empty;
    public decimal? PlannedDistance { get; set; }
    public int? PlannedDuration { get; set; }
}

/// <summary>
/// Sync log entry DTO.
/// </summary>
public class SyncLogDto
{
    public Guid Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string SyncType { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ActivitiesImported { get; set; }
    public int ActivitiesDuplicate { get; set; }
    public int ActivitiesFiltered { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request to upload activities from Health Connect (Android app).
/// </summary>
public class ActivityUploadRequest
{
    public List<ActivityUploadItem> Activities { get; set; } = new();
}

/// <summary>
/// Single activity item in an upload batch from Health Connect.
/// </summary>
public class ActivityUploadItem
{
    public string ExternalActivityId { get; set; } = string.Empty;
    public DateTime ActivityDate { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public double? DistanceMeters { get; set; }
    public int? DurationSeconds { get; set; }
    public int? AverageHeartRate { get; set; }
    public int? MaxHeartRate { get; set; }
    public int? Cadence { get; set; }
    public double? ElevationGainMeters { get; set; }
    public int? CaloriesBurned { get; set; }
    public List<GpsPoint>? GpsRoute { get; set; }
}

/// <summary>
/// Response for activity upload endpoint.
/// </summary>
public class ActivityUploadResponse
{
    public int Imported { get; set; }
    public int Duplicates { get; set; }
    public int Filtered { get; set; }
    public List<ActivityUploadResultItem> Activities { get; set; } = new();
}

/// <summary>
/// Result for a single activity in an upload batch.
/// </summary>
public class ActivityUploadResultItem
{
    public Guid? Id { get; set; }
    public string ExternalActivityId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "imported", "duplicate", "filtered"
    public Guid? MatchedTrainingSessionId { get; set; }
}

/// <summary>
/// Request to register Health Connect as a connected service.
/// </summary>
public class ConnectHealthConnectRequest
{
    public List<string> GrantedPermissions { get; set; } = new();
}

/// <summary>
/// Request to update women's health data opt-in for a connected service.
/// </summary>
public class UpdateWomensHealthOptInRequest
{
    public bool OptIn { get; set; }
}

/// <summary>
/// Response after disconnecting a service.
/// </summary>
public class DisconnectResponse
{
    public string Platform { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool DataDeleted { get; set; }
    public int ActivitiesRetained { get; set; }
}

/// <summary>
/// Response after triggering a manual sync.
/// </summary>
public class SyncResponse
{
    public Guid SyncId { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Response for the OAuth initiation endpoint.
/// </summary>
public class OAuthInitiateResponse
{
    public string AuthorizationUrl { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
}

/// <summary>
/// Paginated list response for imported activities.
/// </summary>
public class PaginatedActivitiesResponse
{
    public List<ImportedActivitySummaryDto> Activities { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
}

/// <summary>
/// Pagination metadata.
/// </summary>
public class PaginationInfo
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

/// <summary>
/// Response for sync log listing.
/// </summary>
public class SyncLogListResponse
{
    public List<SyncLogDto> Logs { get; set; } = new();
}

/// <summary>
/// Platform-normalized activity data used during the import pipeline.
/// Shared between providers (Infrastructure) and import service (Core interface).
/// </summary>
public class NormalizedActivity
{
    public string ExternalActivityId { get; set; } = string.Empty;
    public DateTime ActivityDate { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string? ActivityTitle { get; set; }
    public double? DistanceMeters { get; set; }
    public int? DurationSeconds { get; set; }
    public int? MovingTimeSeconds { get; set; }
    public double? AveragePaceSecondsPerKm { get; set; }
    public int? AverageHeartRate { get; set; }
    public int? MaxHeartRate { get; set; }
    public int? Cadence { get; set; }
    public double? ElevationGainMeters { get; set; }
    public int? CaloriesBurned { get; set; }
    public List<GpsPoint>? GpsRoute { get; set; }
    public string? RawResponseJson { get; set; }
}

/// <summary>
/// Result of an OAuth token exchange or refresh.
/// </summary>
public class TokenExchangeResult
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string ExternalUserId { get; set; } = string.Empty;
    public string? Scopes { get; set; }
}
