using System.Text.Json;
using HerPace.Core;
using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.Services;

/// <summary>
/// Service for managing training session completion and tracking.
/// </summary>
public class SessionCompletionService : ISessionCompletionService
{
    private readonly HerPaceDbContext _context;
    private readonly IPlanAdaptationService _planAdaptationService;
    private readonly ILogger<SessionCompletionService> _logger;

    public SessionCompletionService(
        HerPaceDbContext context,
        IPlanAdaptationService planAdaptationService,
        ILogger<SessionCompletionService> logger)
    {
        _context = context;
        _planAdaptationService = planAdaptationService;
        _logger = logger;
    }

    public async Task<SessionCompletionResult> CompleteSessionAsync(
        Guid sessionId,
        Guid runnerId,
        CompleteSessionRequest request)
    {
        _logger.LogInformation("Completing session {SessionId} for runner {RunnerId}", sessionId, runnerId);

        // Get session and verify ownership
        var session = await _context.TrainingSessions
            .Include(s => s.TrainingPlan)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
        {
            return new SessionCompletionResult
            {
                Success = false,
                ErrorMessage = "Session not found"
            };
        }

        if (session.TrainingPlan.RunnerId != runnerId)
        {
            return new SessionCompletionResult
            {
                Success = false,
                ErrorMessage = "Session does not belong to this runner"
            };
        }

        // Update session with completion data
        session.CompletedAt = DateTime.UtcNow;
        session.ActualDistance = request.ActualDistance;
        session.ActualDuration = request.ActualDuration;
        session.RPE = request.RPE;
        session.UserNotes = request.UserNotes;
        session.IsSkipped = false;
        session.SkipReason = null;
        session.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Session {SessionId} completed. WasModified: {WasModified}",
            sessionId,
            session.WasModified);

        // Check if recalculation should be triggered
        var recalculationTriggered = await _planAdaptationService
            .CheckAndTriggerRecalculationAsync(session.TrainingPlanId);

