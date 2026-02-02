using HerPace.Core.Enums;

namespace HerPace.Core.DTOs;

/// <summary>
/// Request to log race result.
/// </summary>
public class LogRaceResultRequest
{
    /// <summary>
    /// The completion status of the race (Completed, DNS, DNF).
    /// </summary>
    public RaceCompletionStatus CompletionStatus { get; set; }

    /// <summary>
    /// Actual finish time (required if CompletionStatus is Completed).
    /// TimeSpan format.
    /// </summary>
    public TimeSpan? FinishTime { get; set; }
}

/// <summary>
/// Response after logging race result.
/// </summary>
public class LogRaceResultResponse
{
    public Guid RaceId { get; set; }
    public RaceCompletionStatus CompletionStatus { get; set; }
    public TimeSpan? FinishTime { get; set; }
    public DateTime LoggedAt { get; set; }

    /// <summary>
    /// Indicates whether the training plan was automatically archived.
    /// </summary>
    public bool PlanArchived { get; set; }

    public string Message { get; set; } = string.Empty;
}
