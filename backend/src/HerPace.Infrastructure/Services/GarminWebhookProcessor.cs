using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using HerPace.Infrastructure.Services.Providers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.Services;

/// <summary>
/// Interface for processing Garmin webhook events in a background job.
/// </summary>
public interface IGarminWebhookProcessor
{
    Task ProcessActivityAsync(string garminUserId, long activityId, GarminActivityPush activityData);
    Task ProcessWomensHealthAsync(string garminUserId, GarminWomensHealthPush healthData);
}

/// <summary>
/// Processes Garmin webhook pushes: imports activities and updates women's health cycle data.
/// Runs as a Hangfire background job.
/// </summary>
public class GarminWebhookProcessor : IGarminWebhookProcessor
{
    private readonly HerPaceDbContext _dbContext;
    private readonly IActivityImportService _importService;
    private readonly ILogger<GarminWebhookProcessor> _logger;

    public GarminWebhookProcessor(
        HerPaceDbContext dbContext,
        IActivityImportService importService,
        ILogger<GarminWebhookProcessor> logger)
    {
        _dbContext = dbContext;
        _importService = importService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task ProcessActivityAsync(string garminUserId, long activityId, GarminActivityPush activityData)
    {
        _logger.LogInformation("Processing Garmin activity {ActivityId} for user {UserId}",
            activityId, garminUserId);

        // Find the connected service by Garmin user ID
        var service = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs =>
                cs.Platform == FitnessPlatform.Garmin &&
                cs.ExternalUserId == garminUserId &&
                cs.Status == ConnectionStatus.Connected);

        if (service == null)
        {
            _logger.LogWarning("No connected Garmin service found for user {UserId}", garminUserId);
            return;
        }

        // Normalize the activity from the push payload
        var normalized = GarminProvider.NormalizeActivityFromPush(activityData);
        if (normalized == null)
        {
            _logger.LogDebug("Activity {ActivityId} filtered (non-running type: {Type})",
                activityId, activityData.ActivityType);
            return;
        }

        // Import through the standard pipeline (dedup, matching, storage)
        var result = await _importService.ImportActivitiesAsync(
            service.RunnerId, FitnessPlatform.Garmin, new List<NormalizedActivity> { normalized });

        // Update last sync time
        service.LastSyncAt = DateTime.UtcNow;
        service.LastSyncError = null;
        service.UpdatedAt = DateTime.UtcNow;

        // Create sync log
        _dbContext.SyncLogs.Add(new SyncLog
        {
            Id = Guid.NewGuid(),
            ConnectedServiceId = service.Id,
            RunnerId = service.RunnerId,
            Platform = FitnessPlatform.Garmin,
            SyncType = "webhook",
            StartedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
            ActivitiesFound = 1,
            ActivitiesImported = result.Imported,
            ActivitiesDuplicate = result.Duplicates,
            ActivitiesFiltered = result.Filtered,
            Success = true
        });

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Garmin activity {ActivityId} processed: imported={Imported}, duplicate={Dup}",
            activityId, result.Imported, result.Duplicates);
    }

    /// <inheritdoc />
    public async Task ProcessWomensHealthAsync(string garminUserId, GarminWomensHealthPush healthData)
    {
        _logger.LogInformation("Processing Garmin women's health data for user {UserId}", garminUserId);

        // Find the connected service
        var service = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs =>
                cs.Platform == FitnessPlatform.Garmin &&
                cs.ExternalUserId == garminUserId &&
                cs.Status == ConnectionStatus.Connected);

        if (service == null)
        {
            _logger.LogWarning("No connected Garmin service found for user {UserId}", garminUserId);
            return;
        }

        // Check if user has opted in to women's health data sharing
        if (!service.WomensHealthDataOptIn)
        {
            _logger.LogDebug("Garmin user {UserId} has not opted in to women's health data", garminUserId);
            return;
        }

        // Parse period start date and cycle length
        if (string.IsNullOrEmpty(healthData.PeriodStartDate) || !healthData.PredictedCycleLength.HasValue)
        {
            _logger.LogDebug("Garmin women's health data incomplete for user {UserId}", garminUserId);
            return;
        }

        if (!DateTime.TryParse(healthData.PeriodStartDate, out var periodStartDate))
        {
            _logger.LogWarning("Failed to parse Garmin period start date: {Date}", healthData.PeriodStartDate);
            return;
        }

        // Find the runner and update cycle data if Garmin data is more recent
        var runner = await _dbContext.Runners.FindAsync(service.RunnerId);
        if (runner == null)
        {
            _logger.LogWarning("Runner not found for service {ServiceId}", service.Id);
            return;
        }

        var garminPeriodStart = periodStartDate;
        var garminCycleLength = healthData.PredictedCycleLength.Value;

        // Only update if Garmin data is more recent than current data
        if (!runner.LastPeriodStart.HasValue || garminPeriodStart > runner.LastPeriodStart.Value)
        {
            runner.LastPeriodStart = garminPeriodStart;
            runner.CycleLength = garminCycleLength;
            runner.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation(
                "Updated runner {RunnerId} cycle data from Garmin: period={PeriodStart}, length={CycleLength}",
                runner.Id, garminPeriodStart, garminCycleLength);
        }
        else
        {
            _logger.LogDebug("Garmin cycle data not more recent for runner {RunnerId}", runner.Id);
        }
    }
}
