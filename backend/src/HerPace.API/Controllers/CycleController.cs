using HerPace.Core.DTOs;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HerPace.API.Controllers;

/// <summary>
/// Manages cycle tracking and period reporting for authenticated users.
/// </summary>
[ApiController]
[Route("api/cycle")]
[Authorize]
public class CycleController : ControllerBase
{
    private readonly ICycleTrackingService _cycleTrackingService;
    private readonly HerPaceDbContext _context;
    private readonly ILogger<CycleController> _logger;

    public CycleController(
        ICycleTrackingService cycleTrackingService,
        HerPaceDbContext context,
        ILogger<CycleController> logger)
    {
        _cycleTrackingService = cycleTrackingService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current cycle position for the authenticated user.
    /// Returns 404 if cycle tracking is not enabled.
    /// </summary>
    [HttpGet("position")]
    public async Task<IActionResult> GetCyclePosition()
    {
        var runnerId = await GetRunnerIdForUser();

        _logger.LogInformation("Getting cycle position for runner {RunnerId}", runnerId);

        var position = await _cycleTrackingService.GetCurrentCyclePositionAsync(runnerId);

        if (position == null)
        {
            return NotFound(new { message = "Cycle tracking not enabled. Please update your profile with cycle information." });
        }

        return Ok(position);
    }

    /// <summary>
    /// Reports a period date range (start and/or end) and triggers plan regeneration if needed.
    /// At least one date must be provided. Returns 400 if dates are invalid.
    /// </summary>
    [HttpPost("report")]
    public async Task<IActionResult> ReportPeriod([FromBody] ReportPeriodRequest request)
    {
        var runnerId = await GetRunnerIdForUser();

        _logger.LogInformation("Reporting period for runner {RunnerId}, start: {StartDate}, end: {EndDate}",
            runnerId, request.PeriodStartDate, request.PeriodEndDate);

        // Validate at least one date is provided
        if (!request.PeriodStartDate.HasValue && !request.PeriodEndDate.HasValue)
        {
            return BadRequest(new { message = "At least one date (start or end) must be provided" });
        }

        // Validate dates are not in the future
        if (request.PeriodStartDate.HasValue && request.PeriodStartDate.Value > DateTime.UtcNow)
        {
            return BadRequest(new { message = "Period start date cannot be in the future" });
        }

        if (request.PeriodEndDate.HasValue && request.PeriodEndDate.Value > DateTime.UtcNow)
        {
            return BadRequest(new { message = "Period end date cannot be in the future" });
        }

        // Validate end date is after start date if both provided
        if (request.PeriodStartDate.HasValue && request.PeriodEndDate.HasValue
            && request.PeriodEndDate.Value < request.PeriodStartDate.Value)
        {
            return BadRequest(new { message = "Period end date must be after start date" });
        }

        try
        {
            var response = await _cycleTrackingService.ReportPeriodStartAsync(runnerId, request);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid period report for runner {RunnerId}", runnerId);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to report period for runner {RunnerId}", runnerId);
            return StatusCode(500, new { message = "Failed to report period. Please try again." });
        }
    }

    /// <summary>
    /// Gets the cycle history and accuracy stats for the authenticated user.
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetCycleHistory()
    {
        var runnerId = await GetRunnerIdForUser();

        _logger.LogInformation("Getting cycle history for runner {RunnerId}", runnerId);

        var history = await _cycleTrackingService.GetCycleHistoryAsync(runnerId);

        return Ok(history);
    }

    private Guid GetAuthenticatedUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }

    private async Task<Guid> GetRunnerIdForUser()
    {
        var userId = GetAuthenticatedUserId();

        var runner = await _context.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (runner == null)
        {
            throw new InvalidOperationException("Runner profile not found. Please create a profile first.");
        }

        return runner.Id;
    }
}