        return new SessionCompletionResult
        {
            Success = true,
            RecalculationTriggered = recalculationTriggered
        };
    }

    public async Task<SessionCompletionResult> SkipSessionAsync(
        Guid sessionId,
        Guid runnerId,
        SkipSessionRequest request)
    {
        _logger.LogInformation("Skipping session {SessionId} for runner {RunnerId}", sessionId, runnerId);

        // Get session and verify ownership
        var session = await _context.TrainingSessions
            .Include(s => s.TrainingPlan)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
        {
            return new SessionCompletionResult
            {
                Success = false,
                ErrorMessage = "Session not found"
            };
        }

        if (session.TrainingPlan.RunnerId != runnerId)
        {
            return new SessionCompletionResult
            {
                Success = false,
                ErrorMessage = "Session does not belong to this runner"
            };
        }

        // Mark session as skipped
        session.IsSkipped = true;
        session.SkipReason = request.SkipReason;
        session.CompletedAt = DateTime.UtcNow; // Still track when it was skipped
        session.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Session {SessionId} marked as skipped", sessionId);

        // Check if recalculation should be triggered
        var recalculationTriggered = await _planAdaptationService
            .CheckAndTriggerRecalculationAsync(session.TrainingPlanId);

        return new SessionCompletionResult
        {
            Success = true,
            RecalculationTriggered = recalculationTriggered
        };
    }

    public async Task<List<SessionDetailDto>> GetUpcomingSessionsAsync(
        Guid runnerId,
        int count,
        string? clientDate = null)
    {
        DateTime today;
        if (!string.IsNullOrEmpty(clientDate) && DateTime.TryParse(clientDate, out var parsed))
            today = DateTime.SpecifyKind(parsed.Date, DateTimeKind.Utc);
        else
            today = DateTime.UtcNow.Date;

        var sessions = await _context.TrainingSessions
            .Include(s => s.TrainingPlan)
            .Where(s => s.TrainingPlan.RunnerId == runnerId &&
                       s.TrainingPlan.Status == PlanStatus.Active &&
                       s.ScheduledDate > today)
            .OrderBy(s => s.ScheduledDate)
            .Take(count)
            .ToListAsync();

        return sessions.Select(MapToSessionDetailDto).ToList();
    }

    public async Task<SessionDetailDto?> GetSessionDetailAsync(
        Guid sessionId,
        Guid runnerId)
    {
        var session = await _context.TrainingSessions
            .Include(s => s.TrainingPlan)
            .FirstOrDefaultAsync(s => s.Id == sessionId &&
                                     s.TrainingPlan.RunnerId == runnerId);

        return session == null ? null : MapToSessionDetailDto(session);
    }

    private SessionDetailDto MapToSessionDetailDto(Core.Entities.TrainingSession session)
    {
        // Parse workout tips from JSON
        var workoutTips = new List<string>();
        if (!string.IsNullOrEmpty(session.WorkoutTips))
        {
            try
            {
                var parsedTips = JsonSerializer.Deserialize<List<string>>(session.WorkoutTips);
                if (parsedTips != null)
                {
                    workoutTips = parsedTips;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse WorkoutTips JSON for session {SessionId}", session.Id);
            }
        }

        // Calculate session progress in phase (requires additional query)
        int? sessionNumberInPhase = null;
        int? totalSessionsInPhase = null;
        if (session.CyclePhase.HasValue)
        {
            var phaseProgress = CalculatePhaseProgress(session);
            sessionNumberInPhase = phaseProgress.SessionNumber;
            totalSessionsInPhase = phaseProgress.TotalSessions;
        }

        // Calculate menstruation day if in menstrual phase
        int? menstruationDay = null;
        if (session.CyclePhase == CyclePhase.Menstrual)
        {
            menstruationDay = CalculateMenstruationDay(session);
        }

        return new SessionDetailDto
        {
            Id = session.Id,
            SessionName = session.SessionName,
            ScheduledDate = session.ScheduledDate,
            WorkoutType = session.WorkoutType,
            WarmUp = session.WarmUp,
            Recovery = session.Recovery,
            SessionDescription = session.SessionDescription,
            DurationMinutes = session.DurationMinutes,
            Distance = session.Distance,
            IntensityLevel = session.IntensityLevel,
            HRZones = session.HRZones,
            CyclePhase = session.CyclePhase,
            PhaseGuidance = session.PhaseGuidance,
            SessionNumberInPhase = sessionNumberInPhase,
            TotalSessionsInPhase = totalSessionsInPhase,
            MenstruationDay = menstruationDay,
            WorkoutTips = workoutTips,
            CompletedAt = session.CompletedAt,
            ActualDistance = session.ActualDistance,
            ActualDuration = session.ActualDuration,
            RPE = session.RPE,
            UserNotes = session.UserNotes,
            IsSkipped = session.IsSkipped,
            SkipReason = session.SkipReason,
            TrainingStage = TrainingStageLibrary.CalculateStage(session.ScheduledDate, session.TrainingPlan.StartDate, session.TrainingPlan.EndDate),
            TrainingStageInfo = TrainingStageLibrary.GetInfo(TrainingStageLibrary.CalculateStage(session.ScheduledDate, session.TrainingPlan.StartDate, session.TrainingPlan.EndDate)),
            WasModified = session.WasModified,
            IsCompleted = session.CompletedAt.HasValue && !session.IsSkipped
        };
    }

    private (int SessionNumber, int TotalSessions) CalculatePhaseProgress(Core.Entities.TrainingSession session)
    {
        if (!session.CyclePhase.HasValue)
        {
            return (0, 0);
        }

        // Get all sessions in the same plan with the same cycle phase
        var sessionsInPhase = _context.TrainingSessions
            .Where(s => s.TrainingPlanId == session.TrainingPlanId &&
                       s.CyclePhase == session.CyclePhase)
            .OrderBy(s => s.ScheduledDate)
            .ToList();

        var totalSessions = sessionsInPhase.Count;
        var sessionNumber = sessionsInPhase.FindIndex(s => s.Id == session.Id) + 1;

        return (sessionNumber, totalSessions);
    }

    private int? CalculateMenstruationDay(Core.Entities.TrainingSession session)
    {
        // Get the runner to access cycle information
        var runner = _context.Runners
            .FirstOrDefault(r => r.Id == session.TrainingPlan.RunnerId);

        if (runner == null || !runner.LastPeriodStart.HasValue || !runner.CycleLength.HasValue)
        {
            return null;
        }

        // Calculate which day of menstruation this session falls on
        // Menstrual phase is typically days 1-5 of the cycle
        var daysSinceLastPeriod = (session.ScheduledDate.Date - runner.LastPeriodStart.Value.Date).Days;
        var currentDayInCycle = (daysSinceLastPeriod % runner.CycleLength.Value) + 1;

        // Only return day number if within menstrual phase (typically days 1-5)
        if (currentDayInCycle <= 5)
        {
            return currentDayInCycle;
        }

        return null;
    }
}
