using System.Security.Claims;
using Hangfire;
using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HerPace.API.Controllers;

/// <summary>
/// API endpoints for training session management and tracking.
/// </summary>
[ApiController]
[Route("api/sessions")]
[Authorize]
public class SessionController : ControllerBase
{
    private readonly ISessionCompletionService _sessionCompletionService;
    private readonly ICyclePhaseTipsService _cyclePhaseTipsService;
    private readonly HerPaceDbContext _context;
    private readonly ILogger<SessionController> _logger;

    public SessionController(
        ISessionCompletionService sessionCompletionService,
        ICyclePhaseTipsService cyclePhaseTipsService,
        HerPaceDbContext context,
        ILogger<SessionController> logger)
    {
        _sessionCompletionService = sessionCompletionService;
        _cyclePhaseTipsService = cyclePhaseTipsService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get upcoming sessions (today + next N sessions) for the authenticated runner.
    /// </summary>
    /// <param name="count">Number of upcoming sessions to retrieve (default: 7)</param>
    [HttpGet("upcoming")]
    [ProducesResponseType(typeof(UpcomingSessionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUpcomingSessions([FromQuery] int count = 7)
    {
        var runnerId = GetRunnerIdFromClaims();
        if (runnerId == Guid.Empty)
        {
            return Unauthorized("Invalid user claims");
        }

        _logger.LogInformation("Getting {Count} upcoming sessions for runner {RunnerId}", count, runnerId);

        var sessions = await _sessionCompletionService.GetUpcomingSessionsAsync(runnerId, count);

        // Check if there's a pending recalculation job
        var hasPendingRecalculation = false;
        if (sessions.Any())
        {
            // Get the active plan to check job status
            var activePlan = await _context.TrainingPlans
                .Where(p => p.RunnerId == runnerId && p.Status == PlanStatus.Active)
                .FirstOrDefaultAsync();

            if (activePlan != null && !string.IsNullOrEmpty(activePlan.LastRecalculationJobId))
            {
                try
                {
                    var jobState = JobStorage.Current?.GetConnection()?.GetStateData(activePlan.LastRecalculationJobId);
                    hasPendingRecalculation = jobState?.Name is "Processing" or "Enqueued";
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error checking Hangfire job status for job {JobId}", activePlan.LastRecalculationJobId);
                }
            }
        }

        var response = new UpcomingSessionsResponse
        {
            Sessions = sessions,
            HasPendingRecalculation = hasPendingRecalculation
        };

        return Ok(response);
    }

    /// <summary>
    /// Get detailed information for a specific session.
    /// </summary>
    /// <param name="id">Session ID</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(SessionDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSession(Guid id)
    {
        var runnerId = GetRunnerIdFromClaims();
        if (runnerId == Guid.Empty)
        {
            return Unauthorized("Invalid user claims");
        }

        _logger.LogInformation("Getting session {SessionId} for runner {RunnerId}", id, runnerId);

        var session = await _sessionCompletionService.GetSessionDetailAsync(id, runnerId);

        if (session == null)
        {
            return NotFound("Session not found or does not belong to this runner");
        }

        return Ok(session);
    }

    /// <summary>
    /// Mark a session as completed with actual performance data.
    /// May trigger plan recalculation if user is significantly off-track.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="request">Actual performance data</param>
    [HttpPut("{id}/complete")]
    [ProducesResponseType(typeof(SessionCompletionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CompleteSession(
        Guid id,
        [FromBody] CompleteSessionRequest request)
    {
        var runnerId = GetRunnerIdFromClaims();
        if (runnerId == Guid.Empty)
        {
            return Unauthorized("Invalid user claims");
        }

        _logger.LogInformation("Completing session {SessionId} for runner {RunnerId}", id, runnerId);

        var result = await _sessionCompletionService.CompleteSessionAsync(id, runnerId, request);

        if (!result.Success)
        {
            return result.ErrorMessage?.Contains("not found") == true
                ? NotFound(result.ErrorMessage)
                : BadRequest(result.ErrorMessage);
        }

        var response = new SessionCompletionResponse
        {
            SessionId = id,
            Success = true,
            RecalculationTriggered = result.RecalculationTriggered,
            Message = result.RecalculationTriggered
                ? "Session completed. Your training plan is being adapted based on your recent performance."
                : "Session completed successfully."
        };

        return Ok(response);
    }

    /// <summary>
    /// Mark a session as skipped.
    /// May trigger plan recalculation if user is significantly off-track.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="request">Skip reason (optional)</param>
    [HttpPut("{id}/skip")]
    [ProducesResponseType(typeof(SessionCompletionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SkipSession(
        Guid id,
        [FromBody] SkipSessionRequest request)
    {
        var runnerId = GetRunnerIdFromClaims();
        if (runnerId == Guid.Empty)
        {
            return Unauthorized("Invalid user claims");
        }

        _logger.LogInformation("Skipping session {SessionId} for runner {RunnerId}", id, runnerId);

        var result = await _sessionCompletionService.SkipSessionAsync(id, runnerId, request);

        if (!result.Success)
        {
            return result.ErrorMessage?.Contains("not found") == true
                ? NotFound(result.ErrorMessage)
                : BadRequest(result.ErrorMessage);
        }

        var response = new SessionCompletionResponse
        {
            SessionId = id,
            Success = true,
            RecalculationTriggered = result.RecalculationTriggered,
            Message = result.RecalculationTriggered
                ? "Session skipped. Your training plan is being adapted based on your recent performance."
                : "Session skipped successfully."
        };

        return Ok(response);
    }

    /// <summary>
    /// Get plan summary including today's session and recalculation status.
    /// </summary>
    /// <param name="clientDate">Client's local date in YYYY-MM-DD format (optional, defaults to UTC)</param>
    [HttpGet("plan-summary")]
    [ProducesResponseType(typeof(PlanSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPlanSummary([FromQuery] string? clientDate = null)
    {
        var runnerId = GetRunnerIdFromClaims();
        if (runnerId == Guid.Empty)
        {
            return Unauthorized("Invalid user claims");
        }

        _logger.LogInformation("Getting plan summary for runner {RunnerId} with clientDate {ClientDate}", runnerId, clientDate);

        // Find active plan with race and sessions
        var activePlan = await _context.TrainingPlans
            .Include(p => p.Race)
            .Include(p => p.Sessions)
            .Where(p => p.RunnerId == runnerId && p.Status == PlanStatus.Active)
            .FirstOrDefaultAsync();

        if (activePlan == null)
        {
            return NotFound("No active training plan found");
        }

        // Check Hangfire job status
        var hasPendingRecalculation = false;
        if (!string.IsNullOrEmpty(activePlan.LastRecalculationJobId))
        {
            try
            {
                var jobState = JobStorage.Current?.GetConnection()?.GetStateData(activePlan.LastRecalculationJobId);
                hasPendingRecalculation = jobState?.Name is "Processing" or "Enqueued";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error checking Hangfire job status for job {JobId}", activePlan.LastRecalculationJobId);
            }
        }

        // Parse client date string to ensure correct date-only comparison
        DateTime today;
        if (!string.IsNullOrEmpty(clientDate) && DateTime.TryParse(clientDate, out var parsedDate))
        {
            today = parsedDate.Date;
            _logger.LogInformation("Using client date {Today} for today's session lookup", today);
        }
        else
        {
            today = DateTime.UtcNow.Date;
            _logger.LogInformation("Using UTC date {Today} for today's session lookup", today);
        }

        // Get today's session using date-only comparison
        var todaysSession = activePlan.Sessions
            .Where(s => s.ScheduledDate.Date == today)
            .Select(s => new SessionDetailDto
            {
                Id = s.Id,
                SessionName = s.SessionName,
                ScheduledDate = s.ScheduledDate,
                WorkoutType = s.WorkoutType,
                WarmUp = s.WarmUp,
                SessionDescription = s.SessionDescription,
                DurationMinutes = s.DurationMinutes,
                Distance = s.Distance,
                IntensityLevel = s.IntensityLevel,
                HRZones = s.HRZones,
                CyclePhase = s.CyclePhase,
                PhaseGuidance = s.PhaseGuidance,
                CompletedAt = s.CompletedAt,
                ActualDistance = s.ActualDistance,
                ActualDuration = s.ActualDuration,
                RPE = s.RPE,
                UserNotes = s.UserNotes,
                IsSkipped = s.IsSkipped,
                SkipReason = s.SkipReason,
                WasModified = s.WasModified,
                IsCompleted = s.CompletedAt.HasValue && !s.IsSkipped
            })
            .FirstOrDefault();

        // Get recalculation summary if not viewed
        var recalculationSummary = activePlan.RecalculationSummaryViewedAt == null
            ? activePlan.LastRecalculationSummary
            : null;

        // Get cycle phase tips for today's session
        CyclePhaseTipsDto? cyclePhaseTips = null;
        if (todaysSession?.CyclePhase != null)
        {
            cyclePhaseTips = _cyclePhaseTipsService.GetTipsForPhase(todaysSession.CyclePhase.Value);
        }

        var planSummary = new PlanSummaryDto
        {
            PlanId = activePlan.Id,
            PlanName = activePlan.PlanName,
            RaceName = activePlan.Race.RaceName,
            RaceDate = activePlan.Race.RaceDate,
            DaysUntilRace = (activePlan.Race.RaceDate - DateTime.UtcNow.Date).Days,
            HasPendingRecalculation = hasPendingRecalculation,
            RecalculationSummary = recalculationSummary,
            TodaysSession = todaysSession,
            CyclePhaseTips = cyclePhaseTips
        };

        return Ok(planSummary);
    }

    /// <summary>
    /// Dismiss the recalculation summary (mark as viewed).
    /// </summary>
    [HttpPost("dismiss-summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DismissSummary()
    {
        var runnerId = GetRunnerIdFromClaims();
        if (runnerId == Guid.Empty)
        {
            return Unauthorized("Invalid user claims");
        }

        _logger.LogInformation("Dismissing recalculation summary for runner {RunnerId}", runnerId);

        // Find active plan
        var activePlan = await _context.TrainingPlans
            .Where(p => p.RunnerId == runnerId && p.Status == PlanStatus.Active)
            .FirstOrDefaultAsync();

        if (activePlan == null)
        {
            return NotFound("No active training plan found");
        }

        // Mark summary as viewed
        activePlan.RecalculationSummaryViewedAt = DateTime.UtcNow;
        activePlan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Recalculation summary dismissed for plan {PlanId}", activePlan.Id);

        return Ok();
    }

    /// <summary>
    /// Logs an ad-hoc workout (not part of scheduled training plan).
    /// POST /api/sessions/log-adhoc
    /// </summary>
    [HttpPost("log-adhoc")]
    public async Task<IActionResult> LogAdHocWorkout([FromBody] LogAdHocWorkoutRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var runner = await _context.Runners.FirstOrDefaultAsync(r => r.UserId == userId);
        if (runner == null)
            return NotFound(new { message = "Runner profile not found" });

        var activePlan = await _context.TrainingPlans
            .FirstOrDefaultAsync(p => p.RunnerId == runner.Id && p.Status == PlanStatus.Active);

        if (activePlan == null)
            return NotFound(new { message = "No active training plan found" });

        // Create an ad-hoc session
        var adHocSession = new HerPace.Core.Entities.TrainingSession
        {
            Id = Guid.NewGuid(),
            TrainingPlanId = activePlan.Id,
            SessionName = "Ad-Hoc Workout",
            WorkoutType = WorkoutType.Easy,
            IntensityLevel = IntensityLevel.Moderate,
            ScheduledDate = DateTime.UtcNow.Date,
            CompletedAt = DateTime.UtcNow,
            ActualDistance = request.ActualDistance,
            ActualDuration = request.ActualDuration,
            RPE = request.RPE,
            UserNotes = request.UserNotes
        };

        _context.TrainingSessions.Add(adHocSession);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Ad-hoc workout logged for runner {RunnerId}", runner.Id);

        return Ok(new { message = "Workout logged successfully" });
    }

    /// <summary>
    /// Helper method to extract runner ID from JWT claims.
    /// </summary>
    private Guid GetRunnerIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Guid.Empty;
        }

        // Look up the Runner entity to get the Runner.Id (not User.Id)
        var runner = _context.Runners.FirstOrDefault(r => r.UserId == userId);
        return runner?.Id ?? Guid.Empty;
    }
}

/// <summary>
/// Request to log an ad-hoc workout.
/// </summary>
public class LogAdHocWorkoutRequest
{
    public decimal? ActualDistance { get; set; }
    public int? ActualDuration { get; set; }
    public int RPE { get; set; }
    public string? UserNotes { get; set; }
}
