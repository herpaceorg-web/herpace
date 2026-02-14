using Hangfire;
using HerPace.Core.Configuration;
using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using HerPace.Infrastructure.Services.Providers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HerPace.Infrastructure.Services;

/// <summary>
/// Manages connected fitness service lifecycle: connections, disconnections, sync triggers.
/// </summary>
public class FitnessTrackerService : IFitnessTrackerService
{
    private readonly HerPaceDbContext _dbContext;
    private readonly FitnessTrackerOptions _options;
    private readonly IEnumerable<IFitnessProvider> _providers;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<FitnessTrackerService> _logger;

    // Platform display names and availability
    private static readonly Dictionary<FitnessPlatform, (string DisplayName, bool Available)> PlatformInfo = new()
    {
        [FitnessPlatform.Strava] = ("Strava", true),
        [FitnessPlatform.HealthConnect] = ("Health Connect", true),
        [FitnessPlatform.Garmin] = ("Garmin Connect", true)
    };

    public FitnessTrackerService(
        HerPaceDbContext dbContext,
        IOptions<FitnessTrackerOptions> options,
        IEnumerable<IFitnessProvider> providers,
        IBackgroundJobClient backgroundJobClient,
        IMemoryCache memoryCache,
        ILogger<FitnessTrackerService> logger)
    {
        _dbContext = dbContext;
        _options = options.Value;
        _providers = providers;
        _backgroundJobClient = backgroundJobClient;
        _memoryCache = memoryCache;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ServicesListResponse> GetServicesAsync(Guid runnerId)
    {
        var connectedServices = await _dbContext.ConnectedServices
            .Where(cs => cs.RunnerId == runnerId)
            .ToListAsync();

        var activityCounts = await _dbContext.ImportedActivities
            .Where(ia => ia.RunnerId == runnerId)
            .GroupBy(ia => ia.Platform)
            .Select(g => new { Platform = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Platform, x => x.Count);

        var services = new List<ConnectedServiceDto>();

        foreach (var (platform, (displayName, available)) in PlatformInfo)
        {
            var connected = connectedServices.FirstOrDefault(cs => cs.Platform == platform);
            services.Add(new ConnectedServiceDto
            {
                Platform = platform.ToString(),
                DisplayName = displayName,
                Status = connected?.Status.ToString() ?? "NotConnected",
                ExternalUserId = connected?.ExternalUserId,
                ConnectedAt = connected?.ConnectedAt,
                LastSyncAt = connected?.LastSyncAt,
                ActivitiesImported = activityCounts.GetValueOrDefault(platform, 0),
                Available = available,
                WomensHealthDataOptIn = connected?.WomensHealthDataOptIn
            });
        }

        return new ServicesListResponse { Services = services };
    }

    /// <inheritdoc />
    public async Task<OAuthInitiateResponse> InitiateConnectionAsync(Guid runnerId, FitnessPlatform platform, string? source = null)
    {
        // Check if already connected
        var existing = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs => cs.RunnerId == runnerId && cs.Platform == platform);

        if (existing != null && existing.Status == ConnectionStatus.Connected)
        {
            throw new InvalidOperationException($"{platform} is already connected. Disconnect first to reconnect.");
        }

        var provider = GetProvider(platform);

        // Generate CSRF state token
        var state = Guid.NewGuid().ToString("N");
        _memoryCache.Set($"oauth_state_{runnerId}_{platform}", state,
            TimeSpan.FromMinutes(10));

        // Store reverse mapping so the callback can find the runner from the state
        _memoryCache.Set($"oauth_callback_{state}", runnerId,
            TimeSpan.FromMinutes(10));

        // Store client source so the callback knows where to redirect
        if (!string.IsNullOrEmpty(source))
        {
            _memoryCache.Set($"oauth_source_{state}", source,
                TimeSpan.FromMinutes(10));
        }

        var authUrl = provider.GetAuthorizationUrl(state);

        return new OAuthInitiateResponse
        {
            AuthorizationUrl = authUrl,
            State = state
        };
    }

    /// <inheritdoc />
    public async Task CompleteConnectionAsync(Guid runnerId, FitnessPlatform platform, string code, string state)
    {
        // Validate CSRF state
        var cacheKey = $"oauth_state_{runnerId}_{platform}";
        if (!_memoryCache.TryGetValue(cacheKey, out string? expectedState) || expectedState != state)
        {
            throw new InvalidOperationException("Invalid or expired OAuth state token.");
        }
        _memoryCache.Remove(cacheKey);

        var provider = GetProvider(platform);
        var tokenResult = await provider.ExchangeCodeForTokensAsync(code);

        // Create or update the ConnectedService record
        var existing = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs => cs.RunnerId == runnerId && cs.Platform == platform);

        if (existing != null)
        {
            existing.Status = ConnectionStatus.Connected;
            existing.ExternalUserId = tokenResult.ExternalUserId;
            existing.AccessToken = tokenResult.AccessToken;
            existing.RefreshToken = tokenResult.RefreshToken;
            existing.TokenExpiresAt = tokenResult.ExpiresAt;
            existing.Scopes = tokenResult.Scopes;
            existing.ConnectedAt = DateTime.UtcNow;
            existing.DisconnectedAt = null;
            existing.LastSyncError = null;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var connectedService = new ConnectedService
            {
                Id = Guid.NewGuid(),
                RunnerId = runnerId,
                Platform = platform,
                Status = ConnectionStatus.Connected,
                ExternalUserId = tokenResult.ExternalUserId,
                AccessToken = tokenResult.AccessToken,
                RefreshToken = tokenResult.RefreshToken,
                TokenExpiresAt = tokenResult.ExpiresAt,
                Scopes = tokenResult.Scopes,
                ConnectedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.ConnectedServices.Add(connectedService);
        }

        await _dbContext.SaveChangesAsync();

        // Queue background job for initial historical import
        _backgroundJobClient.Enqueue<IActivityImportService>(svc =>
            svc.ImportActivitiesAsync(runnerId, platform, null!));

        _logger.LogInformation("Connected {Platform} for runner {RunnerId} (athlete: {AthleteId})",
            platform, runnerId, tokenResult.ExternalUserId);
    }

    /// <inheritdoc />
    public async Task<ConnectedServiceDto> ConnectHealthConnectAsync(Guid runnerId, ConnectHealthConnectRequest request)
    {
        var existing = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs => cs.RunnerId == runnerId && cs.Platform == FitnessPlatform.HealthConnect);

        if (existing != null)
        {
            existing.Status = ConnectionStatus.Connected;
            existing.Scopes = string.Join(",", request.GrantedPermissions);
            existing.ConnectedAt = DateTime.UtcNow;
            existing.DisconnectedAt = null;
            existing.LastSyncError = null;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new ConnectedService
            {
                Id = Guid.NewGuid(),
                RunnerId = runnerId,
                Platform = FitnessPlatform.HealthConnect,
                Status = ConnectionStatus.Connected,
                Scopes = string.Join(",", request.GrantedPermissions),
                ConnectedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.ConnectedServices.Add(existing);
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Connected Health Connect for runner {RunnerId} with permissions: {Permissions}",
            runnerId, existing.Scopes);

        return new ConnectedServiceDto
        {
            Platform = FitnessPlatform.HealthConnect.ToString(),
            DisplayName = "Health Connect",
            Status = ConnectionStatus.Connected.ToString(),
            ConnectedAt = existing.ConnectedAt
        };
    }

    /// <inheritdoc />
    public async Task<DisconnectResponse> DisconnectAsync(Guid runnerId, FitnessPlatform platform, bool deleteData)
    {
        var service = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs => cs.RunnerId == runnerId && cs.Platform == platform);

        if (service == null)
        {
            throw new InvalidOperationException($"{platform} is not connected.");
        }

        // Revoke external access token if available (FR-015)
        if (!string.IsNullOrEmpty(service.AccessToken))
        {
            try
            {
                var provider = GetProvider(platform);
                await provider.RevokeAccessAsync(service.AccessToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to revoke {Platform} token for runner {RunnerId}", platform, runnerId);
            }
        }

        // Update connection status
        service.Status = ConnectionStatus.Disconnected;
        service.DisconnectedAt = DateTime.UtcNow;
        service.AccessToken = null;
        service.RefreshToken = null;
        service.TokenExpiresAt = null;
        service.UpdatedAt = DateTime.UtcNow;

        var activitiesRetained = 0;

        if (deleteData)
        {
            // Delete all imported activities and unlink matched training sessions (FR-019)
            var activities = await _dbContext.ImportedActivities
                .Where(ia => ia.RunnerId == runnerId && ia.Platform == platform)
                .Include(ia => ia.TrainingSession)
                .ToListAsync();

            foreach (var activity in activities)
            {
                if (activity.TrainingSession != null)
                {
                    // Unlink the session but keep it — just clear the completion data from import
                    activity.TrainingSession.CompletedAt = null;
                    activity.TrainingSession.ActualDistance = null;
                    activity.TrainingSession.ActualDuration = null;
                    activity.TrainingSession.UpdatedAt = DateTime.UtcNow;
                }
            }

            _dbContext.ImportedActivities.RemoveRange(activities);
        }
        else
        {
            activitiesRetained = await _dbContext.ImportedActivities
                .CountAsync(ia => ia.RunnerId == runnerId && ia.Platform == platform);
        }

        // Log the disconnection
        _dbContext.SyncLogs.Add(new SyncLog
        {
            Id = Guid.NewGuid(),
            ConnectedServiceId = service.Id,
            RunnerId = runnerId,
            Platform = platform,
            SyncType = "manual",
            StartedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
            Success = true,
            ErrorMessage = deleteData ? "Disconnected with data deletion" : "Disconnected, data retained"
        });

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Disconnected {Platform} for runner {RunnerId} (deleteData: {DeleteData})",
            platform, runnerId, deleteData);

        return new DisconnectResponse
        {
            Platform = platform.ToString(),
            Status = "Disconnected",
            DataDeleted = deleteData,
            ActivitiesRetained = activitiesRetained
        };
    }

