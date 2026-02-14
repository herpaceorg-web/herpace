using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using HerPace.Core.Configuration;
using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HerPace.Infrastructure.Services.Providers;

/// <summary>
/// Strava API v3 provider. Handles OAuth 2.0 Authorization Code flow,
/// activity fetching, stream data, and deauthorization.
/// </summary>
public class StravaProvider : IFitnessProvider
{
    private const string AuthBaseUrl = "https://www.strava.com/oauth";
    private const string ApiBaseUrl = "https://www.strava.com/api/v3";
    private const string RequiredScopes = "activity:read_all,profile:read_all";

    private readonly HttpClient _httpClient;
    private readonly StravaOptions _options;
    private readonly ILogger<StravaProvider> _logger;

    public FitnessPlatform Platform => FitnessPlatform.Strava;

    public StravaProvider(
        HttpClient httpClient,
        IOptions<FitnessTrackerOptions> options,
        ILogger<StravaProvider> logger)
    {
        _httpClient = httpClient;
        _options = options.Value.Strava;
        _logger = logger;
    }

    /// <inheritdoc />
    public string GetAuthorizationUrl(string state)
    {
        return $"{AuthBaseUrl}/authorize" +
            $"?client_id={Uri.EscapeDataString(_options.ClientId)}" +
            $"&redirect_uri={Uri.EscapeDataString(_options.RedirectUri)}" +
            $"&response_type=code" +
            $"&scope={RequiredScopes}" +
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
            ["grant_type"] = "authorization_code"
        });

        var response = await _httpClient.PostAsync($"{AuthBaseUrl}/token", content);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Strava token exchange failed: {StatusCode} {Body}", response.StatusCode, json);
            throw new InvalidOperationException($"Strava token exchange failed: {response.StatusCode}");
        }

        var tokenResponse = JsonSerializer.Deserialize<StravaTokenResponse>(json);
        if (tokenResponse == null)
            throw new InvalidOperationException("Failed to parse Strava token response");

        return new TokenExchangeResult
        {
            AccessToken = tokenResponse.AccessToken,
            RefreshToken = tokenResponse.RefreshToken,
            ExpiresAt = DateTimeOffset.FromUnixTimeSeconds(tokenResponse.ExpiresAt).UtcDateTime,
            ExternalUserId = tokenResponse.Athlete?.Id.ToString() ?? string.Empty,
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

        var response = await _httpClient.PostAsync($"{AuthBaseUrl}/token", content);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Strava token refresh failed: {StatusCode} {Body}", response.StatusCode, json);
            throw new InvalidOperationException($"Strava token refresh failed: {response.StatusCode}");
        }

        var tokenResponse = JsonSerializer.Deserialize<StravaTokenResponse>(json);
        if (tokenResponse == null)
            throw new InvalidOperationException("Failed to parse Strava refresh response");

        return new TokenExchangeResult
        {
            AccessToken = tokenResponse.AccessToken,
            RefreshToken = tokenResponse.RefreshToken,
            ExpiresAt = DateTimeOffset.FromUnixTimeSeconds(tokenResponse.ExpiresAt).UtcDateTime,
            ExternalUserId = tokenResponse.Athlete?.Id.ToString() ?? string.Empty
        };
    }

    /// <inheritdoc />
    public async Task<List<NormalizedActivity>> FetchActivitiesAsync(string accessToken, DateTime since)
    {
        var activities = new List<NormalizedActivity>();
        var afterEpoch = new DateTimeOffset(since).ToUnixTimeSeconds();
        var page = 1;
        const int perPage = 50;

        while (true)
        {
            var request = new HttpRequestMessage(HttpMethod.Get,
                $"{ApiBaseUrl}/athlete/activities?after={afterEpoch}&page={page}&per_page={perPage}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request);
            CheckRateLimits(response);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Strava fetch activities failed: {StatusCode}", response.StatusCode);
                break;
            }

            var json = await response.Content.ReadAsStringAsync();
            var stravaActivities = JsonSerializer.Deserialize<List<StravaActivity>>(json) ?? new();

            if (stravaActivities.Count == 0)
                break;

            foreach (var sa in stravaActivities)
            {
                var normalized = NormalizeActivity(sa);
                if (normalized != null)
                    activities.Add(normalized);
            }

            if (stravaActivities.Count < perPage)
                break;

            page++;
        }

        _logger.LogInformation("Fetched {Count} activities from Strava since {Since}", activities.Count, since);
        return activities;
    }

    /// <inheritdoc />
    public async Task<NormalizedActivity?> FetchActivityDetailAsync(string accessToken, string externalActivityId)
    {
        // Fetch activity summary
        var request = new HttpRequestMessage(HttpMethod.Get,
            $"{ApiBaseUrl}/activities/{externalActivityId}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request);
        CheckRateLimits(response);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Strava fetch activity {Id} failed: {StatusCode}", externalActivityId, response.StatusCode);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync();
        var activity = JsonSerializer.Deserialize<StravaActivity>(json);
        if (activity == null) return null;

        var normalized = NormalizeActivity(activity);
        if (normalized == null) return null;

        normalized.RawResponseJson = json;

        // Fetch streams (HR, GPS, cadence) for detail
        var streams = await FetchStreamsAsync(accessToken, externalActivityId);
        if (streams != null)
        {
            normalized.GpsRoute = streams.GpsRoute;
            if (streams.AverageHeartRate.HasValue && !normalized.AverageHeartRate.HasValue)
                normalized.AverageHeartRate = streams.AverageHeartRate;
            if (streams.MaxHeartRate.HasValue && !normalized.MaxHeartRate.HasValue)
                normalized.MaxHeartRate = streams.MaxHeartRate;
            if (streams.AverageCadence.HasValue && !normalized.Cadence.HasValue)
                normalized.Cadence = streams.AverageCadence;
        }

        return normalized;
    }

    /// <inheritdoc />
    public async Task RevokeAccessAsync(string accessToken)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["access_token"] = accessToken
        });

        var response = await _httpClient.PostAsync($"{AuthBaseUrl}/deauthorize", content);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Strava deauthorize returned {StatusCode}", response.StatusCode);
        }
    }

    private NormalizedActivity? NormalizeActivity(StravaActivity sa)
    {
        // Map Strava sport_type to our activity type
        var activityType = MapActivityType(sa.SportType ?? sa.Type);
        if (activityType == null)
            return null;

        double? paceSecondsPerKm = null;
        if (sa.Distance > 0 && sa.MovingTime > 0)
        {
            paceSecondsPerKm = sa.MovingTime / (sa.Distance / 1000.0);
        }

        return new NormalizedActivity
        {
            ExternalActivityId = sa.Id.ToString(),
            ActivityDate = sa.StartDate,
            ActivityType = activityType,
            ActivityTitle = sa.Name,
            DistanceMeters = sa.Distance,
            DurationSeconds = sa.ElapsedTime,
            MovingTimeSeconds = sa.MovingTime,
            AveragePaceSecondsPerKm = paceSecondsPerKm,
            AverageHeartRate = sa.AverageHeartrate.HasValue ? (int)sa.AverageHeartrate.Value : null,
            MaxHeartRate = sa.MaxHeartrate.HasValue ? (int)sa.MaxHeartrate.Value : null,
            Cadence = sa.AverageCadence.HasValue ? (int)(sa.AverageCadence.Value * 2) : null, // Strava reports steps per foot, multiply by 2
            ElevationGainMeters = sa.TotalElevationGain,
            CaloriesBurned = sa.Calories.HasValue ? (int)sa.Calories.Value : null
        };
    }

    private static string? MapActivityType(string? stravaType)
    {
        return stravaType?.ToLowerInvariant() switch
        {
            "run" => "Run",
            "virtualrun" => "TreadmillRun",
            "treadmillrun" or "treadmill_run" => "TreadmillRun",
            _ => null // Filter out non-running activities
        };
    }

    private async Task<StreamData?> FetchStreamsAsync(string accessToken, string activityId)
    {
        var request = new HttpRequestMessage(HttpMethod.Get,
            $"{ApiBaseUrl}/activities/{activityId}/streams?keys=heartrate,latlng,cadence,altitude&key_by_type=true");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
            return null;

        var json = await response.Content.ReadAsStringAsync();
        var streams = JsonSerializer.Deserialize<Dictionary<string, StravaStream>>(json);
        if (streams == null) return null;

        var result = new StreamData();

        // Parse GPS coordinates
        if (streams.TryGetValue("latlng", out var latlngStream) && latlngStream.Data != null)
        {
            var altitudes = streams.TryGetValue("altitude", out var altStream) ? altStream.Data : null;
            result.GpsRoute = new List<GpsPoint>();

            for (int i = 0; i < latlngStream.Data.Count; i++)
            {
                if (latlngStream.Data[i] is JsonElement elem && elem.ValueKind == JsonValueKind.Array)
                {
                    var coords = elem.EnumerateArray().ToList();
                    if (coords.Count >= 2)
                    {
                        var point = new GpsPoint
                        {
                            Lat = coords[0].GetDouble(),
                            Lng = coords[1].GetDouble()
                        };

                        if (altitudes != null && i < altitudes.Count &&
                            altitudes[i] is JsonElement altElem &&
                            altElem.TryGetDouble(out var alt))
                        {
                            point.Altitude = alt;
                        }

                        result.GpsRoute.Add(point);
                    }
                }
            }
        }

        // Parse heart rate
        if (streams.TryGetValue("heartrate", out var hrStream) && hrStream.Data != null)
        {
            var hrValues = hrStream.Data
                .Where(d => d is JsonElement e && e.ValueKind == JsonValueKind.Number)
                .Select(d => ((JsonElement)d).GetInt32())
                .ToList();

            if (hrValues.Count > 0)
            {
                result.AverageHeartRate = (int)hrValues.Average();
                result.MaxHeartRate = hrValues.Max();
            }
        }

        // Parse cadence
        if (streams.TryGetValue("cadence", out var cadenceStream) && cadenceStream.Data != null)
        {
            var cadenceValues = cadenceStream.Data
                .Where(d => d is JsonElement e && e.ValueKind == JsonValueKind.Number)
                .Select(d => ((JsonElement)d).GetDouble())
                .ToList();

            if (cadenceValues.Count > 0)
            {
                result.AverageCadence = (int)(cadenceValues.Average() * 2); // Steps per foot → SPM
            }
        }

        return result;
    }

    private void CheckRateLimits(HttpResponseMessage response)
    {
        if (response.Headers.TryGetValues("X-RateLimit-Usage", out var usageValues))
        {
            var usage = usageValues.FirstOrDefault();
            _logger.LogDebug("Strava rate limit usage: {Usage}", usage);
        }

        if ((int)response.StatusCode == 429)
        {
            _logger.LogWarning("Strava rate limit exceeded");
            throw new InvalidOperationException("Strava API rate limit exceeded. Please try again later.");
        }
    }

    // Internal DTOs for Strava API responses
    private class StreamData
    {
        public List<GpsPoint>? GpsRoute { get; set; }
        public int? AverageHeartRate { get; set; }
        public int? MaxHeartRate { get; set; }
        public int? AverageCadence { get; set; }
    }
}

