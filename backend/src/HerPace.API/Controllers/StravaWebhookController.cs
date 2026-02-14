using Hangfire;
using HerPace.Core.Configuration;
using HerPace.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace HerPace.API.Controllers;

/// <summary>
/// Handles Strava webhook subscription validation and event notifications.
/// These endpoints are public (no [Authorize]) — called directly by Strava servers.
/// </summary>
[ApiController]
[Route("api/webhooks/strava")]
public class StravaWebhookController : ControllerBase
{
    private readonly FitnessTrackerOptions _options;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<StravaWebhookController> _logger;

    public StravaWebhookController(
        IOptions<FitnessTrackerOptions> options,
        IBackgroundJobClient backgroundJobClient,
        ILogger<StravaWebhookController> logger)
    {
        _options = options.Value;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    /// <summary>
    /// Subscription validation endpoint. Strava sends a GET request during webhook
    /// subscription creation. Must echo hub.challenge and verify hub.verify_token.
    /// </summary>
    [HttpGet]
    public IActionResult ValidateSubscription(
        [FromQuery(Name = "hub.mode")] string? hubMode,
        [FromQuery(Name = "hub.challenge")] string? hubChallenge,
        [FromQuery(Name = "hub.verify_token")] string? hubVerifyToken)
    {
        _logger.LogInformation("Strava webhook subscription validation: mode={Mode}, verifyToken={Token}",
            hubMode, hubVerifyToken != null ? "***" : "null");

        if (hubMode != "subscribe" || string.IsNullOrEmpty(hubChallenge))
        {
            return BadRequest(new { error = "Invalid subscription validation request" });
        }

        if (hubVerifyToken != _options.Strava.WebhookVerifyToken)
        {
            _logger.LogWarning("Strava webhook verify token mismatch");
            return Unauthorized(new { error = "Invalid verify token" });
        }

        return Ok(new { hub_challenge = hubChallenge });
    }

    /// <summary>
    /// Event notification endpoint. Strava sends a POST for each activity/athlete event.
    /// Must respond 200 immediately and queue background processing.
    /// </summary>
    [HttpPost]
    public IActionResult HandleEvent([FromBody] StravaWebhookEvent webhookEvent)
    {
        _logger.LogInformation(
            "Strava webhook event: {ObjectType}.{AspectType} objectId={ObjectId} ownerId={OwnerId}",
            webhookEvent.ObjectType, webhookEvent.AspectType,
            webhookEvent.ObjectId, webhookEvent.OwnerId);

        // Queue background processing — must respond 200 within 2 seconds
        _backgroundJobClient.Enqueue<IStravaWebhookProcessor>(p =>
            p.ProcessEventAsync(
                webhookEvent.ObjectType,
                webhookEvent.ObjectId,
                webhookEvent.AspectType,
                webhookEvent.OwnerId,
                webhookEvent.EventTime));

        return Ok();
    }
}

/// <summary>
/// Strava webhook event payload.
/// </summary>
public class StravaWebhookEvent
{
    public string ObjectType { get; set; } = string.Empty;
    public long ObjectId { get; set; }
    public string AspectType { get; set; } = string.Empty;
    public long OwnerId { get; set; }
    public int SubscriptionId { get; set; }
    public long EventTime { get; set; }
    public Dictionary<string, object>? Updates { get; set; }
}
