using HerPace.Core;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace HerPace.API.Controllers;

/// <summary>
/// Manages training plans for authenticated users.
/// </summary>
[ApiController]
[Route("api/plans")]
[Authorize]
public class PlanController : ControllerBase
{
    private readonly HerPaceDbContext _context;
    private readonly IPlanGenerationService _planGenerationService;
    private readonly ILogger<PlanController> _logger;

    public PlanController(
        HerPaceDbContext context,
        IPlanGenerationService planGenerationService,
        ILogger<PlanController> logger)
    {
        _context = context;
        _planGenerationService = planGenerationService;
        _logger = logger;
    }

    /// <summary>
    /// Generates a new training plan for a race.
    /// Enforces FR-017: Only one active plan allowed per runner.
    /// Returns 409 Conflict if an active plan already exists.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> GeneratePlan([FromBody] GeneratePlanRequest request)
    {
        var userId = GetAuthenticatedUserId();

        _logger.LogInformation("Generating plan for race {RaceId}, user {UserId}", request.RaceId, userId);

        // Get runner profile
        var runner = await _context.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (runner == null)
        {
            return BadRequest(new { message = "Profile not found. Please create a profile first." });
        }

        // Verify race exists and belongs to this runner
        var race = await _context.Races
            .FirstOrDefaultAsync(r => r.Id == request.RaceId && r.RunnerId == runner.Id);

        if (race == null)
        {
            return NotFound(new { message = "Race not found or does not belong to you." });
        }

        // FR-017: Check if runner already has an active plan
        if (await _planGenerationService.HasActivePlanAsync(runner.Id))
        {
            _logger.LogWarning("User {UserId} attempted to create plan but already has active plan", userId);
            return Conflict(new
            {
                message = "You already have an active training plan. Please archive or complete your current plan before creating a new one.",
                errorCode = "ACTIVE_PLAN_EXISTS"
            });
        }

        // Generate the training plan
        try
        {
            var trainingPlan = await _planGenerationService.GeneratePlanAsync(request.RaceId, runner.Id);

            _logger.LogInformation(
                "Training plan {PlanId} generated successfully with {SessionCount} sessions using {Source}",
                trainingPlan.Id,
                trainingPlan.Sessions.Count,
                trainingPlan.GenerationSource);

            return CreatedAtAction(
                nameof(GetActivePlan),
                new PlanResponse
                {
                    Id = trainingPlan.Id,
                    RaceId = trainingPlan.RaceId,
                    RunnerId = trainingPlan.RunnerId,
                    PlanName = trainingPlan.PlanName,
                    Status = trainingPlan.Status,
                    GenerationSource = trainingPlan.GenerationSource,
                    AiModel = trainingPlan.AiModel,
                    AiRationale = trainingPlan.AiRationale,
                    StartDate = trainingPlan.StartDate,
                    EndDate = trainingPlan.EndDate,
                    TrainingDaysPerWeek = trainingPlan.TrainingDaysPerWeek,
                    LongRunDay = trainingPlan.LongRunDay,
                    PlanCompletionGoal = trainingPlan.PlanCompletionGoal,
                    SessionCount = trainingPlan.Sessions.Count,
                    CreatedAt = trainingPlan.CreatedAt
                });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Plan generation failed for race {RaceId}", request.RaceId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during plan generation for race {RaceId}", request.RaceId);
            return StatusCode(500, new { message = "An error occurred while generating your training plan. Please try again." });
        }
    }

    /// <summary>
    /// Retrieves the active training plan for the authenticated user.
    /// Includes all sessions ordered by scheduled date.
    /// </summary>
    [HttpGet("active")]
    public async Task<IActionResult> GetActivePlan()
    {
        var userId = GetAuthenticatedUserId();

        var runner = await _context.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (runner == null)
        {
            return BadRequest(new { message = "Profile not found." });
        }

        var activePlan = await _context.TrainingPlans
            .Include(tp => tp.Race)
            .Include(tp => tp.Sessions)
            .FirstOrDefaultAsync(tp => tp.RunnerId == runner.Id && tp.Status == PlanStatus.Active);

        if (activePlan == null)
        {
            return NotFound(new { message = "No active training plan found." });
        }

        var response = new PlanDetailResponse
        {
            Id = activePlan.Id,
            RaceId = activePlan.RaceId,
            RaceName = activePlan.Race.RaceName,
            RaceDate = activePlan.Race.RaceDate,
            RunnerId = activePlan.RunnerId,
            PlanName = activePlan.PlanName,
            Status = activePlan.Status,
            GenerationSource = activePlan.GenerationSource,
            AiModel = activePlan.AiModel,
            AiRationale = activePlan.AiRationale,
            StartDate = activePlan.StartDate,
            EndDate = activePlan.EndDate,
            TrainingDaysPerWeek = activePlan.TrainingDaysPerWeek,
            LongRunDay = activePlan.LongRunDay,
            DaysBeforePeriodToReduceIntensity = activePlan.DaysBeforePeriodToReduceIntensity,
            DaysAfterPeriodToReduceIntensity = activePlan.DaysAfterPeriodToReduceIntensity,
            PlanCompletionGoal = activePlan.PlanCompletionGoal,
            CreatedAt = activePlan.CreatedAt,
            Sessions = activePlan.Sessions
                .OrderBy(s => s.ScheduledDate)
                .Select(s => new SessionSummary
                {
                    Id = s.Id,
                    SessionName = s.SessionName,
                    ScheduledDate = s.ScheduledDate,
                    WorkoutType = s.WorkoutType,
                    DurationMinutes = s.DurationMinutes,
                    Distance = s.Distance,
                    IntensityLevel = s.IntensityLevel,
                    CyclePhase = s.CyclePhase,
                    PhaseGuidance = s.PhaseGuidance,
                    TrainingStage = TrainingStageLibrary.CalculateStage(s.ScheduledDate, activePlan.StartDate, activePlan.EndDate),
                    CompletedAt = s.CompletedAt,
                    IsSkipped = s.IsSkipped,
                    WarmUp = s.WarmUp,
                    Recovery = s.Recovery,
                    SessionDescription = s.SessionDescription,
                    WorkoutTips = ParseWorkoutTips(s.WorkoutTips),
                    IsCompleted = s.CompletedAt.HasValue && !s.IsSkipped,
                    WasModified = s.WasModified,
                    ActualDistance = s.ActualDistance,
                    ActualDuration = s.ActualDuration,
                    RPE = s.RPE,
                    UserNotes = s.UserNotes
                })
                .ToList()
        };

        return Ok(response);
    }

    /// <summary>
    /// Retrieves the training plan for a specific race.
    /// Returns 404 if no plan exists for the race.
    /// </summary>
    [HttpGet("race/{raceId}")]
    public async Task<IActionResult> GetPlanByRaceId(Guid raceId)
    {
        var userId = GetAuthenticatedUserId();

        var runner = await _context.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (runner == null)
        {
            return BadRequest(new { message = "Profile not found." });
        }

        var plan = await _context.TrainingPlans
            .Include(tp => tp.Race)
            .Include(tp => tp.Sessions)
            .FirstOrDefaultAsync(tp => tp.RaceId == raceId && tp.RunnerId == runner.Id);

        if (plan == null)
        {
            return NotFound(new { message = "No training plan found for this race." });
        }

        var response = new PlanDetailResponse
        {
            Id = plan.Id,
            RaceId = plan.RaceId,
            RaceName = plan.Race.RaceName,
            RaceDate = plan.Race.RaceDate,
            RunnerId = plan.RunnerId,
            PlanName = plan.PlanName,
            Status = plan.Status,
            GenerationSource = plan.GenerationSource,
            AiModel = plan.AiModel,
            AiRationale = plan.AiRationale,
            StartDate = plan.StartDate,
            EndDate = plan.EndDate,
            TrainingDaysPerWeek = plan.TrainingDaysPerWeek,
            LongRunDay = plan.LongRunDay,
            DaysBeforePeriodToReduceIntensity = plan.DaysBeforePeriodToReduceIntensity,
            DaysAfterPeriodToReduceIntensity = plan.DaysAfterPeriodToReduceIntensity,
            PlanCompletionGoal = plan.PlanCompletionGoal,
            CreatedAt = plan.CreatedAt,
            Sessions = plan.Sessions
                .OrderBy(s => s.ScheduledDate)
                .Select(s => new SessionSummary
                {
                    Id = s.Id,
                    SessionName = s.SessionName,
                    ScheduledDate = s.ScheduledDate,
                    WorkoutType = s.WorkoutType,
                    DurationMinutes = s.DurationMinutes,
                    Distance = s.Distance,
                    IntensityLevel = s.IntensityLevel,
                    CyclePhase = s.CyclePhase,
                    PhaseGuidance = s.PhaseGuidance,
                    TrainingStage = TrainingStageLibrary.CalculateStage(s.ScheduledDate, plan.StartDate, plan.EndDate),
                    CompletedAt = s.CompletedAt,
                    IsSkipped = s.IsSkipped,
                    WarmUp = s.WarmUp,
                    Recovery = s.Recovery,
                    SessionDescription = s.SessionDescription,
                    WorkoutTips = ParseWorkoutTips(s.WorkoutTips),
                    IsCompleted = s.CompletedAt.HasValue && !s.IsSkipped,
                    WasModified = s.WasModified,
                    ActualDistance = s.ActualDistance,
                    ActualDuration = s.ActualDuration,
                    RPE = s.RPE,
                    UserNotes = s.UserNotes
                })
                .ToList()
        };

        return Ok(response);
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

    private static List<string> ParseWorkoutTips(string? workoutTipsJson)
    {
        if (string.IsNullOrEmpty(workoutTipsJson)) return new List<string>();
        try
        {
            return JsonSerializer.Deserialize<List<string>>(workoutTipsJson) ?? new List<string>();
        }
        catch (JsonException)
        {
            return new List<string>();
        }
    }
}

