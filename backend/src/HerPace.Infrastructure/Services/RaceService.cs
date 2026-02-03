using HerPace.Core.Entities;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HerPace.Infrastructure.Services;

/// <summary>
/// Service for managing race goals with validation logic.
/// </summary>
public class RaceService : IRaceService
{
    private readonly HerPaceDbContext _context;
    private const int MinimumDaysBeforeRace = 7; // FR-016: Minimum 7 days to allow training plan

    public RaceService(HerPaceDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Creates a new race for a runner with FR-016 validation.
    /// </summary>
    public async Task<Race> CreateRaceAsync(Race race)
    {
        // Validate TrainingStartDate if provided
        if (race.TrainingStartDate.HasValue)
        {
            // Must be at least tomorrow
            var tomorrow = DateTime.UtcNow.Date.AddDays(1);
            if (race.TrainingStartDate.Value.Date < tomorrow)
            {
                throw new InvalidOperationException(
                    $"Training start date must be at least tomorrow ({tomorrow:yyyy-MM-dd}).");
            }

            // Must be before race date
            if (race.TrainingStartDate.Value.Date >= race.RaceDate.Date)
            {
                throw new InvalidOperationException(
                    "Training start date must be before the race date.");
            }
        }

        // FR-016: Validate race date is at least 7 days in the future
        if (!ValidateRaceDate(race.RaceDate))
        {
            throw new InvalidOperationException(
                $"Race date must be at least {MinimumDaysBeforeRace} days in the future. " +
                $"Please select a date on or after {DateTime.UtcNow.AddDays(MinimumDaysBeforeRace):yyyy-MM-dd}.");
        }

        race.Id = Guid.NewGuid();
        race.TrainingStartDate ??= DateTime.UtcNow.Date.AddDays(1); // Default to tomorrow
        race.CreatedAt = DateTime.UtcNow;
        race.UpdatedAt = DateTime.UtcNow;

        _context.Races.Add(race);
        await _context.SaveChangesAsync();

        return race;
    }

    /// <summary>
    /// Validates that a race date meets the minimum future date requirement (FR-016).
    /// </summary>
    public bool ValidateRaceDate(DateTime raceDate, DateTime? currentDate = null)
    {
        var now = currentDate ?? DateTime.UtcNow;
        var minimumRaceDate = now.Date.AddDays(MinimumDaysBeforeRace);

        return raceDate.Date >= minimumRaceDate;
    }

    /// <summary>
    /// Gets all races for a specific runner, ordered by race date.
    /// </summary>
    public async Task<List<Race>> GetRacesForRunnerAsync(Guid runnerId)
    {
        return await _context.Races
            .Where(r => r.RunnerId == runnerId)
            .OrderBy(r => r.RaceDate)
            .ToListAsync();
    }

    /// <summary>
    /// Gets a specific race by ID.
    /// </summary>
    public async Task<Race?> GetRaceByIdAsync(Guid raceId)
    {
        return await _context.Races
            .Include(r => r.TrainingPlan)
            .FirstOrDefaultAsync(r => r.Id == raceId);
    }

    /// <summary>
    /// Updates an existing race with FR-016 validation.
    /// </summary>
    public async Task<Race> UpdateRaceAsync(Race race)
    {
        // FR-016: Validate race date if it has changed
        if (!ValidateRaceDate(race.RaceDate))
        {
            throw new InvalidOperationException(
                $"Race date must be at least {MinimumDaysBeforeRace} days in the future. " +
                $"Please select a date on or after {DateTime.UtcNow.AddDays(MinimumDaysBeforeRace):yyyy-MM-dd}.");
        }

        race.UpdatedAt = DateTime.UtcNow;

        _context.Races.Update(race);
        await _context.SaveChangesAsync();

        return race;
    }
}
