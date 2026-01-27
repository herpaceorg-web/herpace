using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HerPace.API.Controllers;

/// <summary>
/// Manages race goals for authenticated users.
/// </summary>
[ApiController]
[Route("api/races")]
[Authorize]
public class RaceController : ControllerBase
{
    private readonly HerPaceDbContext _context;
    private readonly IRaceService _raceService;
    private readonly ILogger<RaceController> _logger;

    public RaceController(
        HerPaceDbContext context,
        IRaceService raceService,
        ILogger<RaceController> logger)
    {
        _context = context;
        _raceService = raceService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new race goal for the authenticated user.
    /// Validates FR-016: race date must be at least 7 days in the future.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateRace([FromBody] CreateRaceRequest request)
    {
        var userId = GetAuthenticatedUserId();

        // Get runner profile
        var runner = await _context.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (runner == null)
        {
            return BadRequest(new { message = "Profile not found. Please create a profile first." });
        }

        _logger.LogInformation("Creating race for runner {RunnerId}: {RaceName}", runner.Id, request.RaceName);

        // Create race entity
        var race = new Race
        {
            RunnerId = runner.Id,
            RaceName = request.RaceName,
            Location = request.Location,
            RaceDate = DateTime.SpecifyKind(request.RaceDate, DateTimeKind.Utc),
            Distance = request.Distance,
            DistanceType = request.DistanceType,
            GoalTime = request.GoalTime,
            RaceCompletionGoal = request.RaceCompletionGoal,
            IsPublic = request.IsPublic
        };

        // Validate and create race using service (FR-016 validation)
        try
        {
            var createdRace = await _raceService.CreateRaceAsync(race);

            _logger.LogInformation("Race created successfully: {RaceId}", createdRace.Id);

            return CreatedAtAction(
                nameof(GetRace),
                new { id = createdRace.Id },
                new RaceResponse
                {
                    Id = createdRace.Id,
                    RunnerId = createdRace.RunnerId,
                    RaceName = createdRace.RaceName,
                    Location = createdRace.Location,
                    RaceDate = createdRace.RaceDate,
                    Distance = createdRace.Distance,
                    DistanceType = createdRace.DistanceType,
                    GoalTime = createdRace.GoalTime,
                    RaceCompletionGoal = createdRace.RaceCompletionGoal,
                    RaceResult = createdRace.RaceResult,
                    IsPublic = createdRace.IsPublic,
                    CreatedAt = createdRace.CreatedAt
                });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Race creation failed validation: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a specific race by ID (must belong to authenticated user).
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRace(Guid id)
    {
        var userId = GetAuthenticatedUserId();

        var race = await _context.Races
            .Include(r => r.Runner)
            .Include(r => r.TrainingPlan)
            .FirstOrDefaultAsync(r => r.Id == id && r.Runner.UserId == userId);

        if (race == null)
        {
            return NotFound(new { message = "Race not found." });
        }

        return Ok(new RaceResponse
        {
            Id = race.Id,
            RunnerId = race.RunnerId,
            RaceName = race.RaceName,
            Location = race.Location,
            RaceDate = race.RaceDate,
            Distance = race.Distance,
            DistanceType = race.DistanceType,
            GoalTime = race.GoalTime,
            RaceCompletionGoal = race.RaceCompletionGoal,
            RaceResult = race.RaceResult,
            IsPublic = race.IsPublic,
            CreatedAt = race.CreatedAt,
            HasTrainingPlan = race.TrainingPlan != null
        });
    }

    /// <summary>
    /// Gets all races for the authenticated user.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetRaces()
    {
        var userId = GetAuthenticatedUserId();

        var runner = await _context.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (runner == null)
        {
            return Ok(new List<RaceResponse>());
        }

        var races = await _raceService.GetRacesForRunnerAsync(runner.Id);

        var response = races.Select(race => new RaceResponse
        {
            Id = race.Id,
            RunnerId = race.RunnerId,
            RaceName = race.RaceName,
            Location = race.Location,
            RaceDate = race.RaceDate,
            Distance = race.Distance,
            DistanceType = race.DistanceType,
            GoalTime = race.GoalTime,
            RaceCompletionGoal = race.RaceCompletionGoal,
            RaceResult = race.RaceResult,
            IsPublic = race.IsPublic,
            CreatedAt = race.CreatedAt
        }).ToList();

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
}

/// <summary>
/// Request to create a race goal.
/// </summary>
public class CreateRaceRequest
{
    public string RaceName { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime RaceDate { get; set; }
    public decimal Distance { get; set; }
    public DistanceType DistanceType { get; set; }
    public string? GoalTime { get; set; }
    public string? RaceCompletionGoal { get; set; }
    public bool IsPublic { get; set; } = false;
}

/// <summary>
/// Response containing race data.
/// </summary>
public class RaceResponse
{
    public Guid Id { get; set; }
    public Guid RunnerId { get; set; }
    public string RaceName { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime RaceDate { get; set; }
    public decimal Distance { get; set; }
    public DistanceType DistanceType { get; set; }
    public string? GoalTime { get; set; }
    public string? RaceCompletionGoal { get; set; }
    public TimeSpan? RaceResult { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool HasTrainingPlan { get; set; }
}
