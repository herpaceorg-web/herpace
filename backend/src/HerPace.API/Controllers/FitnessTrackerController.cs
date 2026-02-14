using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using HerPace.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HerPace.API.Controllers;

/// <summary>
/// Manages fitness tracker connections, OAuth flows, sync triggers, and activity retrieval.
/// </summary>
[ApiController]
[Route("api/fitness-tracker")]
[Authorize]
public class FitnessTrackerController : ControllerBase
{
    private readonly IFitnessTrackerService _fitnessTrackerService;
    private readonly IActivityImportService _importService;
    private readonly HerPaceDbContext _dbContext;
    private readonly ILogger<FitnessTrackerController> _logger;

    public FitnessTrackerController(
        IFitnessTrackerService fitnessTrackerService,
        IActivityImportService importService,
        HerPaceDbContext dbContext,
        ILogger<FitnessTrackerController> logger)
    {
        _fitnessTrackerService = fitnessTrackerService;
        _importService = importService;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Lists all available fitness services and their connection status.
    /// </summary>
    [HttpGet("services")]
    public async Task<IActionResult> GetServices()
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        var result = await _fitnessTrackerService.GetServicesAsync(runnerId.Value);
        return Ok(result);
    }

    /// <summary>
    /// Initiates Strava OAuth flow. Returns the authorization URL.
    /// </summary>
    [HttpGet("connect/strava")]
    public async Task<IActionResult> ConnectStrava([FromQuery] string? source = null)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        try
        {
            var result = await _fitnessTrackerService.InitiateConnectionAsync(runnerId.Value, FitnessPlatform.Strava, source);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Strava OAuth callback. Exchanges code for tokens and redirects to frontend.
    /// </summary>
    [HttpGet("callback/strava")]
    [AllowAnonymous]
    public async Task<IActionResult> StravaCallback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error)
    {
        // Handle user-denied access
        if (!string.IsNullOrEmpty(error))
        {
            _logger.LogInformation("Strava OAuth denied by user: {Error}", error);
            return Redirect(GetCallbackRedirectUrl(state, "/connected-services?error=denied&platform=strava"));
        }

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
        {
            return Redirect(GetCallbackRedirectUrl(state, "/connected-services?error=auth_failed&platform=strava"));
        }

        try
        {
            // Look up runner from the state token via cache reverse mapping
            var runnerId = FindRunnerByOAuthState(state);
            if (runnerId == null)
            {
                _logger.LogWarning("No runner found for OAuth state token");
                return Redirect(GetCallbackRedirectUrl(state, "/connected-services?error=auth_failed&platform=strava"));
            }

            await _fitnessTrackerService.CompleteConnectionAsync(
                runnerId.Value, FitnessPlatform.Strava, code, state);

            _logger.LogInformation("Strava OAuth callback completed for runner {RunnerId}", runnerId);
            return Redirect(GetCallbackRedirectUrl(state, "/connected-services?connected=strava"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Strava OAuth callback failed");
            return Redirect(GetCallbackRedirectUrl(state, "/connected-services?error=auth_failed&platform=strava"));
        }
    }

    /// <summary>
    /// Registers Health Connect as a connected service (called from Android after permissions granted).
    /// </summary>
    [HttpPost("connect/health-connect")]
    public async Task<IActionResult> ConnectHealthConnect([FromBody] ConnectHealthConnectRequest request)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        var result = await _fitnessTrackerService.ConnectHealthConnectAsync(runnerId.Value, request);
        return Ok(result);
    }

    /// <summary>
    /// Initiates Garmin OAuth flow. Returns the authorization URL.
    /// </summary>
    [HttpGet("connect/garmin")]
    public async Task<IActionResult> ConnectGarmin([FromQuery] string? source = null)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        try
        {
            var result = await _fitnessTrackerService.InitiateConnectionAsync(runnerId.Value, FitnessPlatform.Garmin, source);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Garmin OAuth callback. Exchanges code for tokens and redirects to frontend.
    /// </summary>
    [HttpGet("callback/garmin")]
    [AllowAnonymous]
    public async Task<IActionResult> GarminCallback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
        {
            _logger.LogInformation("Garmin OAuth denied by user: {Error}", error);
            return Redirect(GetCallbackRedirectUrl(state, "/connected-services?error=denied&platform=garmin"));
        }

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
        {
            return Redirect(GetCallbackRedirectUrl(state, "/connected-services?error=auth_failed&platform=garmin"));
        }

        try
        {
            var runnerId = FindRunnerByOAuthState(state);
            if (runnerId == null)
            {
                _logger.LogWarning("No runner found for Garmin OAuth state token");
                return Redirect(GetCallbackRedirectUrl(state, "/connected-services?error=auth_failed&platform=garmin"));
            }

            await _fitnessTrackerService.CompleteConnectionAsync(
                runnerId.Value, FitnessPlatform.Garmin, code, state);

            _logger.LogInformation("Garmin OAuth callback completed for runner {RunnerId}", runnerId);
            return Redirect(GetCallbackRedirectUrl(state, "/connected-services?connected=garmin"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Garmin OAuth callback failed");
            return Redirect(GetCallbackRedirectUrl(state, "/connected-services?error=auth_failed&platform=garmin"));
        }
    }

    /// <summary>
    /// Updates the women's health data opt-in setting for a connected service.
    /// </summary>
    [HttpPatch("services/{platform}/womens-health")]
    public async Task<IActionResult> UpdateWomensHealthOptIn(
        string platform,
        [FromBody] UpdateWomensHealthOptInRequest request)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        if (!Enum.TryParse<FitnessPlatform>(platform, true, out var fitnessPlatform))
            return BadRequest(new { error = $"Invalid platform: {platform}" });

        var service = await _dbContext.ConnectedServices
            .FirstOrDefaultAsync(cs => cs.RunnerId == runnerId.Value && cs.Platform == fitnessPlatform);

        if (service == null)
            return NotFound(new { error = $"{platform} is not connected." });

        service.WomensHealthDataOptIn = request.OptIn;
        service.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(new { platform = platform, womensHealthDataOptIn = request.OptIn });
    }

    /// <summary>
    /// Disconnects a fitness service with optional data deletion.
    /// </summary>
    [HttpDelete("services/{platform}")]
    public async Task<IActionResult> Disconnect(string platform, [FromQuery] bool deleteData = false)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        if (!Enum.TryParse<FitnessPlatform>(platform, true, out var fitnessPlatform))
            return BadRequest(new { error = $"Invalid platform: {platform}" });

        try
        {
            var result = await _fitnessTrackerService.DisconnectAsync(runnerId.Value, fitnessPlatform, deleteData);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Manually triggers a sync for a connected service.
    /// </summary>
    [HttpPost("sync/{platform}")]
    public async Task<IActionResult> TriggerSync(string platform)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        if (!Enum.TryParse<FitnessPlatform>(platform, true, out var fitnessPlatform))
            return BadRequest(new { error = $"Invalid platform: {platform}" });

        try
        {
            var result = await _fitnessTrackerService.TriggerSyncAsync(runnerId.Value, fitnessPlatform);
            return Accepted(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (SyncCooldownException ex)
        {
            Response.Headers["Retry-After"] = ex.RetryAfterSeconds.ToString();
            return StatusCode(429, new { error = ex.Message, retryAfterSeconds = ex.RetryAfterSeconds });
        }
    }

    /// <summary>
    /// Gets paginated imported activities.
    /// </summary>
    [HttpGet("activities")]
    public async Task<IActionResult> GetActivities(
        [FromQuery] string? platform,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        FitnessPlatform? platformFilter = null;
        if (!string.IsNullOrEmpty(platform) && Enum.TryParse<FitnessPlatform>(platform, true, out var parsed))
            platformFilter = parsed;

        var result = await _importService.GetActivitiesAsync(
            runnerId.Value, platformFilter, from, to, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Gets full details of an imported activity.
    /// </summary>
    [HttpGet("activities/{id:guid}")]
    public async Task<IActionResult> GetActivityDetail(Guid id)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        var result = await _importService.GetActivityDetailAsync(id, runnerId.Value);
        if (result == null)
            return NotFound(new { message = "Activity not found." });

        return Ok(result);
    }

    /// <summary>
    /// Uploads activities from Health Connect (Android batch upload).
    /// </summary>
    [HttpPost("activities/upload")]
    public async Task<IActionResult> UploadActivities([FromBody] ActivityUploadRequest request)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        if (request.Activities == null || request.Activities.Count == 0)
            return BadRequest(new { error = "No activities provided." });

        if (request.Activities.Count > 50)
            return BadRequest(new { error = "Maximum 50 activities per upload." });

        var normalized = request.Activities.Select(a => new NormalizedActivity
        {
            ExternalActivityId = a.ExternalActivityId,
            ActivityDate = a.ActivityDate,
            ActivityType = a.ActivityType,
            DistanceMeters = a.DistanceMeters,
            DurationSeconds = a.DurationSeconds,
            AverageHeartRate = a.AverageHeartRate,
            MaxHeartRate = a.MaxHeartRate,
            Cadence = a.Cadence,
            ElevationGainMeters = a.ElevationGainMeters,
            CaloriesBurned = a.CaloriesBurned,
            GpsRoute = a.GpsRoute
        }).ToList();

        var result = await _importService.ImportActivitiesAsync(
            runnerId.Value, FitnessPlatform.HealthConnect, normalized);
        return Ok(result);
    }

    /// <summary>
    /// Gets recent sync logs.
    /// </summary>
    [HttpGet("sync-log")]
    public async Task<IActionResult> GetSyncLogs(
        [FromQuery] string? platform,
        [FromQuery] int limit = 10)
    {
        var runnerId = await GetRunnerIdAsync();
        if (runnerId == null)
            return BadRequest(new { message = "Profile not found. Please create a profile first." });

        FitnessPlatform? platformFilter = null;
        if (!string.IsNullOrEmpty(platform) && Enum.TryParse<FitnessPlatform>(platform, true, out var parsed))
            platformFilter = parsed;

        var result = await _fitnessTrackerService.GetSyncLogsAsync(runnerId.Value, platformFilter, limit);
        return Ok(result);
    }

    private Guid GetAuthenticatedUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("User ID not found in token");
        return userId;
    }

    private async Task<Guid?> GetRunnerIdAsync()
    {
        var userId = GetAuthenticatedUserId();
        var runner = await _dbContext.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);
        return runner?.Id;
    }

    private Guid? FindRunnerByOAuthState(string state)
    {
        return _fitnessTrackerService.GetRunnerIdByOAuthState(state);
    }

    private string GetCallbackRedirectUrl(string? state, string path)
    {
        if (state != null)
        {
            var source = _fitnessTrackerService.GetOAuthSourceByState(state);
            if (source == "android")
                return $"herpace://oauth/callback{path}";
        }
        return $"{GetFrontendBaseUrl()}{path}";
    }

    private string GetFrontendBaseUrl()
    {
        // In development, frontend runs on different port
        var origin = Request.Headers["Origin"].FirstOrDefault();
        if (!string.IsNullOrEmpty(origin))
            return origin;

        // Fallback to configured CORS origins or default
        return Request.IsHttps ? "https://localhost:5001" : "http://localhost:5163";
    }
}
