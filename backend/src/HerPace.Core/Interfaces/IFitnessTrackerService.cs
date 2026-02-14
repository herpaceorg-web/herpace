using HerPace.Core.DTOs;
using HerPace.Core.Enums;

namespace HerPace.Core.Interfaces;

/// <summary>
/// Service for managing connected fitness services (connection lifecycle, sync triggering).
/// </summary>
public interface IFitnessTrackerService
{
    /// <summary>
    /// Gets all available fitness services and their connection status for a runner.
    /// </summary>
    Task<ServicesListResponse> GetServicesAsync(Guid runnerId);

    /// <summary>
    /// Initiates an OAuth connection flow for the specified platform.
    /// </summary>
    /// <param name="source">Optional client source (e.g. "android") for redirect routing.</param>
    /// <returns>The OAuth authorization URL and state token.</returns>
    Task<OAuthInitiateResponse> InitiateConnectionAsync(Guid runnerId, FitnessPlatform platform, string? source = null);

    /// <summary>
    /// Completes an OAuth connection by exchanging the authorization code for tokens.
    /// </summary>
    /// <param name="runnerId">The runner connecting the service.</param>
    /// <param name="platform">The platform being connected.</param>
    /// <param name="code">The OAuth authorization code.</param>
    /// <param name="state">The CSRF state token for validation.</param>
    Task CompleteConnectionAsync(Guid runnerId, FitnessPlatform platform, string code, string state);

    /// <summary>
    /// Registers a Health Connect connection (no OAuth — permissions are on-device).
    /// </summary>
    Task<ConnectedServiceDto> ConnectHealthConnectAsync(Guid runnerId, ConnectHealthConnectRequest request);

    /// <summary>
    /// Disconnects a fitness service, optionally deleting all imported data.
    /// </summary>
    Task<DisconnectResponse> DisconnectAsync(Guid runnerId, FitnessPlatform platform, bool deleteData);

    /// <summary>
    /// Triggers a manual sync for a connected service.
    /// </summary>
    Task<SyncResponse> TriggerSyncAsync(Guid runnerId, FitnessPlatform platform);

    /// <summary>
    /// Gets recent sync log entries for a runner.
    /// </summary>
    Task<SyncLogListResponse> GetSyncLogsAsync(Guid runnerId, FitnessPlatform? platform, int limit);

    /// <summary>
    /// Looks up which runner initiated an OAuth flow from the state token.
    /// Used by the callback endpoint which doesn't have JWT auth context.
    /// </summary>
    Guid? GetRunnerIdByOAuthState(string state);

    /// <summary>
    /// Gets the client source (e.g. "android") associated with an OAuth state token.
    /// Used to determine callback redirect destination (deep link vs web).
    /// </summary>
    string? GetOAuthSourceByState(string state);
}