    /// <inheritdoc />
    public async Task<SyncResponse> TriggerSyncAsync(Guid runnerId, FitnessPlatform platform)
    {
        var service = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs => cs.RunnerId == runnerId && cs.Platform == platform);

        if (service == null || service.Status == ConnectionStatus.Disconnected)
        {
            throw new InvalidOperationException($"{platform} is not connected. Connect it first.");
        }

        // Check sync cooldown (FR-012)
        if (service.LastSyncAt.HasValue)
        {
            var cooldownEnd = service.LastSyncAt.Value.AddMinutes(_options.SyncCooldownMinutes);
            if (DateTime.UtcNow < cooldownEnd)
            {
                var retryAfter = (int)(cooldownEnd - DateTime.UtcNow).TotalSeconds;
                throw new SyncCooldownException(
                    "Sync was recently triggered. Please wait before trying again.",
                    retryAfter);
            }
        }

        // Create sync log entry
        var syncLog = new SyncLog
        {
            Id = Guid.NewGuid(),
            ConnectedServiceId = service.Id,
            RunnerId = runnerId,
            Platform = platform,
            SyncType = "manual",
            StartedAt = DateTime.UtcNow,
            Success = false // Will be updated by the background job
        };

        _dbContext.SyncLogs.Add(syncLog);
        await _dbContext.SaveChangesAsync();

