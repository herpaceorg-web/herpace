namespace HerPace.Core.Enums;

/// <summary>
/// Status of race completion attempt.
/// </summary>
public enum RaceCompletionStatus
{
    /// <summary>
    /// Race has not been attempted yet (default state).
    /// </summary>
    NotAttempted = 0,

    /// <summary>
    /// Successfully completed the race with a finish time.
    /// </summary>
    Completed = 1,

    /// <summary>
    /// Did Not Start - runner registered but didn't start the race.
    /// </summary>
    DNS = 2,

    /// <summary>
    /// Did Not Finish - runner started but didn't complete the race.
    /// </summary>
    DNF = 3
}
