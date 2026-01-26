using HerPace.Core.DTOs;

namespace HerPace.Core.Interfaces;

/// <summary>
/// Interface for AI-powered training plan generation.
/// Abstracts the AI provider (Gemini, Claude, GPT-4, or fallback templates).
/// </summary>
public interface IAIPlanGenerator
{
    /// <summary>
    /// Generates a personalized training plan based on runner profile, race goal, and cycle phases.
    /// </summary>
    /// <param name="request">Plan generation request with runner, race, and cycle data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Generated training plan with sessions.</returns>
    Task<GeneratedPlanDto> GeneratePlanAsync(
        PlanGenerationRequest request,
        CancellationToken cancellationToken = default);
}
