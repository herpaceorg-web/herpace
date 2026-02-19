using HerPace.Core.Enums;

namespace HerPace.Core.Entities;

/// <summary>
/// Maps a research study to a specific menstrual cycle phase, explaining its relevance.
/// </summary>
public class PhaseStudyMapping
{
    public int Id { get; set; }
    public CyclePhase Phase { get; set; }
    public int ResearchStudyId { get; set; }
    public string RelevanceSummary { get; set; } = string.Empty;

    // Navigation property
    public ResearchStudy ResearchStudy { get; set; } = null!;
}
