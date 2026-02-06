using System.Security.Claims;
using System.Text.Json;
using Hangfire;
using HerPace.Core;
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
    private readonly IPlanAdaptationService _planAdaptationService;
    private readonly ILogger<SessionController> _logger;

    public SessionController(
        ISessionCompletionService sessionCompletionService,
        ICyclePhaseTipsService cyclePhaseTipsService,
        HerPaceDbContext context,
        IPlanAdaptationService planAdaptationService,
        ILogger<SessionController> logger)
    {
        _sessionCompletionService = sessionCompletionService;
        _cyclePhaseTipsService = cyclePhaseTipsService;
        _context = context;
        _planAdaptationService = planAdaptationService;
        _logger = logger;
    }

    /// <summary>
    /// Get upcoming sessions (today + next N sessions) for the authenticated runner.
    /// </summary>
    /// <param name="count">Number of upcoming sessions to retrieve (default: 7)</param>
    [HttpGet("upcoming")]
    [ProducesResponseType(typeof(UpcomingSessionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUpcomingSessions([FromQuery] int count = 7, [FromQuery] string? clientDate = null)
    {
        try
        {
            var runnerId = GetRunnerIdFromClaims();
            _logger.LogInformation("Getting {Count} upcoming sessions for runner {RunnerId} with clientDate {ClientDate}", count, runnerId, clientDate);

        var sessions = await _sessionCompletionService.GetUpcomingSessionsAsync(runnerId, count, clientDate);

        // Check if there's a pending recalculation job and calculate IsRecentlyUpdated
        var hasPendingRecalculation = false;
        if (sessions.Any())
        {
            // Get the active plan to check job status and last recalculation time
            var activePlan = await _context.TrainingPlans
                .Include(p => p.Sessions)
                .Where(p => p.RunnerId == runnerId && p.Status == PlanStatus.Active)
                .FirstOrDefaultAsync();

            if (activePlan != null)
            {
                // Check Hangfire job status
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

                // Calculate IsRecentlyUpdated for each session
                foreach (var session in sessions)
                {
                    var sessionEntity = activePlan.Sessions.FirstOrDefault(s => s.Id == session.Id);
                    if (sessionEntity != null)
                    {
                        session.IsRecentlyUpdated = activePlan.LastRecalculatedAt.HasValue
                            && sessionEntity.UpdatedAt >= activePlan.LastRecalculatedAt.Value
                            && (DateTime.UtcNow - sessionEntity.UpdatedAt).TotalDays <= 7;
                    }
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
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
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
        try
        {
            var runnerId = GetRunnerIdFromClaims();
            _logger.LogInformation("Getting session {SessionId} for runner {RunnerId}", id, runnerId);

        var session = await _sessionCompletionService.GetSessionDetailAsync(id, runnerId);

        if (session == null)
        {
            return NotFound("Session not found or does not belong to this runner");
        }

        return Ok(session);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
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
        try
        {
            var runnerId = GetRunnerIdFromClaims();
            _logger.LogInformation("Completing session {SessionId} for runner {RunnerId}", id, runnerId);

        var result = await _sessionCompletionService.CompleteSessionAsync(id, runnerId, request);

        if (!result.Success)
        {
            return result.ErrorMessage?.Contains("not found") == true
                ? NotFound(result.ErrorMessage)
                : BadRequest(result.ErrorMessage);
        }

        // Get the active plan to check pending confirmation state
        var activePlan = await _context.TrainingPlans
            .FirstOrDefaultAsync(p => p.RunnerId == runnerId && p.Status == PlanStatus.Active);

        var response = new SessionCompletionResponse
        {
            SessionId = id,
            Success = true,
            RecalculationTriggered = result.RecalculationTriggered && activePlan?.PendingRecalculationConfirmation == false,
            RecalculationRequested = result.RecalculationTriggered,
            PendingConfirmation = activePlan?.PendingRecalculationConfirmation ?? false,
            Message = activePlan?.PendingRecalculationConfirmation == true
                ? "Session completed. We've detected changes in your training pattern."
                : result.RecalculationTriggered
                    ? "Session completed. Your training plan is being adapted based on your recent performance."
                    : "Session completed successfully."
        };

        return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
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
        try
        {
            var runnerId = GetRunnerIdFromClaims();
            _logger.LogInformation("Skipping session {SessionId} for runner {RunnerId}", id, runnerId);

        var result = await _sessionCompletionService.SkipSessionAsync(id, runnerId, request);

        if (!result.Success)
        {
            return result.ErrorMessage?.Contains("not found") == true
                ? NotFound(result.ErrorMessage)
                : BadRequest(result.ErrorMessage);
        }

        // Get the active plan to check pending confirmation state
        var activePlan = await _context.TrainingPlans
            .FirstOrDefaultAsync(p => p.RunnerId == runnerId && p.Status == PlanStatus.Active);

        var response = new SessionCompletionResponse
        {
            SessionId = id,
            Success = true,
            RecalculationTriggered = result.RecalculationTriggered && activePlan?.PendingRecalculationConfirmation == false,
            RecalculationRequested = result.RecalculationTriggered,
            PendingConfirmation = activePlan?.PendingRecalculationConfirmation ?? false,
            Message = activePlan?.PendingRecalculationConfirmation == true
                ? "Session skipped. We've detected changes in your training pattern."
                : result.RecalculationTriggered
                    ? "Session skipped. Your training plan is being adapted based on your recent performance."
                    : "Session skipped successfully."
        };

        return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Confirm plan recalculation after user approval.
    /// POST /api/sessions/confirm-recalculation
    /// </summary>
    [HttpPost("confirm-recalculation")]
    [ProducesResponseType(typeof(RecalculationConfirmationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ConfirmRecalculation()
    {
        try
        {
            var runnerId = GetRunnerIdFromClaims();
            _logger.LogInformation("Confirming recalculation for runner {RunnerId}", runnerId);

            // Find active plan
            var activePlan = await _context.TrainingPlans
                .Where(p => p.RunnerId == runnerId && p.Status == PlanStatus.Active)
                .FirstOrDefaultAsync();

            if (activePlan == null)
            {
                return NotFound("No active training plan found");
            }

            var success = await _planAdaptationService.ConfirmRecalculationAsync(activePlan.Id);

            if (!success)
            {
                return BadRequest("Could not confirm recalculation. No pending confirmation found or job already in progress.");
            }

            return Ok(new RecalculationConfirmationResponse
            {
                Success = true,
                RecalculationEnqueued = true,
                Message = "Your training plan is being adapted. This usually takes 1-2 minutes."
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Decline plan recalculation after user rejection.
    /// POST /api/sessions/decline-recalculation
    /// </summary>
    [HttpPost("decline-recalculation")]
    [ProducesResponseType(typeof(RecalculationConfirmationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeclineRecalculation()
    {
        try
        {
            var runnerId = GetRunnerIdFromClaims();
            _logger.LogInformation("Declining recalculation for runner {RunnerId}", runnerId);

            // Find active plan
            var activePlan = await _context.TrainingPlans
                .Where(p => p.RunnerId == runnerId && p.Status == PlanStatus.Active)
                .FirstOrDefaultAsync();

            if (activePlan == null)
            {
                return NotFound("No active training plan found");
            }

            var success = await _planAdaptationService.DeclineRecalculationAsync(activePlan.Id);

            if (!success)
            {
                return BadRequest("Could not decline recalculation.");
            }

            return Ok(new RecalculationConfirmationResponse
            {
                Success = true,
                RecalculationEnqueued = false,
                Message = "Got it! We'll keep your current plan as-is."
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
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
        try
        {
            var runnerId = GetRunnerIdFromClaims();
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
            today = DateTime.SpecifyKind(parsedDate.Date, DateTimeKind.Utc);
            _logger.LogInformation("Using client date {Today} for today's session lookup", today);
        }
        else
        {
            today = DateTime.UtcNow.Date;
            _logger.LogInformation("Using UTC date {Today} for today's session lookup", today);
        }

        // Get today's session using date-only comparison
        var todaysSessionEntity = activePlan.Sessions
            .Where(s => s.ScheduledDate.Date == today)
            .FirstOrDefault();

        SessionDetailDto? todaysSession = null;
        if (todaysSessionEntity != null)
        {
            // Parse workout tips
            var workoutTips = new List<string>();
            if (!string.IsNullOrEmpty(todaysSessionEntity.WorkoutTips))
            {
                try
                {
                    var parsedTips = JsonSerializer.Deserialize<List<string>>(todaysSessionEntity.WorkoutTips);
                    if (parsedTips != null) workoutTips = parsedTips;
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to parse WorkoutTips for session {SessionId}", todaysSessionEntity.Id);
                }
            }

            // Calculate session progress in phase
            int? sessionNumberInPhase = null;
            int? totalSessionsInPhase = null;
            if (todaysSessionEntity.CyclePhase.HasValue)
            {
                var sessionsInPhase = activePlan.Sessions
                    .Where(s => s.CyclePhase == todaysSessionEntity.CyclePhase)
                    .OrderBy(s => s.ScheduledDate)
                    .ToList();
                totalSessionsInPhase = sessionsInPhase.Count;
                sessionNumberInPhase = sessionsInPhase.FindIndex(s => s.Id == todaysSessionEntity.Id) + 1;
            }

            // Calculate menstruation day
            int? menstruationDay = null;
            if (todaysSessionEntity.CyclePhase == CyclePhase.Menstrual)
            {
                var runner = await _context.Runners.FirstOrDefaultAsync(r => r.Id == activePlan.RunnerId);
                if (runner?.LastPeriodStart.HasValue == true && runner.CycleLength.HasValue)
                {
                    var daysSinceLastPeriod = (todaysSessionEntity.ScheduledDate.Date - runner.LastPeriodStart.Value.Date).Days;
                    var currentDayInCycle = (daysSinceLastPeriod % runner.CycleLength.Value) + 1;
                    if (currentDayInCycle <= 5) menstruationDay = currentDayInCycle;
                }
            }

            todaysSession = new SessionDetailDto
            {
                Id = todaysSessionEntity.Id,
                SessionName = todaysSessionEntity.SessionName,
                ScheduledDate = todaysSessionEntity.ScheduledDate,
                WorkoutType = todaysSessionEntity.WorkoutType,
                WarmUp = todaysSessionEntity.WarmUp,
                SessionDescription = todaysSessionEntity.SessionDescription,
                DurationMinutes = todaysSessionEntity.DurationMinutes,
                Distance = todaysSessionEntity.Distance,
                IntensityLevel = todaysSessionEntity.IntensityLevel,
                HRZones = todaysSessionEntity.HRZones,
                CyclePhase = todaysSessionEntity.CyclePhase,
                PhaseGuidance = todaysSessionEntity.PhaseGuidance,
                SessionNumberInPhase = sessionNumberInPhase,
                TotalSessionsInPhase = totalSessionsInPhase,
                MenstruationDay = menstruationDay,
                WorkoutTips = workoutTips,
                CompletedAt = todaysSessionEntity.CompletedAt,
                ActualDistance = todaysSessionEntity.ActualDistance,
                ActualDuration = todaysSessionEntity.ActualDuration,
                RPE = todaysSessionEntity.RPE,
                UserNotes = todaysSessionEntity.UserNotes,
                IsSkipped = todaysSessionEntity.IsSkipped,
                SkipReason = todaysSessionEntity.SkipReason,
                TrainingStage = TrainingStageLibrary.CalculateStage(todaysSessionEntity.ScheduledDate, activePlan.StartDate, activePlan.EndDate),
                TrainingStageInfo = TrainingStageLibrary.GetInfo(TrainingStageLibrary.CalculateStage(todaysSessionEntity.ScheduledDate, activePlan.StartDate, activePlan.EndDate)),
                WasModified = todaysSessionEntity.WasModified,
                IsCompleted = todaysSessionEntity.CompletedAt.HasValue && !todaysSessionEntity.IsSkipped,
                IsRecentlyUpdated = activePlan.LastRecalculatedAt.HasValue
                    && todaysSessionEntity.UpdatedAt >= activePlan.LastRecalculatedAt.Value
                    && (DateTime.UtcNow - todaysSessionEntity.UpdatedAt).TotalDays <= 7
            };
        }

        // Get recalculation summary if not viewed
        var recalculationSummary = activePlan.RecalculationSummaryViewedAt == null
            ? activePlan.LastRecalculationSummary
            : null;

        // Get latest adaptation details if summary not viewed
        LatestAdaptationDto? latestAdaptation = null;
        if (activePlan.RecalculationSummaryViewedAt == null)
        {
            var latestHistory = await _context.PlanAdaptationHistory
                .Where(h => h.TrainingPlanId == activePlan.Id)
                .OrderByDescending(h => h.AdaptedAt)
                .FirstOrDefaultAsync();

            if (latestHistory != null && !string.IsNullOrEmpty(latestHistory.ChangesJson))
            {
                try
                {
                    var changes = JsonSerializer.Deserialize<List<SessionChangeDto>>(
                        latestHistory.ChangesJson,
                        new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

                    if (changes != null)
                    {
                        latestAdaptation = new LatestAdaptationDto
                        {
                            AdaptedAt = latestHistory.AdaptedAt,
                            SessionChanges = changes
                        };
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize adaptation changes for history {HistoryId}", latestHistory.Id);
                }
            }
        }

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
            PendingConfirmation = activePlan.PendingRecalculationConfirmation,
            RecalculationSummary = recalculationSummary,
            LatestAdaptation = latestAdaptation,
            TodaysSession = todaysSession,
            CyclePhaseTips = cyclePhaseTips
        };

        return Ok(planSummary);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
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
        try
        {
            var runnerId = GetRunnerIdFromClaims();
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
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
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
    /// Gets the adaptation history for the current user's active training plan.
    /// GET /api/sessions/adaptation-history?skip=0&take=10
    /// </summary>
    [HttpGet("adaptation-history")]
    public async Task<IActionResult> GetAdaptationHistory([FromQuery] int skip = 0, [FromQuery] int take = 10)
    {
        try
        {
            var runnerId = GetRunnerIdFromClaims();

            // Get active training plan
            var activePlan = await _context.TrainingPlans
                .Include(tp => tp.Race)
                .FirstOrDefaultAsync(tp => tp.RunnerId == runnerId && tp.Status == PlanStatus.Active);

            if (activePlan == null)
                return NotFound(new { message = "No active training plan found" });

            // Fetch adaptation history entries
            var historyEntries = await _context.PlanAdaptationHistory
                .Where(h => h.TrainingPlanId == activePlan.Id)
                .OrderByDescending(h => h.AdaptedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            // Map to DTOs and deserialize changes
            var historyDtos = historyEntries.Select(h => new AdaptationHistoryDto
            {
                Id = h.Id,
                AdaptedAt = h.AdaptedAt,
                IsViewed = h.ViewedAt.HasValue,
                Summary = h.Summary,
                SessionsAffectedCount = h.SessionsAffectedCount,
                TriggerReason = h.TriggerReason,
                Changes = string.IsNullOrEmpty(h.ChangesJson)
                    ? new List<SessionChangeDto>()
                    : JsonSerializer.Deserialize<List<SessionChangeDto>>(h.ChangesJson,
                        new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
                      ?? new List<SessionChangeDto>()
            }).ToList();

            _logger.LogInformation(
                "Retrieved {Count} adaptation history entries for plan {PlanId}",
                historyDtos.Count,
                activePlan.Id);

            return Ok(historyDtos);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Marks an adaptation history entry as viewed by the user.
    /// POST /api/sessions/adaptation-history/{id}/mark-viewed
    /// </summary>
    [HttpPost("adaptation-history/{id}/mark-viewed")]
    public async Task<IActionResult> MarkAdaptationHistoryViewed(Guid id)
    {
        try
        {
            var runnerId = GetRunnerIdFromClaims();

            // Get active training plan
            var activePlan = await _context.TrainingPlans
                .FirstOrDefaultAsync(tp => tp.RunnerId == runnerId && tp.Status == PlanStatus.Active);

            if (activePlan == null)
                return NotFound(new { message = "No active training plan found" });

            // Find the history entry
            var historyEntry = await _context.PlanAdaptationHistory
                .FirstOrDefaultAsync(h => h.Id == id && h.TrainingPlanId == activePlan.Id);

            if (historyEntry == null)
                return NotFound(new { message = "Adaptation history entry not found" });

            // Mark as viewed
            historyEntry.ViewedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Marked adaptation history {HistoryId} as viewed for plan {PlanId}",
                id,
                activePlan.Id);

            return Ok(new { success = true });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Helper method to extract runner ID from JWT claims.
    /// Throws InvalidOperationException if profile not found.
    /// </summary>
    private Guid GetRunnerIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }

        // Look up the Runner entity to get the Runner.Id (not User.Id)
        var runner = _context.Runners.FirstOrDefault(r => r.UserId == userId);
        if (runner == null)
        {
            throw new InvalidOperationException("Runner profile not found. Please create a profile first.");
        }

        return runner.Id;
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
