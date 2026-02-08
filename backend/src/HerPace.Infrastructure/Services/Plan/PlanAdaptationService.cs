using System.Text.Json;
using Hangfire;
using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.Services.Plan;

/// <summary>
/// Service for adaptive training plan recalculation based on user performance.
/// </summary>
public class PlanAdaptationService : IPlanAdaptationService
{
    private readonly HerPaceDbContext _context;
    private readonly IAIPlanGenerator _aiPlanGenerator;
    private readonly ICyclePhaseCalculator _cyclePhaseCalculator;
    private readonly ILogger<PlanAdaptationService> _logger;

    public PlanAdaptationService(
        HerPaceDbContext context,
        IAIPlanGenerator aiPlanGenerator,
        ICyclePhaseCalculator cyclePhaseCalculator,
        ILogger<PlanAdaptationService> logger)
    {
        _context = context;
        _aiPlanGenerator = aiPlanGenerator;
        _cyclePhaseCalculator = cyclePhaseCalculator;
        _logger = logger;
    }

    public async Task<bool> CheckAndTriggerRecalculationAsync(Guid trainingPlanId)
    {
        _logger.LogInformation("Checking if recalculation needed for plan {PlanId}", trainingPlanId);

        var plan = await _context.TrainingPlans
            .Include(tp => tp.Sessions)
            .Include(tp => tp.Race)
            .Include(tp => tp.Runner)
            .FirstOrDefaultAsync(tp => tp.Id == trainingPlanId);

        if (plan == null || plan.Status != PlanStatus.Active)
        {
            _logger.LogWarning("Plan {PlanId} not found or not active", trainingPlanId);
            return false;
        }

        // Get last 7 completed/skipped sessions (including future skipped sessions for demo)
        // This allows users to skip future sessions and trigger recalculation
        var recentSessions = plan.Sessions
            .Where(s => s.CompletedAt.HasValue || s.IsSkipped)
            .OrderByDescending(s => s.ScheduledDate)
            .Take(7)
            .ToList();

        // Need at least 3 sessions to establish a pattern
        if (recentSessions.Count < 3)
        {
            _logger.LogInformation(
                "Plan {PlanId}: Only {Count} sessions logged, need at least 3 for pattern detection",
                trainingPlanId,
                recentSessions.Count);
            return false;
        }

        // Calculate threshold (sessions that are skipped OR modified)
        var offTrackCount = recentSessions.Count(s => s.IsSkipped || s.WasModified);
        var offTrackPercentage = (decimal)offTrackCount / recentSessions.Count;

        _logger.LogInformation(
            "Plan {PlanId}: {OffTrackCount}/{TotalCount} sessions off-track ({Percentage:P0})",
            trainingPlanId,
            offTrackCount,
            recentSessions.Count,
            offTrackPercentage);

        // Check if threshold met (20%)
        if (offTrackPercentage < 0.20m)
        {
            _logger.LogInformation("Plan {PlanId}: Threshold not met, no recalculation needed", trainingPlanId);
            return false;
        }

        // COMMENTED OUT FOR DEMO: Cooldown period restriction
        // Cooldown: Don't recalculate if last recalc was within 7 days
        // if (plan.LastRecalculatedAt.HasValue &&
        //     (DateTime.UtcNow - plan.LastRecalculatedAt.Value).Days < 7)
        // {
        //     _logger.LogInformation(
        //         "Plan {PlanId}: Last recalculation was {Days} days ago, cooldown period active",
        //         trainingPlanId,
        //         (DateTime.UtcNow - plan.LastRecalculatedAt.Value).Days);
        //     return false;
        // }

        // COMMENTED OUT FOR DEMO: Early plan exemption restriction
        // Early plan exemption: Don't recalculate within first 14 days
        // if ((DateTime.UtcNow - plan.StartDate).Days < 14)
        // {
        //     _logger.LogInformation(
        //         "Plan {PlanId}: Plan is only {Days} days old, too early for recalculation",
        //         trainingPlanId,
        //         (DateTime.UtcNow - plan.StartDate).Days);
        //     return false;
        // }

        // Check if recalculation already in progress
        if (!string.IsNullOrEmpty(plan.LastRecalculationJobId))
        {
            try
            {
                var jobState = JobStorage.Current
                    .GetConnection()
                    .GetStateData(plan.LastRecalculationJobId);

                if (jobState?.Name == "Processing" || jobState?.Name == "Enqueued")
                {
                    _logger.LogInformation(
                        "Recalculation already in progress for plan {PlanId} (Job {JobId})",
                        trainingPlanId,
                        plan.LastRecalculationJobId);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error checking job state for {JobId}", plan.LastRecalculationJobId);
                // Continue with new job if we can't verify old job status
            }
        }

        // Generate preview of proposed changes (run AI now, apply later if confirmed)
        _logger.LogInformation("Generating recalculation preview for plan {PlanId}", trainingPlanId);

        try
        {
            var today = DateTime.UtcNow.Date;

            // Get next 7 future sessions
            var futureSessions = plan.Sessions
                .Where(s => s.ScheduledDate > today)
                .OrderBy(s => s.ScheduledDate)
                .Take(7)
                .ToList();

            if (!futureSessions.Any())
            {
                _logger.LogWarning("No future sessions to preview for plan {PlanId}", trainingPlanId);
                return false;
            }

            // Build historical context
            var recentContext = recentSessions.Select(s => new Core.DTOs.CompletedSessionContext
            {
                ScheduledDate = s.ScheduledDate,
                WorkoutType = s.WorkoutType,
                PlannedDuration = s.DurationMinutes,
                PlannedDistance = s.Distance,
                IsSkipped = s.IsSkipped,
                SkipReason = s.SkipReason,
                ActualDuration = s.ActualDuration,
                ActualDistance = s.ActualDistance,
                RPE = s.RPE,
                UserNotes = s.UserNotes,
                WasModified = s.WasModified
            }).ToList();

            // Recalculate cycle phases for future dates
            Dictionary<DateTime, CyclePhase>? updatedCyclePhases = null;
            if (plan.Runner.LastPeriodStart.HasValue && plan.Runner.CycleLength.HasValue)
            {
                updatedCyclePhases = new Dictionary<DateTime, CyclePhase>();
                var startDate = futureSessions.First().ScheduledDate;
                var endDate = futureSessions.Last().ScheduledDate;

                for (var date = startDate; date <= endDate; date = date.AddDays(1))
                {
                    var phase = _cyclePhaseCalculator.CalculateCurrentPhase(
                        plan.Runner.LastPeriodStart.Value,
                        plan.Runner.CycleLength.Value,
                        date);
                    updatedCyclePhases[date] = phase;
                }
            }

            // Build recalculation request
            var recalcRequest = new Core.DTOs.PlanRecalculationRequest
            {
                TrainingPlanId = plan.Id,
                PlanName = plan.PlanName,
                RaceName = plan.Race.RaceName,
                RaceDate = plan.Race.RaceDate,
                Distance = plan.Race.Distance,
                DistanceType = plan.Race.DistanceType,
                GoalTime = plan.Race.GoalTime,
                FitnessLevel = plan.Runner.FitnessLevel,
                TypicalWeeklyMileage = plan.Runner.TypicalWeeklyMileage,
                CycleLength = plan.Runner.CycleLength,
                LastPeriodStart = plan.Runner.LastPeriodStart,
                TypicalCycleRegularity = plan.Runner.TypicalCycleRegularity,
                RecalculationStartDate = futureSessions.First().ScheduledDate,
                RecalculationEndDate = futureSessions.Last().ScheduledDate,
                SessionsToRecalculate = futureSessions.Count,
                RecentSessions = recentContext,
                UpdatedCyclePhases = updatedCyclePhases
            };

            // Call AI generator to get proposed changes
            _logger.LogInformation("Calling AI generator for preview");
            var recalculatedPlan = await _aiPlanGenerator.RecalculatePlanAsync(recalcRequest);

            // Build preview changes (before/after comparison)
            var previewChanges = futureSessions.Select(s =>
            {
                var aiSession = recalculatedPlan.Sessions
                    .FirstOrDefault(ai => ai.ScheduledDate.Date == s.ScheduledDate.Date);

                return new SessionChangeDto
                {
                    SessionId = s.Id,
                    ScheduledDate = s.ScheduledDate,
                    SessionName = aiSession?.SessionName ?? s.SessionName,
                    OldDistance = s.Distance,
                    OldDuration = s.DurationMinutes,
                    OldWorkoutType = s.WorkoutType,
                    OldIntensityLevel = s.IntensityLevel,
                    NewDistance = aiSession?.Distance ?? s.Distance,
                    NewDuration = aiSession?.DurationMinutes ?? s.DurationMinutes,
                    NewWorkoutType = aiSession?.WorkoutType ?? s.WorkoutType,
                    NewIntensityLevel = aiSession?.IntensityLevel ?? s.IntensityLevel
                };
            }).ToList();

            // Generate AI summary for preview
            string previewSummary;
            try
            {
                previewSummary = await _aiPlanGenerator.GenerateRecalculationSummaryAsync(recalcRequest, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error generating preview summary, using default");
                previewSummary = "Based on your recent training, we recommend adjusting your upcoming sessions.";
            }

            // Store preview data
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            plan.PendingRecalculationPreviewJson = JsonSerializer.Serialize(previewChanges, jsonOptions);
            plan.PendingRecalculationSummary = previewSummary;
            plan.PreviewGeneratedAt = DateTime.UtcNow;
            plan.PendingRecalculationConfirmation = true;
            plan.RecalculationConfirmationRequestedAt = DateTime.UtcNow;
            plan.RecalculationConfirmationRespondedAt = null;
            plan.RecalculationConfirmationAccepted = null;
            plan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Preview generated for plan {PlanId}. {Count} sessions in preview, {AffectedCount} with changes.",
                trainingPlanId,
                previewChanges.Count,
                previewChanges.Count(c => c.HasChanges()));

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating preview for plan {PlanId}", trainingPlanId);
            // Don't set pending confirmation if preview generation failed
            return false;
        }
    }

    public async Task RecalculatePlanAsync(Guid trainingPlanId)
    {
        _logger.LogInformation("Starting recalculation for plan {PlanId}", trainingPlanId);

        var plan = await _context.TrainingPlans
            .Include(tp => tp.Sessions)
            .Include(tp => tp.Race)
            .Include(tp => tp.Runner)
            .FirstOrDefaultAsync(tp => tp.Id == trainingPlanId);

        if (plan == null)
        {
            _logger.LogError("Plan {PlanId} not found for recalculation", trainingPlanId);
            return;
        }

        try
        {
            var today = DateTime.UtcNow.Date;

            // Step 1: Identify next 7 future sessions (after today)
            var futureSessions = plan.Sessions
                .Where(s => s.ScheduledDate > today)
                .OrderBy(s => s.ScheduledDate)
                .Take(7)
                .ToList();

            if (!futureSessions.Any())
            {
                _logger.LogWarning("No future sessions to recalculate for plan {PlanId}", trainingPlanId);
                plan.LastRecalculatedAt = DateTime.UtcNow;
                plan.LastRecalculationJobId = null;
                await _context.SaveChangesAsync();
                return;
            }

            // Step 2: Get last 7 completed/skipped sessions for context
            var recentSessions = plan.Sessions
                .Where(s => s.ScheduledDate < today &&
                           (s.CompletedAt.HasValue || s.IsSkipped))
                .OrderByDescending(s => s.ScheduledDate)
                .Take(7)
                .ToList();

            _logger.LogInformation(
                "Recalculating {FutureCount} sessions based on {RecentCount} recent sessions",
                futureSessions.Count,
                recentSessions.Count);

            // Step 3: Build historical context for AI
            var recentContext = recentSessions.Select(s => new Core.DTOs.CompletedSessionContext
            {
                ScheduledDate = s.ScheduledDate,
                WorkoutType = s.WorkoutType,
                PlannedDuration = s.DurationMinutes,
                PlannedDistance = s.Distance,
                IsSkipped = s.IsSkipped,
                SkipReason = s.SkipReason,
                ActualDuration = s.ActualDuration,
                ActualDistance = s.ActualDistance,
                RPE = s.RPE,
                UserNotes = s.UserNotes,
                WasModified = s.WasModified
            }).ToList();

            // Step 4: Recalculate cycle phases for future dates
            Dictionary<DateTime, CyclePhase>? updatedCyclePhases = null;
            if (plan.Runner.LastPeriodStart.HasValue && plan.Runner.CycleLength.HasValue)
            {
                updatedCyclePhases = new Dictionary<DateTime, CyclePhase>();
                var startDate = futureSessions.First().ScheduledDate;
                var endDate = futureSessions.Last().ScheduledDate;

                for (var date = startDate; date <= endDate; date = date.AddDays(1))
                {
                    var phase = _cyclePhaseCalculator.CalculateCurrentPhase(
                        plan.Runner.LastPeriodStart.Value,
                        plan.Runner.CycleLength.Value,
                        date);

                    updatedCyclePhases[date] = phase;
                }

                _logger.LogInformation(
                    "Recalculated cycle phases for {Count} days",
                    updatedCyclePhases.Count);
            }

            // Step 5: Build recalculation request
            var recalcRequest = new Core.DTOs.PlanRecalculationRequest
            {
                TrainingPlanId = plan.Id,
                PlanName = plan.PlanName,
                RaceName = plan.Race.RaceName,
                RaceDate = plan.Race.RaceDate,
                Distance = plan.Race.Distance,
                DistanceType = plan.Race.DistanceType,
                GoalTime = plan.Race.GoalTime,
                FitnessLevel = plan.Runner.FitnessLevel,
                TypicalWeeklyMileage = plan.Runner.TypicalWeeklyMileage,
                CycleLength = plan.Runner.CycleLength,
                LastPeriodStart = plan.Runner.LastPeriodStart,
                TypicalCycleRegularity = plan.Runner.TypicalCycleRegularity,
                RecalculationStartDate = futureSessions.First().ScheduledDate,
                RecalculationEndDate = futureSessions.Last().ScheduledDate,
                SessionsToRecalculate = futureSessions.Count,
                RecentSessions = recentContext,
                UpdatedCyclePhases = updatedCyclePhases
            };

            // Step 6: Call AI generator for recalculation
            _logger.LogInformation("Calling AI generator for recalculation");
            var recalculatedPlan = await _aiPlanGenerator.RecalculatePlanAsync(recalcRequest);

            // Step 7a: Capture current session state before updates (for history)
            var changesList = futureSessions.Select(s => new SessionChangeDto
            {
                SessionId = s.Id,
                ScheduledDate = s.ScheduledDate,
                SessionName = s.SessionName,
                OldDistance = s.Distance,
                OldDuration = s.DurationMinutes,
                OldWorkoutType = s.WorkoutType,
                OldIntensityLevel = s.IntensityLevel
            }).ToList();

            // Step 7b: Update existing sessions in-place (preserve IDs)
            foreach (var existingSession in futureSessions)
            {
                var aiSession = recalculatedPlan.Sessions
                    .FirstOrDefault(s => s.ScheduledDate.Date == existingSession.ScheduledDate.Date);

                if (aiSession != null)
                {
                    // Update properties but keep same ID and TrainingPlanId
                    existingSession.SessionName = aiSession.SessionName;
                    existingSession.WorkoutType = aiSession.WorkoutType;
                    existingSession.WarmUp = aiSession.WarmUp;
                    existingSession.Recovery = aiSession.Recovery;
                    existingSession.SessionDescription = aiSession.SessionDescription;
                    existingSession.DurationMinutes = aiSession.DurationMinutes;
                    existingSession.Distance = aiSession.Distance;
                    existingSession.IntensityLevel = aiSession.IntensityLevel;
                    existingSession.HRZones = aiSession.HRZones;
                    existingSession.CyclePhase = aiSession.CyclePhase;
                    existingSession.PhaseGuidance = aiSession.PhaseGuidance;
                    existingSession.UpdatedAt = DateTime.UtcNow;

                    _logger.LogDebug(
                        "Updated session {SessionId} on {Date}",
                        existingSession.Id,
                        existingSession.ScheduledDate);
                }
                else
                {
                    _logger.LogWarning(
                        "No AI session found for existing session on {Date}",
                        existingSession.ScheduledDate);
                }
            }

            // Step 7c: Complete change records with new values
            foreach (var change in changesList)
            {
                var updated = futureSessions.First(s => s.Id == change.SessionId);
                change.NewDistance = updated.Distance;
                change.NewDuration = updated.DurationMinutes;
                change.NewWorkoutType = updated.WorkoutType;
                change.NewIntensityLevel = updated.IntensityLevel;
            }

            _logger.LogInformation(
                "Captured {Count} session changes for history",
                changesList.Count(c => c.HasChanges()));

            // Step 8: Generate AI summary of recalculation
            try
            {
                var summary = await _aiPlanGenerator.GenerateRecalculationSummaryAsync(recalcRequest, CancellationToken.None);
                plan.LastRecalculationSummary = summary;
                plan.RecalculationSummaryViewedAt = null; // Force display to user

                _logger.LogInformation(
                    "AI summary generated for plan {PlanId}. Summary length: {Length} characters",
                    trainingPlanId,
                    summary.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating AI summary for plan {PlanId}. Continuing without summary.", trainingPlanId);
                // Don't fail the entire recalculation if summary generation fails
                plan.LastRecalculationSummary = "Your training plan has been adjusted based on your recent performance.";
                plan.RecalculationSummaryViewedAt = null;
            }

            // Step 8b: Create history entry
            try
            {
                var historyEntry = new PlanAdaptationHistory
                {
                    Id = Guid.NewGuid(),
                    TrainingPlanId = plan.Id,
                    AdaptedAt = DateTime.UtcNow,
                    ViewedAt = null,
                    Summary = plan.LastRecalculationSummary ?? "Your training plan has been adjusted based on your recent performance.",
                    SessionsAffectedCount = changesList.Count(c => c.HasChanges()),
                    TriggerReason = "Training pattern deviation detected",
                    ChangesJson = JsonSerializer.Serialize(changesList, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    })
                };

                _context.PlanAdaptationHistory.Add(historyEntry);

                _logger.LogInformation(
                    "Created adaptation history entry {HistoryId} for plan {PlanId}",
                    historyEntry.Id,
                    trainingPlanId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating adaptation history for plan {PlanId}. Continuing without history.", trainingPlanId);
                // Don't fail the entire recalculation if history creation fails
            }

            // Step 9: Update plan timestamps
            plan.LastRecalculatedAt = DateTime.UtcNow;
            plan.LastRecalculationJobId = null; // Clear job ID
            plan.UpdatedAt = DateTime.UtcNow;

            // Step 10: Save changes
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Recalculation completed for plan {PlanId}. {Count} sessions updated.",
                trainingPlanId,
                futureSessions.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during recalculation for plan {PlanId}", trainingPlanId);

            // Clear job ID to allow retry
            plan.LastRecalculationJobId = null;
            await _context.SaveChangesAsync();

            throw; // Re-throw for Hangfire retry mechanism
        }
    }

    public async Task<bool> ConfirmRecalculationAsync(Guid trainingPlanId)
    {
        _logger.LogInformation("User confirming recalculation for plan {PlanId}", trainingPlanId);

        var plan = await _context.TrainingPlans
            .Include(tp => tp.Sessions)
            .FirstOrDefaultAsync(tp => tp.Id == trainingPlanId);

        if (plan == null || plan.Status != PlanStatus.Active || !plan.PendingRecalculationConfirmation)
        {
            _logger.LogWarning("Plan {PlanId} not found, not active, or no pending confirmation", trainingPlanId);
            return false;
        }

        // Check if we have a stored preview
        if (string.IsNullOrEmpty(plan.PendingRecalculationPreviewJson))
        {
            _logger.LogWarning("Plan {PlanId} has pending confirmation but no preview data", trainingPlanId);
            // Fall back to enqueuing a job
            var jobId = BackgroundJob.Enqueue<IPlanAdaptationService>(
                service => service.RecalculatePlanAsync(trainingPlanId));
            plan.LastRecalculationJobId = jobId;
            plan.LastRecalculationRequestedAt = DateTime.UtcNow;
            plan.PendingRecalculationConfirmation = false;
            plan.RecalculationConfirmationRespondedAt = DateTime.UtcNow;
            plan.RecalculationConfirmationAccepted = true;
            plan.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        try
        {
            // Deserialize stored preview
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var previewChanges = JsonSerializer.Deserialize<List<SessionChangeDto>>(
                plan.PendingRecalculationPreviewJson, jsonOptions);

            if (previewChanges == null || !previewChanges.Any())
            {
                _logger.LogWarning("Preview changes could not be deserialized for plan {PlanId}", trainingPlanId);
                return false;
            }

            // Apply changes to sessions
            foreach (var change in previewChanges)
            {
                var session = plan.Sessions.FirstOrDefault(s => s.Id == change.SessionId);
                if (session != null)
                {
                    session.Distance = change.NewDistance;
                    session.DurationMinutes = change.NewDuration;
                    session.WorkoutType = change.NewWorkoutType;
                    session.IntensityLevel = change.NewIntensityLevel;
                    session.SessionName = change.SessionName;
                    session.UpdatedAt = DateTime.UtcNow;

                    _logger.LogDebug(
                        "Applied preview change to session {SessionId} on {Date}",
                        session.Id,
                        session.ScheduledDate);
                }
            }

            // Create history entry
            var historyEntry = new PlanAdaptationHistory
            {
                Id = Guid.NewGuid(),
                TrainingPlanId = plan.Id,
                AdaptedAt = DateTime.UtcNow,
                ViewedAt = null,
                Summary = plan.PendingRecalculationSummary ?? "Your training plan has been adjusted based on your recent performance.",
                SessionsAffectedCount = previewChanges.Count(c => c.HasChanges()),
                TriggerReason = "Training pattern deviation detected",
                ChangesJson = plan.PendingRecalculationPreviewJson
            };
            _context.PlanAdaptationHistory.Add(historyEntry);

            // Update plan state
            plan.LastRecalculationSummary = plan.PendingRecalculationSummary;
            plan.RecalculationSummaryViewedAt = null;
            plan.LastRecalculatedAt = DateTime.UtcNow;
            plan.LastRecalculationJobId = null;
            plan.PendingRecalculationConfirmation = false;
            plan.RecalculationConfirmationRespondedAt = DateTime.UtcNow;
            plan.RecalculationConfirmationAccepted = true;

            // Clear preview data
            plan.PendingRecalculationPreviewJson = null;
            plan.PendingRecalculationSummary = null;
            plan.PreviewGeneratedAt = null;
            plan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Applied stored preview for plan {PlanId}. {Count} sessions updated.",
                trainingPlanId,
                previewChanges.Count(c => c.HasChanges()));

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying preview for plan {PlanId}", trainingPlanId);
            return false;
        }
    }

    public async Task<bool> DeclineRecalculationAsync(Guid trainingPlanId)
    {
        _logger.LogInformation("User declining recalculation for plan {PlanId}", trainingPlanId);

        var plan = await _context.TrainingPlans
            .FirstOrDefaultAsync(tp => tp.Id == trainingPlanId);

        if (plan == null)
        {
            _logger.LogWarning("Plan {PlanId} not found", trainingPlanId);
            return false;
        }

        // Clear pending confirmation state and preview data
        plan.PendingRecalculationConfirmation = false;
        plan.RecalculationConfirmationRespondedAt = DateTime.UtcNow;
        plan.RecalculationConfirmationAccepted = false;
        plan.PendingRecalculationPreviewJson = null;
        plan.PendingRecalculationSummary = null;
        plan.PreviewGeneratedAt = null;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Recalculation declined by user for plan {PlanId}. Preview data cleared.",
            trainingPlanId);

        return true;
    }
}