/// <summary>
/// Request to generate a training plan.
/// </summary>
public class GeneratePlanRequest
{
    public Guid RaceId { get; set; }
}

/// <summary>
/// Response for plan creation (summary).
/// </summary>
public class PlanResponse
{
    public Guid Id { get; set; }
    public Guid RaceId { get; set; }
    public Guid RunnerId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public PlanStatus Status { get; set; }
    public GenerationSource GenerationSource { get; set; }
    public string? AiModel { get; set; }
    public string? AiRationale { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TrainingDaysPerWeek { get; set; }
    public DayOfWeek LongRunDay { get; set; }
    public string? PlanCompletionGoal { get; set; }
    public int SessionCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Detailed response for active plan with all sessions.
/// </summary>
public class PlanDetailResponse
{
    public Guid Id { get; set; }
    public Guid RaceId { get; set; }
    public string RaceName { get; set; } = string.Empty;
    public DateTime RaceDate { get; set; }
    public Guid RunnerId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public PlanStatus Status { get; set; }
    public GenerationSource GenerationSource { get; set; }
    public string? AiModel { get; set; }
    public string? AiRationale { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TrainingDaysPerWeek { get; set; }
    public DayOfWeek LongRunDay { get; set; }
    public int DaysBeforePeriodToReduceIntensity { get; set; }
    public int DaysAfterPeriodToReduceIntensity { get; set; }
    public string? PlanCompletionGoal { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<SessionSummary> Sessions { get; set; } = new();
}

/// <summary>
/// Summary of a training session.
/// </summary>
public class SessionSummary
{
    public Guid Id { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public WorkoutType WorkoutType { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? Distance { get; set; }
    public IntensityLevel IntensityLevel { get; set; }
    public CyclePhase? CyclePhase { get; set; }
    public string? PhaseGuidance { get; set; }
    public TrainingStage? TrainingStage { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsSkipped { get; set; }

    // Session content fields (needed for WorkoutSessionCard)
    public string? WarmUp { get; set; }
    public string? Recovery { get; set; }
    public string? SessionDescription { get; set; }
    public List<string> WorkoutTips { get; set; } = new();
    public bool IsCompleted { get; set; }
    public bool WasModified { get; set; }
    public decimal? ActualDistance { get; set; }
    public int? ActualDuration { get; set; }
    public int? RPE { get; set; }
    public string? UserNotes { get; set; }
}
