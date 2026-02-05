namespace HerPace.Core.DTOs;

/// <summary>
/// DTO representing a training plan adaptation history entry for API responses.
/// Contains details about when and why a plan was adapted, plus what changed.
/// </summary>
public class AdaptationHistoryDto
{
    public Guid Id { get; set; }
    public DateTime AdaptedAt { get; set; }
    public bool IsViewed { get; set; }
    public string Summary { get; set; } = string.Empty;
    public int SessionsAffectedCount { get; set; }
    public string TriggerReason { get; set; } = string.Empty;
    public List<SessionChangeDto> Changes { get; set; } = new();
}

/// <summary>
/// DTO representing the latest adaptation info included in plan summary.
/// Used to display before/after comparison in the summary modal.
/// </summary>
public class LatestAdaptationDto
{
    public DateTime AdaptedAt { get; set; }
    public List<SessionChangeDto> SessionChanges { get; set; } = new();
}
