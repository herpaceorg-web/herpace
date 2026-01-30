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

    /// <summary>
    /// Recalculates a portion of an existing training plan based on recent performance.
    /// Used for adaptive plan adjustment when user deviates from original plan.
    /// </summary>
    /// <param name="request">Recalculation request with historical context and updated parameters.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Regenerated sessions for the specified date range.</returns>
    Task<GeneratedPlanDto> RecalculatePlanAsync(
        PlanRecalculationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a user-friendly summary of plan recalculation adjustments.
    /// Analyzes performance patterns and explains changes in supportive, hormone-aware language.
    /// </summary>
    /// <param name="request">Recalculation request with historical context and adjustments made.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>3-4 sentence summary for user display.</returns>
    Task<string> GenerateRecalculationSummaryAsync(
        PlanRecalculationRequest request,
        CancellationToken cancellationToken = default);
}
