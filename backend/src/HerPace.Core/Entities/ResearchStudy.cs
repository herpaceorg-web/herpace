namespace HerPace.Core.Entities;

/// <summary>
/// A peer-reviewed research study powering evidence-based training recommendations.
/// </summary>
public class ResearchStudy
{
    public int Id { get; set; }
    public string ResearchTopic { get; set; } = string.Empty;
    public string Citation { get; set; } = string.Empty;
    public string? Doi { get; set; }
    public string StudyDesign { get; set; } = string.Empty;
    public string? SampleSize { get; set; }
    public int? PublicationYear { get; set; }
    public string KeyFindings { get; set; } = string.Empty;
    public string EvidenceTier { get; set; } = string.Empty;
    public string TopicCategory { get; set; } = string.Empty;

    // Navigation property
    public ICollection<PhaseStudyMapping> PhaseStudyMappings { get; set; } = new List<PhaseStudyMapping>();
}
