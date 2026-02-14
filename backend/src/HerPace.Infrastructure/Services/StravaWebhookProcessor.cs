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
/// Interface for processing Strava webhook events in a background job.
/// </summary>
public interface IStravaWebhookProcessor
{
    Task ProcessEventAsync(string objectType, long objectId, string aspectType, long ownerId, long eventTime);
}

/// <summary>
/// Processes Strava webhook events: imports new activities, handles deauthorization.
/// Runs as a Hangfire background job to keep webhook response fast.
/// </summary>
public class StravaWebhookProcessor : IStravaWebhookProcessor
{
    private readonly HerPaceDbContext _dbContext;
    private readonly IFitnessProvider _stravaProvider;
    private readonly IActivityImportService _importService;
    private readonly ILogger<StravaWebhookProcessor> _logger;

    public StravaWebhookProcessor(
        HerPaceDbContext dbContext,
        IFitnessProvider stravaProvider,
        IActivityImportService importService,
        ILogger<StravaWebhookProcessor> logger)
    {
        _dbContext = dbContext;
        _stravaProvider = stravaProvider;
        _importService = importService;
        _logger = logger;
    }

    public async Task ProcessEventAsync(
        string objectType, long objectId, string aspectType, long ownerId, long eventTime)
    {
        _logger.LogInformation(
            "Processing Strava webhook: {ObjectType}.{AspectType} objectId={ObjectId} ownerId={OwnerId}",
            objectType, aspectType, objectId, ownerId);

        switch (objectType.ToLowerInvariant())
        {
            case "activity" when aspectType.Equals("create", StringComparison.OrdinalIgnoreCase):
                await HandleActivityCreateAsync(objectId, ownerId);
                break;

            case "athlete" when aspectType.Equals("deauthorize", StringComparison.OrdinalIgnoreCase):
                await HandleAthleteDeauthorizeAsync(ownerId);
                break;

            default:
                // activity.update and activity.delete are ignored per spec
                // (imported records are point-in-time snapshots)
                _logger.LogDebug("Ignoring Strava event: {ObjectType}.{AspectType}", objectType, aspectType);
                break;
        }
    }

    private async Task HandleActivityCreateAsync(long activityId, long ownerId)
    {
        // Look up ConnectedService by Strava athlete ID (owner_id)
        var service = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs =>
                cs.Platform == FitnessPlatform.Strava &&
                cs.ExternalUserId == ownerId.ToString() &&
                cs.Status == ConnectionStatus.Connected);

        if (service == null)
        {
            _logger.LogWarning("No connected Strava service found for athlete {OwnerId}", ownerId);
            return;
        }

        // Create sync log entry
        var syncLog = new SyncLog
        {
            Id = Guid.NewGuid(),
            ConnectedServiceId = service.Id,
            RunnerId = service.RunnerId,
            Platform = FitnessPlatform.Strava,
            SyncType = "webhook",
            StartedAt = DateTime.UtcNow,
            Success = false
        };
        _dbContext.SyncLogs.Add(syncLog);
        await _dbContext.SaveChangesAsync();

        try
        {
            // Ensure token is valid
            var accessToken = await EnsureValidTokenAsync(service);
            if (accessToken == null)
            {
                syncLog.CompletedAt = DateTime.UtcNow;
                syncLog.ErrorMessage = "Token expired and refresh failed";
                await _dbContext.SaveChangesAsync();
                return;
            }

            // Fetch full activity detail from Strava
            var activity = await _stravaProvider.FetchActivityDetailAsync(
                accessToken, activityId.ToString());

            if (activity == null)
            {
                _logger.LogWarning("Failed to fetch Strava activity {ActivityId}", activityId);
                syncLog.CompletedAt = DateTime.UtcNow;
                syncLog.ErrorMessage = $"Failed to fetch activity {activityId}";
                await _dbContext.SaveChangesAsync();
                return;
            }

            // Run import pipeline
            var result = await _importService.ImportActivitiesAsync(
                service.RunnerId, FitnessPlatform.Strava, new List<NormalizedActivity> { activity });

            // Update sync log
            syncLog.CompletedAt = DateTime.UtcNow;
            syncLog.ActivitiesImported = result.Imported;
            syncLog.ActivitiesDuplicate = result.Duplicates;
            syncLog.ActivitiesFiltered = result.Filtered;
            syncLog.Success = true;

            // Update service last sync time
            service.LastSyncAt = DateTime.UtcNow;
            service.LastSyncError = null;
            service.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation(
                "Webhook import for runner {RunnerId}: {Imported} imported, {Duplicates} dupes, {Filtered} filtered",
                service.RunnerId, result.Imported, result.Duplicates, result.Filtered);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing webhook activity {ActivityId} for athlete {OwnerId}",
                activityId, ownerId);
            syncLog.CompletedAt = DateTime.UtcNow;
            syncLog.ErrorMessage = ex.Message;
            service.LastSyncError = ex.Message;
            service.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }
    }

    private async Task HandleAthleteDeauthorizeAsync(long ownerId)
    {
        var service = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs =>
                cs.Platform == FitnessPlatform.Strava &&
                cs.ExternalUserId == ownerId.ToString());

        if (service == null)
        {
            _logger.LogWarning("No Strava service found for deauthorized athlete {OwnerId}", ownerId);
            return;
        }

        service.Status = ConnectionStatus.Disconnected;
        service.DisconnectedAt = DateTime.UtcNow;
        service.AccessToken = null;
        service.RefreshToken = null;
        service.TokenExpiresAt = null;
        service.UpdatedAt = DateTime.UtcNow;

        _dbContext.SyncLogs.Add(new SyncLog
        {
            Id = Guid.NewGuid(),
            ConnectedServiceId = service.Id,
            RunnerId = service.RunnerId,
            Platform = FitnessPlatform.Strava,
            SyncType = "webhook",
            StartedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
            Success = true,
            ErrorMessage = "Athlete deauthorized via Strava"
        });

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Strava athlete {OwnerId} deauthorized, service disconnected for runner {RunnerId}",
            ownerId, service.RunnerId);
    }

    private async Task<string?> EnsureValidTokenAsync(ConnectedService service)
    {
        if (service.TokenExpiresAt.HasValue && service.TokenExpiresAt.Value > DateTime.UtcNow.AddMinutes(5))
        {
            return service.AccessToken;
        }

        // Token expired or about to expire — attempt refresh
        if (string.IsNullOrEmpty(service.RefreshToken))
        {
            _logger.LogWarning("No refresh token available for service {ServiceId}", service.Id);
            service.Status = ConnectionStatus.TokenExpired;
            service.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return null;
        }

        try
        {
            var result = await _stravaProvider.RefreshAccessTokenAsync(service.RefreshToken);
            service.AccessToken = result.AccessToken;
            service.RefreshToken = result.RefreshToken;
            service.TokenExpiresAt = result.ExpiresAt;
            service.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            _logger.LogDebug("Refreshed Strava token for service {ServiceId}", service.Id);
            return result.AccessToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh Strava token for service {ServiceId}", service.Id);
            service.Status = ConnectionStatus.TokenExpired;
            service.LastSyncError = "Token refresh failed: " + ex.Message;
            service.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return null;
        }
    }
}
