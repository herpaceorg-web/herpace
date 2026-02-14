using HerPace.Core.DTOs;
using HerPace.Core.Enums;

namespace HerPace.Infrastructure.Services.Providers;

/// <summary>
/// Platform-specific fitness tracker provider interface.
/// Each external platform (Strava, Health Connect, Garmin) implements this interface.
/// </summary>
public interface IFitnessProvider
{
    /// <summary>
    /// The platform this provider handles.
    /// </summary>
    FitnessPlatform Platform { get; }

    /// <summary>
    /// Builds the OAuth authorization URL to redirect the user to.
    /// </summary>
    /// <param name="state">CSRF state token to include in the redirect.</param>
    /// <returns>The full authorization URL.</returns>
    string GetAuthorizationUrl(string state);

    /// <summary>
    /// Exchanges an authorization code for access and refresh tokens.
    /// </summary>
    /// <param name="code">The authorization code from the OAuth callback.</param>
    /// <returns>Token exchange result including access token, refresh token, expiry, and athlete ID.</returns>
    Task<TokenExchangeResult> ExchangeCodeForTokensAsync(string code);

    /// <summary>
    /// Refreshes an expired access token using the refresh token.
    /// </summary>
    /// <param name="refreshToken">The current refresh token.</param>
    /// <returns>New token exchange result with updated tokens.</returns>
    Task<TokenExchangeResult> RefreshAccessTokenAsync(string refreshToken);

    /// <summary>
    /// Fetches activities from the external platform since a given date.
    /// </summary>
    /// <param name="accessToken">The user's access token for this platform.</param>
    /// <param name="since">Fetch activities after this date.</param>
    /// <returns>List of normalized activity data.</returns>
    Task<List<NormalizedActivity>> FetchActivitiesAsync(string accessToken, DateTime since);

    /// <summary>
    /// Fetches a single activity's full details (including streams/route data).
    /// </summary>
    /// <param name="accessToken">The user's access token for this platform.</param>
    /// <param name="externalActivityId">The platform-specific activity ID.</param>
    /// <returns>Normalized activity with full detail.</returns>
    Task<NormalizedActivity?> FetchActivityDetailAsync(string accessToken, string externalActivityId);

    /// <summary>
    /// Revokes access for this user on the external platform.
    /// </summary>
    /// <param name="accessToken">The user's access token to revoke.</param>
    Task RevokeAccessAsync(string accessToken);
}
