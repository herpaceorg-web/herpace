using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HerPace.Core.Configuration;
using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HerPace.Infrastructure.Services.Providers;

/// <summary>
/// Garmin Connect API provider. Handles OAuth 2.0 with PKCE flow,
/// activity data normalization, and deauthorization.
/// Garmin uses a push model — activities are pushed to our webhook endpoint.
/// </summary>
public class GarminProvider : IFitnessProvider
{
    private const string AuthBaseUrl = "https://connect.garmin.com/oauthConfirm";
    private const string TokenUrl = "https://connectapi.garmin.com/oauth-service/oauth/token";
    private const string ApiBaseUrl = "https://apis.garmin.com";
    private const string RequiredScopes = "activity:read";

    private readonly HttpClient _httpClient;
    private readonly GarminOptions _options;
    private readonly ILogger<GarminProvider> _logger;

    public FitnessPlatform Platform => FitnessPlatform.Garmin;

    public GarminProvider(
        HttpClient httpClient,
        IOptions<FitnessTrackerOptions> options,
        ILogger<GarminProvider> logger)
    {
        _httpClient = httpClient;
        _options = options.Value.Garmin;
        _logger = logger;
    }

    /// <inheritdoc />
    public string GetAuthorizationUrl(string state)
    {
        // Garmin uses OAuth 2.0 with PKCE
        // The code_verifier is stored with the state for later use during token exchange
        return $"{AuthBaseUrl}" +
            $"?client_id={Uri.EscapeDataString(_options.ClientId)}" +
            $"&redirect_uri={Uri.EscapeDataString(_options.RedirectUri)}" +
            $"&response_type=code" +
            $"&scope={Uri.EscapeDataString(RequiredScopes)}" +
            $"&state={Uri.EscapeDataString(state)}";
    }

