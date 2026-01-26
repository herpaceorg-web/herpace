using HerPace.Core.Entities;
using HerPace.Infrastructure.AI.DTOs;

namespace HerPace.Core.Interfaces;

/// <summary>
/// Orchestrates training plan generation including cycle calculation,
/// AI integration, and business rule enforcement.
/// </summary>
public interface IPlanGenerationService
{
    /// <summary>
    /// Generates a new training plan for a race.
    /// Enforces FR-017 (single active plan per runner).
    /// </summary>
    /// <param name="raceId">Race ID to generate plan for</param>
    /// <param name="runnerId">Runner ID (for validation)</param>
    /// <returns>Generated training plan with sessions</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown if runner already has an active plan (FR-017) or if race not found
    /// </exception>
    Task<TrainingPlan> GeneratePlanAsync(Guid raceId, Guid runnerId);

    /// <summary>
    /// Validates an AI-generated plan response against schema requirements (FR-021).
    /// Ensures all required fields are present and sessions are valid.
    /// </summary>
    /// <param name="aiResponse">AI-generated plan DTO</param>
    /// <returns>True if valid, false otherwise</returns>
    bool ValidateAIResponse(GeneratedPlanDto aiResponse);

    /// <summary>
    /// Checks if a runner already has an active training plan (FR-017).
    /// </summary>
    /// <param name="runnerId">Runner ID</param>
    /// <returns>True if active plan exists, false otherwise</returns>
    Task<bool> HasActivePlanAsync(Guid runnerId);

    /// <summary>
    /// Archives the current active plan for a runner (sets status to Archived).
    /// Used when generating a new plan.
    /// </summary>
    /// <param name="runnerId">Runner ID</param>
    Task ArchiveActivePlanAsync(Guid runnerId);
}
