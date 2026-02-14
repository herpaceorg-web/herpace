using HerPace.Core.Enums;
using HerPace.Infrastructure.Data;
using HerPace.Infrastructure.Services.Providers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.Services;

/// <summary>
/// Background job that proactively refreshes fitness tracker tokens
/// before they expire. Runs periodically via Hangfire recurring job.
/// </summary>
public class TokenRefreshJob
{
    private readonly HerPaceDbContext _dbContext;
    private readonly IEnumerable<IFitnessProvider> _providers;
    private readonly ILogger<TokenRefreshJob> _logger;

    public TokenRefreshJob(
        HerPaceDbContext dbContext,
        IEnumerable<IFitnessProvider> providers,
        ILogger<TokenRefreshJob> logger)
    {
        _dbContext = dbContext;
        _providers = providers;
        _logger = logger;
    }

    /// <summary>
    /// Finds connected services with tokens expiring within 1 hour and refreshes them.
    /// </summary>
    public async Task RefreshExpiringTokensAsync()
    {
        var expirationThreshold = DateTime.UtcNow.AddHours(1);

        var expiringServices = await _dbContext.ConnectedServices
            .Where(cs => cs.Status == ConnectionStatus.Connected
                && cs.TokenExpiresAt.HasValue
                && cs.TokenExpiresAt.Value <= expirationThreshold
                && cs.RefreshToken != null)
            .ToListAsync();

        if (expiringServices.Count == 0)
        {
            _logger.LogDebug("No tokens expiring within the next hour");
            return;
        }

        _logger.LogInformation("Found {Count} tokens expiring soon, refreshing...", expiringServices.Count);

        foreach (var service in expiringServices)
        {
            try
            {
                var provider = _providers.FirstOrDefault(p => p.Platform == service.Platform);
                if (provider == null)
                {
                    _logger.LogWarning("No provider found for platform {Platform}", service.Platform);
                    continue;
                }

                var result = await provider.RefreshAccessTokenAsync(service.RefreshToken!);

                service.AccessToken = result.AccessToken;
                service.RefreshToken = result.RefreshToken;
                service.TokenExpiresAt = result.ExpiresAt;
                service.UpdatedAt = DateTime.UtcNow;

                _logger.LogInformation("Refreshed token for {Platform} service {ServiceId} (runner {RunnerId})",
                    service.Platform, service.Id, service.RunnerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh token for {Platform} service {ServiceId}",
                    service.Platform, service.Id);

                service.Status = ConnectionStatus.TokenExpired;
                service.LastSyncError = $"Token refresh failed: {ex.Message}";
                service.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync();
    }
}
