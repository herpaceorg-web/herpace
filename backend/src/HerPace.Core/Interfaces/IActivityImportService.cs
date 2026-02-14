using HerPace.Core.DTOs;
using HerPace.Core.Enums;

namespace HerPace.Core.Interfaces;

/// <summary>
/// Service for importing, deduplicating, and matching fitness activities.
/// Handles the import pipeline: filter → normalize → dedup → match → store.
/// </summary>
public interface IActivityImportService
{
    /// <summary>
    /// Imports a batch of normalized activities through the full pipeline.
    /// Returns counts of imported, duplicate, and filtered activities.
    /// </summary>
    Task<ActivityUploadResponse> ImportActivitiesAsync(
        Guid runnerId,
        FitnessPlatform platform,
        List<NormalizedActivity> activities);

    /// <summary>
    /// Gets a paginated list of imported activities for a runner.
    /// </summary>
    Task<PaginatedActivitiesResponse> GetActivitiesAsync(
        Guid runnerId,
        FitnessPlatform? platform,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize);

    /// <summary>
    /// Gets full details of a single imported activity.
    /// </summary>
    Task<ImportedActivityDetailDto?> GetActivityDetailAsync(Guid activityId, Guid runnerId);
}
