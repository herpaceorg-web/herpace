namespace HerPace.Core.Enums;

/// <summary>
/// Status of a training plan.
/// </summary>
public enum PlanStatus
{
    Active,     // Currently being followed
    Paused,     // Temporarily paused by user
    Archived,   // Replaced by a new plan
    Completed   // Race completed
}