    /// <inheritdoc />
    public async Task<TokenExchangeResult> ExchangeCodeForTokensAsync(string code)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
            ["code"] = code,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = _options.RedirectUri
        });

        var response = await _httpClient.PostAsync(TokenUrl, content);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Garmin token exchange failed: {StatusCode} {Body}", response.StatusCode, json);
            throw new InvalidOperationException($"Garmin token exchange failed: {response.StatusCode}");
        }

        var tokenResponse = JsonSerializer.Deserialize<GarminTokenResponse>(json);
        if (tokenResponse == null)
            throw new InvalidOperationException("Failed to parse Garmin token response");

        return new TokenExchangeResult
        {
            AccessToken = tokenResponse.AccessToken,
            RefreshToken = tokenResponse.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn),
            ExternalUserId = tokenResponse.UserId ?? string.Empty,
            Scopes = RequiredScopes
        };
    }

    /// <inheritdoc />
    public async Task<TokenExchangeResult> RefreshAccessTokenAsync(string refreshToken)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
            ["refresh_token"] = refreshToken,
            ["grant_type"] = "refresh_token"
        });

        var response = await _httpClient.PostAsync(TokenUrl, content);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Garmin token refresh failed: {StatusCode} {Body}", response.StatusCode, json);
            throw new InvalidOperationException($"Garmin token refresh failed: {response.StatusCode}");
        }

        var tokenResponse = JsonSerializer.Deserialize<GarminTokenResponse>(json);
        if (tokenResponse == null)
            throw new InvalidOperationException("Failed to parse Garmin refresh response");

        return new TokenExchangeResult
        {
            AccessToken = tokenResponse.AccessToken,
            RefreshToken = tokenResponse.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn),
            ExternalUserId = tokenResponse.UserId ?? string.Empty
        };
    }

    /// <inheritdoc />
    public async Task<List<NormalizedActivity>> FetchActivitiesAsync(string accessToken, DateTime since)
    {
        // Garmin primarily uses push model (webhooks), but we can also pull
        // activity summaries for initial historical import
        var activities = new List<NormalizedActivity>();
        var sinceEpoch = new DateTimeOffset(since).ToUnixTimeSeconds();

        var request = new HttpRequestMessage(HttpMethod.Get,
            $"{ApiBaseUrl}/wellness-api/rest/activities?uploadStartTimeInSeconds={sinceEpoch}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Garmin fetch activities failed: {StatusCode}", response.StatusCode);
            return activities;
        }

        var json = await response.Content.ReadAsStringAsync();
        var garminActivities = JsonSerializer.Deserialize<List<GarminActivity>>(json) ?? new();

        foreach (var ga in garminActivities)
        {
            var normalized = NormalizeActivity(ga);
            if (normalized != null)
                activities.Add(normalized);
        }

        _logger.LogInformation("Fetched {Count} activities from Garmin since {Since}", activities.Count, since);
        return activities;
    }

    /// <inheritdoc />
    public Task<NormalizedActivity?> FetchActivityDetailAsync(string accessToken, string externalActivityId)
    {
        // Garmin pushes full activity data via webhooks, so detail fetch is typically
        // not needed. For now, return null — the webhook handler processes detail inline.
        _logger.LogDebug("FetchActivityDetail not implemented for Garmin (push model). ActivityId: {Id}", externalActivityId);
        return Task.FromResult<NormalizedActivity?>(null);
    }

    /// <inheritdoc />
    public async Task RevokeAccessAsync(string accessToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete,
            $"{ApiBaseUrl}/oauth-service/oauth/token");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Garmin deauthorize returned {StatusCode}", response.StatusCode);
        }
    }

    /// <summary>
    /// Normalizes a Garmin activity push payload into the shared activity format.
    /// Called by the webhook controller when Garmin pushes activity data.
    /// </summary>
    public static NormalizedActivity? NormalizeActivityFromPush(GarminActivityPush push)
    {
        var activityType = MapActivityType(push.ActivityType);
        if (activityType == null)
            return null;

        double? paceSecondsPerKm = null;
        if (push.DistanceInMeters > 0 && push.DurationInSeconds > 0)
        {
            paceSecondsPerKm = push.DurationInSeconds / (push.DistanceInMeters / 1000.0);
        }

        return new NormalizedActivity
        {
            ExternalActivityId = push.ActivityId.ToString(),
            ActivityDate = DateTimeOffset.FromUnixTimeSeconds(push.StartTimeInSeconds)
                .UtcDateTime,
            ActivityType = activityType,
            ActivityTitle = push.ActivityName,
            DistanceMeters = push.DistanceInMeters,
            DurationSeconds = push.DurationInSeconds,
            MovingTimeSeconds = push.MovingDurationInSeconds,
            AveragePaceSecondsPerKm = paceSecondsPerKm,
            AverageHeartRate = push.AverageHeartRateInBeatsPerMinute,
            MaxHeartRate = push.MaxHeartRateInBeatsPerMinute,
            Cadence = push.AverageRunCadenceInStepsPerMinute,
            ElevationGainMeters = push.TotalElevationGainInMeters,
            CaloriesBurned = push.ActiveKilocalories
        };
    }

    private NormalizedActivity? NormalizeActivity(GarminActivity ga)
    {
        var activityType = MapActivityType(ga.ActivityType);
        if (activityType == null)
            return null;

        double? paceSecondsPerKm = null;
        if (ga.DistanceInMeters > 0 && ga.DurationInSeconds > 0)
        {
            paceSecondsPerKm = ga.DurationInSeconds / (ga.DistanceInMeters / 1000.0);
        }

        return new NormalizedActivity
        {
            ExternalActivityId = ga.ActivityId.ToString(),
            ActivityDate = DateTimeOffset.FromUnixTimeSeconds(ga.StartTimeInSeconds)
                .UtcDateTime,
            ActivityType = activityType,
            ActivityTitle = ga.ActivityName,
            DistanceMeters = ga.DistanceInMeters,
            DurationSeconds = ga.DurationInSeconds,
            AveragePaceSecondsPerKm = paceSecondsPerKm,
            AverageHeartRate = ga.AverageHeartRateInBeatsPerMinute,
            MaxHeartRate = ga.MaxHeartRateInBeatsPerMinute,
            Cadence = ga.AverageRunCadenceInStepsPerMinute,
            ElevationGainMeters = ga.TotalElevationGainInMeters,
            CaloriesBurned = ga.ActiveKilocalories
        };
    }

    private static string? MapActivityType(string? garminType)
    {
        return garminType?.ToUpperInvariant() switch
        {
            "RUNNING" => "Run",
            "TREADMILL_RUNNING" => "TreadmillRun",
            "INDOOR_RUNNING" => "TreadmillRun",
            "TRAIL_RUNNING" => "Run",
            _ => null // Filter out non-running activities
        };
    }
}