        // Queue the sync as a background job
        _backgroundJobClient.Enqueue<ISyncJobProcessor>(p =>
            p.ProcessSyncAsync(syncLog.Id));

        return new SyncResponse
        {
            SyncId = syncLog.Id,
            Message = "Sync initiated. Activities will appear shortly."
        };
    }

    /// <inheritdoc />
    public async Task<SyncLogListResponse> GetSyncLogsAsync(Guid runnerId, FitnessPlatform? platform, int limit)
    {
        limit = Math.Clamp(limit, 1, 50);

        var query = _dbContext.SyncLogs
            .Where(sl => sl.RunnerId == runnerId);

        if (platform.HasValue)
            query = query.Where(sl => sl.Platform == platform.Value);

        var logs = await query
            .OrderByDescending(sl => sl.StartedAt)
            .Take(limit)
            .Select(sl => new SyncLogDto
            {
                Id = sl.Id,
                Platform = sl.Platform.ToString(),
                SyncType = sl.SyncType,
                StartedAt = sl.StartedAt,
                CompletedAt = sl.CompletedAt,
                ActivitiesImported = sl.ActivitiesImported,
                ActivitiesDuplicate = sl.ActivitiesDuplicate,
                ActivitiesFiltered = sl.ActivitiesFiltered,
                Success = sl.Success,
                ErrorMessage = sl.ErrorMessage
            })
            .ToListAsync();

        return new SyncLogListResponse { Logs = logs };
    }

    /// <inheritdoc />
    public Guid? GetRunnerIdByOAuthState(string state)
    {
        if (_memoryCache.TryGetValue($"oauth_callback_{state}", out Guid runnerId))
            return runnerId;
        return null;
    }

    /// <inheritdoc />
    public string? GetOAuthSourceByState(string state)
    {
        if (_memoryCache.TryGetValue($"oauth_source_{state}", out string? source))
            return source;
        return null;
    }

    private IFitnessProvider GetProvider(FitnessPlatform platform)
    {
        return _providers.FirstOrDefault(p => p.Platform == platform)
            ?? throw new InvalidOperationException($"No provider registered for platform: {platform}");
    }
}

/// <summary>
/// Exception thrown when sync is attempted before cooldown period expires.
/// </summary>
public class SyncCooldownException : Exception
{
    public int RetryAfterSeconds { get; }

    public SyncCooldownException(string message, int retryAfterSeconds) : base(message)
    {
        RetryAfterSeconds = retryAfterSeconds;
    }
}

/// <summary>
/// Interface for background sync job processing (used with Hangfire).
/// </summary>
public interface ISyncJobProcessor
{
    Task ProcessSyncAsync(Guid syncLogId);
}
