using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HerPace.API.Controllers;

/// <summary>
/// Manages runner profiles for authenticated users.
/// </summary>
[ApiController]
[Route("api/profiles")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly HerPaceDbContext _context;
    private readonly ILogger<ProfileController> _logger;

    public ProfileController(HerPaceDbContext context, ILogger<ProfileController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a runner profile for the authenticated user.
    /// Validates cycle length is between 21-45 days.
    /// </summary>
    [HttpPost("me")]
    public async Task<IActionResult> CreateProfile([FromBody] CreateProfileRequest request)
    {
        var userId = GetAuthenticatedUserId();

        _logger.LogInformation("Creating profile for user {UserId}", userId);

        // Check if profile already exists
        var existingRunner = await _context.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (existingRunner != null)
        {
            return BadRequest(new { message = "Profile already exists. Use PUT to update." });
        }

        // Validate cycle length if provided
        if (request.CycleLength.HasValue && (request.CycleLength.Value < 21 || request.CycleLength.Value > 45))
        {
            return BadRequest(new { message = "Cycle length must be between 21 and 45 days." });
        }

        // Create runner profile
        var runner = new Runner
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            DateOfBirth = request.DateOfBirth.HasValue ? DateTime.SpecifyKind(request.DateOfBirth.Value, DateTimeKind.Utc) : null,
            FitnessLevel = request.FitnessLevel,
            TypicalWeeklyMileage = request.TypicalWeeklyMileage,
            DistanceUnit = request.DistanceUnit,
            FiveKPR = request.FiveKPR,
            TenKPR = request.TenKPR,
            HalfMarathonPR = request.HalfMarathonPR,
            MarathonPR = request.MarathonPR,
            CycleLength = request.CycleLength,
            LastPeriodStart = request.LastPeriodStart.HasValue ? DateTime.SpecifyKind(request.LastPeriodStart.Value, DateTimeKind.Utc) : null,
            LastPeriodEnd = request.LastPeriodEnd.HasValue ? DateTime.SpecifyKind(request.LastPeriodEnd.Value, DateTimeKind.Utc) : null,
            TypicalCycleRegularity = request.TypicalCycleRegularity,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Runners.Add(runner);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Profile created successfully for user {UserId}, runner {RunnerId}", userId, runner.Id);

        return CreatedAtAction(
            nameof(GetProfile),
            new ProfileResponse
            {
                Id = runner.Id,
                UserId = runner.UserId,
                Name = runner.Name,
                DateOfBirth = runner.DateOfBirth,
                FitnessLevel = runner.FitnessLevel,
                TypicalWeeklyMileage = runner.TypicalWeeklyMileage,
                DistanceUnit = runner.DistanceUnit,
                FiveKPR = runner.FiveKPR,
                TenKPR = runner.TenKPR,
                HalfMarathonPR = runner.HalfMarathonPR,
                MarathonPR = runner.MarathonPR,
                CycleLength = runner.CycleLength,
                LastPeriodStart = runner.LastPeriodStart,
                LastPeriodEnd = runner.LastPeriodEnd,
                TypicalCycleRegularity = runner.TypicalCycleRegularity,
                CreatedAt = runner.CreatedAt
            });
    }

    /// <summary>
    /// Updates the runner profile for the authenticated user.
    /// Validates cycle length is between 21-45 days.
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] CreateProfileRequest request)
    {
        var userId = GetAuthenticatedUserId();

        _logger.LogInformation("Updating profile for user {UserId}", userId);

        var existingRunner = await _context.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (existingRunner == null)
        {
            return NotFound(new { message = "Profile not found. Use POST to create." });
        }

        // Validate cycle length if provided
        if (request.CycleLength.HasValue && (request.CycleLength.Value < 21 || request.CycleLength.Value > 45))
        {
            return BadRequest(new { message = "Cycle length must be between 21 and 45 days." });
        }

        // Update all profile fields
        existingRunner.Name = request.Name;
        existingRunner.DateOfBirth = request.DateOfBirth.HasValue
            ? DateTime.SpecifyKind(request.DateOfBirth.Value, DateTimeKind.Utc) : null;
        existingRunner.FitnessLevel = request.FitnessLevel;
        existingRunner.TypicalWeeklyMileage = request.TypicalWeeklyMileage;
        existingRunner.DistanceUnit = request.DistanceUnit;
        existingRunner.FiveKPR = request.FiveKPR;
        existingRunner.TenKPR = request.TenKPR;
        existingRunner.HalfMarathonPR = request.HalfMarathonPR;
        existingRunner.MarathonPR = request.MarathonPR;
        existingRunner.CycleLength = request.CycleLength;
        existingRunner.LastPeriodStart = request.LastPeriodStart.HasValue
            ? DateTime.SpecifyKind(request.LastPeriodStart.Value, DateTimeKind.Utc) : null;
        existingRunner.LastPeriodEnd = request.LastPeriodEnd.HasValue
            ? DateTime.SpecifyKind(request.LastPeriodEnd.Value, DateTimeKind.Utc) : null;
        existingRunner.TypicalCycleRegularity = request.TypicalCycleRegularity;
        existingRunner.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Profile updated successfully for user {UserId}, runner {RunnerId}", userId, existingRunner.Id);

        return Ok(new ProfileResponse
        {
            Id = existingRunner.Id,
            UserId = existingRunner.UserId,
            Name = existingRunner.Name,
            DateOfBirth = existingRunner.DateOfBirth,
            FitnessLevel = existingRunner.FitnessLevel,
            TypicalWeeklyMileage = existingRunner.TypicalWeeklyMileage,
            DistanceUnit = existingRunner.DistanceUnit,
            FiveKPR = existingRunner.FiveKPR,
            TenKPR = existingRunner.TenKPR,
            HalfMarathonPR = existingRunner.HalfMarathonPR,
            MarathonPR = existingRunner.MarathonPR,
            CycleLength = existingRunner.CycleLength,
            LastPeriodStart = existingRunner.LastPeriodStart,
            LastPeriodEnd = existingRunner.LastPeriodEnd,
            TypicalCycleRegularity = existingRunner.TypicalCycleRegularity,
            CreatedAt = existingRunner.CreatedAt
        });
    }

    /// <summary>
    /// Retrieves the runner profile for the authenticated user.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetAuthenticatedUserId();

        var runner = await _context.Runners
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (runner == null)
        {
            return NotFound(new { message = "Profile not found. Please create a profile first." });
        }

        return Ok(new ProfileResponse
        {
            Id = runner.Id,
            UserId = runner.UserId,
            Name = runner.Name,
            DateOfBirth = runner.DateOfBirth,
            FitnessLevel = runner.FitnessLevel,
            TypicalWeeklyMileage = runner.TypicalWeeklyMileage,
            DistanceUnit = runner.DistanceUnit,
            FiveKPR = runner.FiveKPR,
            TenKPR = runner.TenKPR,
            HalfMarathonPR = runner.HalfMarathonPR,
            MarathonPR = runner.MarathonPR,
            CycleLength = runner.CycleLength,
            LastPeriodStart = runner.LastPeriodStart,
            LastPeriodEnd = runner.LastPeriodEnd,
            TypicalCycleRegularity = runner.TypicalCycleRegularity,
            CreatedAt = runner.CreatedAt
        });
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
/// Request to create a runner profile.
/// </summary>
public class CreateProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public FitnessLevel FitnessLevel { get; set; }
    public decimal? TypicalWeeklyMileage { get; set; }
    public DistanceUnit DistanceUnit { get; set; } = DistanceUnit.Kilometers;

    // Personal Records
    public TimeSpan? FiveKPR { get; set; }
    public TimeSpan? TenKPR { get; set; }
    public TimeSpan? HalfMarathonPR { get; set; }
    public TimeSpan? MarathonPR { get; set; }

    // Cycle information
    public int? CycleLength { get; set; } // 21-45 days
    public DateTime? LastPeriodStart { get; set; }
    public DateTime? LastPeriodEnd { get; set; }
    public CycleRegularity TypicalCycleRegularity { get; set; } = CycleRegularity.Regular;
}

/// <summary>
/// Response containing runner profile data.
/// </summary>
public class ProfileResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public FitnessLevel FitnessLevel { get; set; }
    public decimal? TypicalWeeklyMileage { get; set; }
    public DistanceUnit DistanceUnit { get; set; }

    public TimeSpan? FiveKPR { get; set; }
    public TimeSpan? TenKPR { get; set; }
    public TimeSpan? HalfMarathonPR { get; set; }
    public TimeSpan? MarathonPR { get; set; }

    public int? CycleLength { get; set; }
    public DateTime? LastPeriodStart { get; set; }
    public DateTime? LastPeriodEnd { get; set; }
    public CycleRegularity TypicalCycleRegularity { get; set; }
    public DateTime CreatedAt { get; set; }
}
