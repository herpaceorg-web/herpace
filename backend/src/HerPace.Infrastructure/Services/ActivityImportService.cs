using System.Text.Json;
using HerPace.Core.Configuration;
using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HerPace.Infrastructure.Services;

/// <summary>
/// Implements the activity import pipeline: filter → normalize → dedup → match → store.
/// Also handles paginated activity listing and detail retrieval.
/// </summary>
public class ActivityImportService : IActivityImportService
{
    private readonly HerPaceDbContext _dbContext;
    private readonly FitnessTrackerOptions _options;
    private readonly ILogger<ActivityImportService> _logger;

    private static readonly HashSet<string> AllowedActivityTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "Run", "TreadmillRun"
    };

    public ActivityImportService(
        HerPaceDbContext dbContext,
        IOptions<FitnessTrackerOptions> options,
        ILogger<ActivityImportService> logger)
    {
        _dbContext = dbContext;
        _options = options.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ActivityUploadResponse> ImportActivitiesAsync(
        Guid runnerId,
        FitnessPlatform platform,
        List<NormalizedActivity> activities)
    {
        var response = new ActivityUploadResponse();

        foreach (var activity in activities)
        {
            var resultItem = new ActivityUploadResultItem
            {
                ExternalActivityId = activity.ExternalActivityId
            };

            // Step 1: Filter non-running activities
            if (!AllowedActivityTypes.Contains(activity.ActivityType))
            {
                resultItem.Status = "filtered";
                response.Filtered++;
                response.Activities.Add(resultItem);
                _logger.LogDebug("Filtered non-running activity {ExternalId} (type: {Type})",
                    activity.ExternalActivityId, activity.ActivityType);
                continue;
            }

            // Step 2: Check exact duplicate (same source, same external ID)
            var exactDuplicate = await _dbContext.ImportedActivities.AnyAsync(ia =>
                ia.Platform == platform &&
                ia.ExternalActivityId == activity.ExternalActivityId);

            if (exactDuplicate)
            {
                resultItem.Status = "duplicate";
                response.Duplicates++;
                response.Activities.Add(resultItem);
                _logger.LogDebug("Skipped exact duplicate {ExternalId} from {Platform}",
                    activity.ExternalActivityId, platform);
                continue;
            }

            // Step 3: Check cross-platform duplicate (time + distance tolerance)
            if (await IsCrossPlatformDuplicateAsync(runnerId, activity))
            {
                resultItem.Status = "duplicate";
                response.Duplicates++;
                response.Activities.Add(resultItem);
                _logger.LogDebug("Skipped cross-platform duplicate {ExternalId} from {Platform}",
                    activity.ExternalActivityId, platform);
                continue;
            }

            // Step 4: Import the activity
            var importedActivity = new ImportedActivity
            {
                Id = Guid.NewGuid(),
                RunnerId = runnerId,
                Platform = platform,
                ExternalActivityId = activity.ExternalActivityId,
                ActivityDate = activity.ActivityDate,
                ActivityType = activity.ActivityType,
                ActivityTitle = activity.ActivityTitle,
                DistanceMeters = activity.DistanceMeters,
                DurationSeconds = activity.DurationSeconds,
                MovingTimeSeconds = activity.MovingTimeSeconds,
                AveragePaceSecondsPerKm = activity.AveragePaceSecondsPerKm,
                AverageHeartRate = activity.AverageHeartRate,
                MaxHeartRate = activity.MaxHeartRate,
                Cadence = activity.Cadence,
                ElevationGainMeters = activity.ElevationGainMeters,
                CaloriesBurned = activity.CaloriesBurned,
                GpsRouteJson = activity.GpsRoute != null
                    ? JsonSerializer.Serialize(activity.GpsRoute)
                    : null,
                RawResponseJson = activity.RawResponseJson,
                ImportedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            // Step 5: Match to training session
            var matchedSession = await MatchToTrainingSessionAsync(runnerId, activity.ActivityDate);
            if (matchedSession != null)
            {
                importedActivity.TrainingSessionId = matchedSession.Id;

                // Mark session as completed with imported metrics
                matchedSession.CompletedAt = activity.ActivityDate;
                if (activity.DistanceMeters.HasValue)
                    matchedSession.ActualDistance = (decimal)(activity.DistanceMeters.Value / 1000.0); // meters to km
                if (activity.DurationSeconds.HasValue)
                    matchedSession.ActualDuration = activity.DurationSeconds.Value / 60; // seconds to minutes
                matchedSession.UpdatedAt = DateTime.UtcNow;

                _logger.LogInformation("Matched activity {ExternalId} to session {SessionId} ({SessionName})",
                    activity.ExternalActivityId, matchedSession.Id, matchedSession.SessionName);
            }

            _dbContext.ImportedActivities.Add(importedActivity);

            resultItem.Id = importedActivity.Id;
            resultItem.Status = "imported";
            resultItem.MatchedTrainingSessionId = importedActivity.TrainingSessionId;
            response.Imported++;
            response.Activities.Add(resultItem);
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            "Import complete for runner {RunnerId}/{Platform}: {Imported} imported, {Duplicates} duplicates, {Filtered} filtered",
            runnerId, platform, response.Imported, response.Duplicates, response.Filtered);

        return response;
    }

    /// <inheritdoc />
    public async Task<PaginatedActivitiesResponse> GetActivitiesAsync(
        Guid runnerId,
        FitnessPlatform? platform,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _dbContext.ImportedActivities
            .Where(ia => ia.RunnerId == runnerId);

        if (platform.HasValue)
            query = query.Where(ia => ia.Platform == platform.Value);

        if (from.HasValue)
            query = query.Where(ia => ia.ActivityDate >= from.Value);

        if (to.HasValue)
            query = query.Where(ia => ia.ActivityDate <= to.Value);

        var totalItems = await query.CountAsync();

        var activities = await query
            .OrderByDescending(ia => ia.ActivityDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ia => new ImportedActivitySummaryDto
            {
                Id = ia.Id,
                Platform = ia.Platform.ToString(),
                ActivityDate = ia.ActivityDate,
                ActivityTitle = ia.ActivityTitle,
                ActivityType = ia.ActivityType,
                DistanceMeters = ia.DistanceMeters,
                DurationSeconds = ia.DurationSeconds,
                AveragePaceSecondsPerKm = ia.AveragePaceSecondsPerKm,
                AverageHeartRate = ia.AverageHeartRate,
                MaxHeartRate = ia.MaxHeartRate,
                Cadence = ia.Cadence,
                ElevationGainMeters = ia.ElevationGainMeters,
                CaloriesBurned = ia.CaloriesBurned,
                HasGpsRoute = ia.GpsRouteJson != null,
                MatchedTrainingSessionId = ia.TrainingSessionId,
                ImportedAt = ia.ImportedAt
            })
            .ToListAsync();

        return new PaginatedActivitiesResponse
        {
            Activities = activities,
            Pagination = new PaginationInfo
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling((double)totalItems / pageSize)
            }
        };
    }

    /// <inheritdoc />
    public async Task<ImportedActivityDetailDto?> GetActivityDetailAsync(Guid activityId, Guid runnerId)
    {
        var activity = await _dbContext.ImportedActivities
            .Include(ia => ia.TrainingSession)
            .FirstOrDefaultAsync(ia => ia.Id == activityId && ia.RunnerId == runnerId);

        if (activity == null)
            return null;

        var dto = new ImportedActivityDetailDto
        {
            Id = activity.Id,
            Platform = activity.Platform.ToString(),
            ActivityDate = activity.ActivityDate,
            ActivityTitle = activity.ActivityTitle,
            ActivityType = activity.ActivityType,
            DistanceMeters = activity.DistanceMeters,
            DurationSeconds = activity.DurationSeconds,
            MovingTimeSeconds = activity.MovingTimeSeconds,
            AveragePaceSecondsPerKm = activity.AveragePaceSecondsPerKm,
            AverageHeartRate = activity.AverageHeartRate,
            MaxHeartRate = activity.MaxHeartRate,
            Cadence = activity.Cadence,
            ElevationGainMeters = activity.ElevationGainMeters,
            CaloriesBurned = activity.CaloriesBurned,
            ImportedAt = activity.ImportedAt
        };

        // Parse GPS route from JSON
        if (!string.IsNullOrEmpty(activity.GpsRouteJson))
        {
            try
            {
                dto.GpsRoute = JsonSerializer.Deserialize<List<GpsPoint>>(activity.GpsRouteJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse GPS route JSON for activity {ActivityId}", activityId);
            }
        }

        // Include matched training session info
        if (activity.TrainingSession != null)
        {
            dto.MatchedTrainingSession = new MatchedSessionDto
            {
                Id = activity.TrainingSession.Id,
                SessionName = activity.TrainingSession.SessionName,
                ScheduledDate = activity.TrainingSession.ScheduledDate,
                WorkoutType = activity.TrainingSession.WorkoutType.ToString(),
                PlannedDistance = activity.TrainingSession.Distance,
                PlannedDuration = activity.TrainingSession.DurationMinutes
            };
        }

        return dto;
    }

    private async Task<bool> IsCrossPlatformDuplicateAsync(Guid runnerId, NormalizedActivity activity)
    {
        if (!activity.DistanceMeters.HasValue || activity.DistanceMeters.Value <= 0)
            return false;

        var timeTolerance = TimeSpan.FromSeconds(_options.DuplicateTimeToleranceSeconds);
        var distanceTolerance = _options.DuplicateDistanceTolerancePercent / 100.0;

        var minDate = activity.ActivityDate - timeTolerance;
        var maxDate = activity.ActivityDate + timeTolerance;

        var candidates = await _dbContext.ImportedActivities
            .Where(ia => ia.RunnerId == runnerId
                && ia.ActivityDate >= minDate
                && ia.ActivityDate <= maxDate
                && ia.DistanceMeters.HasValue)
            .Select(ia => new { ia.DistanceMeters })
            .ToListAsync();

        return candidates.Any(c =>
        {
            var maxDist = Math.Max(c.DistanceMeters!.Value, activity.DistanceMeters.Value);
            if (maxDist <= 0) return false;
            var diff = Math.Abs(c.DistanceMeters.Value - activity.DistanceMeters.Value) / maxDist;
            return diff < distanceTolerance;
        });
    }

    private async Task<TrainingSession?> MatchToTrainingSessionAsync(Guid runnerId, DateTime activityDate)
    {
        var activityDateOnly = activityDate.Date;

        // Find uncompleted training sessions scheduled for the same day
        var candidates = await _dbContext.TrainingSessions
            .Include(ts => ts.TrainingPlan)
            .Where(ts => ts.TrainingPlan.RunnerId == runnerId
                && ts.ScheduledDate.Date == activityDateOnly
                && ts.WorkoutType != WorkoutType.Rest
                && ts.CompletedAt == null
                && !ts.IsSkipped)
            .OrderBy(ts => ts.Id) // Deterministic tie-breaking
            .ToListAsync();

        return candidates.FirstOrDefault();
    }
}