// Garmin API response models

internal class GarminTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("userId")]
    public string? UserId { get; set; }
}

internal class GarminActivity
{
    [JsonPropertyName("activityId")]
    public long ActivityId { get; set; }

    [JsonPropertyName("activityName")]
    public string? ActivityName { get; set; }

    [JsonPropertyName("activityType")]
    public string? ActivityType { get; set; }

    [JsonPropertyName("startTimeInSeconds")]
    public long StartTimeInSeconds { get; set; }

    [JsonPropertyName("startTimeOffsetInSeconds")]
    public int StartTimeOffsetInSeconds { get; set; }

    [JsonPropertyName("durationInSeconds")]
    public int DurationInSeconds { get; set; }

    [JsonPropertyName("distanceInMeters")]
    public double DistanceInMeters { get; set; }

    [JsonPropertyName("averageHeartRateInBeatsPerMinute")]
    public int? AverageHeartRateInBeatsPerMinute { get; set; }

    [JsonPropertyName("maxHeartRateInBeatsPerMinute")]
    public int? MaxHeartRateInBeatsPerMinute { get; set; }

    [JsonPropertyName("averageRunCadenceInStepsPerMinute")]
    public int? AverageRunCadenceInStepsPerMinute { get; set; }

    [JsonPropertyName("totalElevationGainInMeters")]
    public double? TotalElevationGainInMeters { get; set; }

    [JsonPropertyName("activeKilocalories")]
    public int? ActiveKilocalories { get; set; }
}

/// <summary>
/// Activity detail pushed via Garmin webhook.
/// Public because it's used by the webhook controller.
/// </summary>
public class GarminActivityPush
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("activityId")]
    public long ActivityId { get; set; }

    [JsonPropertyName("activityName")]
    public string? ActivityName { get; set; }

    [JsonPropertyName("activityType")]
    public string? ActivityType { get; set; }

    [JsonPropertyName("startTimeInSeconds")]
    public long StartTimeInSeconds { get; set; }

    [JsonPropertyName("startTimeOffsetInSeconds")]
    public int StartTimeOffsetInSeconds { get; set; }

    [JsonPropertyName("durationInSeconds")]
    public int DurationInSeconds { get; set; }

    [JsonPropertyName("movingDurationInSeconds")]
    public int? MovingDurationInSeconds { get; set; }

    [JsonPropertyName("distanceInMeters")]
    public double DistanceInMeters { get; set; }

    [JsonPropertyName("averageHeartRateInBeatsPerMinute")]
    public int? AverageHeartRateInBeatsPerMinute { get; set; }

    [JsonPropertyName("maxHeartRateInBeatsPerMinute")]
    public int? MaxHeartRateInBeatsPerMinute { get; set; }

    [JsonPropertyName("averageRunCadenceInStepsPerMinute")]
    public int? AverageRunCadenceInStepsPerMinute { get; set; }

    [JsonPropertyName("totalElevationGainInMeters")]
    public double? TotalElevationGainInMeters { get; set; }

    [JsonPropertyName("activeKilocalories")]
    public int? ActiveKilocalories { get; set; }
}

/// <summary>
/// Women's health data pushed via Garmin webhook.
/// </summary>
public class GarminWomensHealthPush
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("calendarDate")]
    public string? CalendarDate { get; set; }

    [JsonPropertyName("periodStartDate")]
    public string? PeriodStartDate { get; set; }

    [JsonPropertyName("predictedCycleLength")]
    public int? PredictedCycleLength { get; set; }

    [JsonPropertyName("currentPhase")]
    public string? CurrentPhase { get; set; }

    [JsonPropertyName("dayOfCycle")]
    public int? DayOfCycle { get; set; }
}