// Strava API response models
internal class StravaTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = string.Empty;

    [JsonPropertyName("expires_at")]
    public long ExpiresAt { get; set; }

    [JsonPropertyName("athlete")]
    public StravaAthlete? Athlete { get; set; }
}

internal class StravaAthlete
{
    [JsonPropertyName("id")]
    public long Id { get; set; }
}

internal class StravaActivity
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("sport_type")]
    public string? SportType { get; set; }

    [JsonPropertyName("start_date")]
    public DateTime StartDate { get; set; }

    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("moving_time")]
    public int MovingTime { get; set; }

    [JsonPropertyName("elapsed_time")]
    public int ElapsedTime { get; set; }

    [JsonPropertyName("total_elevation_gain")]
    public double? TotalElevationGain { get; set; }

    [JsonPropertyName("average_heartrate")]
    public double? AverageHeartrate { get; set; }

    [JsonPropertyName("max_heartrate")]
    public double? MaxHeartrate { get; set; }

    [JsonPropertyName("average_cadence")]
    public double? AverageCadence { get; set; }

    [JsonPropertyName("calories")]
    public double? Calories { get; set; }

    [JsonPropertyName("has_heartrate")]
    public bool HasHeartrate { get; set; }
}

internal class StravaStream
{
    [JsonPropertyName("data")]
    public List<object>? Data { get; set; }

    [JsonPropertyName("series_type")]
    public string? SeriesType { get; set; }

    [JsonPropertyName("original_size")]
    public int OriginalSize { get; set; }

    [JsonPropertyName("resolution")]
    public string? Resolution { get; set; }
}
