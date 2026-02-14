using Hangfire;
using HerPace.Core.Configuration;
using HerPace.Infrastructure.Services;
using HerPace.Infrastructure.Services.Providers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace HerPace.API.Controllers;

/// <summary>
/// Handles Garmin webhook push notifications for activities and women's health data.
/// These endpoints are public (no [Authorize]) — called directly by Garmin servers.
/// Garmin uses a push model: activity data is sent directly in the payload.
/// </summary>
[ApiController]
[Route("api/webhooks/garmin")]
public class GarminWebhookController : ControllerBase
{
    private readonly FitnessTrackerOptions _options;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<GarminWebhookController> _logger;

    public GarminWebhookController(
        IOptions<FitnessTrackerOptions> options,
        IBackgroundJobClient backgroundJobClient,
        ILogger<GarminWebhookController> logger)
    {
        _options = options.Value;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    /// <summary>
    /// Receives activity data pushed by Garmin when a user syncs their device.
    /// Garmin sends the full activity detail in the payload (no separate fetch needed).
    /// </summary>
    [HttpPost("activities")]
    public IActionResult HandleActivities([FromBody] GarminActivitiesPayload payload)
    {
        if (payload.ActivityDetails == null || payload.ActivityDetails.Count == 0)
        {
            _logger.LogDebug("Garmin activities webhook: empty payload");
            return Ok();
        }

        _logger.LogInformation(
            "Garmin activities webhook: received {Count} activities",
            payload.ActivityDetails.Count);

        // Queue background processing for each activity
        foreach (var activity in payload.ActivityDetails)
        {
            _backgroundJobClient.Enqueue<IGarminWebhookProcessor>(p =>
                p.ProcessActivityAsync(activity.UserId, activity.ActivityId, activity));
        }

        return Ok();
    }

    /// <summary>
    /// Receives women's health (menstrual cycle) data pushed by Garmin.
    /// Updates the runner's cycle data if they have opted in.
    /// </summary>
    [HttpPost("womens-health")]
    public IActionResult HandleWomensHealth([FromBody] GarminWomensHealthPayload payload)
    {
        if (payload.WomensHealthDetails == null || payload.WomensHealthDetails.Count == 0)
        {
            _logger.LogDebug("Garmin womens-health webhook: empty payload");
            return Ok();
        }

        _logger.LogInformation(
            "Garmin womens-health webhook: received {Count} entries",
            payload.WomensHealthDetails.Count);

        // Queue background processing
        foreach (var entry in payload.WomensHealthDetails)
        {
            _backgroundJobClient.Enqueue<IGarminWebhookProcessor>(p =>
                p.ProcessWomensHealthAsync(entry.UserId, entry));
        }

        return Ok();
    }
}

/// <summary>
/// Garmin activity webhook payload wrapper.
/// </summary>
public class GarminActivitiesPayload
{
    public List<GarminActivityPush> ActivityDetails { get; set; } = new();
}

/// <summary>
/// Garmin women's health webhook payload wrapper.
/// </summary>
public class GarminWomensHealthPayload
{
    public List<GarminWomensHealthPush> WomensHealthDetails { get; set; } = new();
}
