using HerPace.Core.DTOs;
using HerPace.Core.Enums;

namespace HerPace.Core.Interfaces;

/// <summary>
/// Service for retrieving cycle phase wellness tips.
/// </summary>
public interface ICyclePhaseTipsService
{
    /// <summary>
    /// Gets wellness tips for a specific cycle phase.
    /// </summary>
    /// <param name="phase">The cycle phase to get tips for.</param>
    /// <returns>Tips for nutrition, rest, injury prevention, and mood.</returns>
    CyclePhaseTipsDto GetTipsForPhase(CyclePhase phase);
}
