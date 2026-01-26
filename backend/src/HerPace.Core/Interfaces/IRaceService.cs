using HerPace.Core.Entities;

namespace HerPace.Core.Interfaces;

/// <summary>
/// Service for managing race goals and validation.
/// </summary>
public interface IRaceService
{
    /// <summary>
    /// Creates a new race for a runner with validation.
    /// </summary>
    /// <param name="race">Race entity to create</param>
    /// <returns>Created race with generated ID</returns>
    /// <exception cref="InvalidOperationException">Thrown if validation fails</exception>
    Task<Race> CreateRaceAsync(Race race);

    /// <summary>
    /// Validates that a race date meets the minimum future date requirement (FR-016).
    /// Race must be at least 7 days in the future to allow for proper training plan.
    /// </summary>
    /// <param name="raceDate">Proposed race date</param>
    /// <param name="currentDate">Current date (defaults to today, overridable for testing)</param>
    /// <returns>True if valid, false otherwise</returns>
    bool ValidateRaceDate(DateTime raceDate, DateTime? currentDate = null);

    /// <summary>
    /// Gets all races for a specific runner.
    /// </summary>
    /// <param name="runnerId">Runner ID</param>
    /// <returns>List of races ordered by race date</returns>
    Task<List<Race>> GetRacesForRunnerAsync(Guid runnerId);

    /// <summary>
    /// Gets a specific race by ID.
    /// </summary>
    /// <param name="raceId">Race ID</param>
    /// <returns>Race entity or null if not found</returns>
    Task<Race?> GetRaceByIdAsync(Guid raceId);

    /// <summary>
    /// Updates an existing race.
    /// </summary>
    /// <param name="race">Race entity with updated values</param>
    /// <returns>Updated race</returns>
    Task<Race> UpdateRaceAsync(Race race);
}
