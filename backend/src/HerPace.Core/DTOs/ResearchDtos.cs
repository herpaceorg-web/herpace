namespace HerPace.Core.DTOs;

/// <summary>
/// Full detail DTO for a single research study.
/// </summary>
public class ResearchStudyDto
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
    public List<PhaseRelevanceDto> PhaseRelevance { get; set; } = new();
}

/// <summary>
/// Summary DTO for study list views.
/// </summary>
public class ResearchStudySummaryDto
{
    public int Id { get; set; }
    public string ResearchTopic { get; set; } = string.Empty;
    public string Citation { get; set; } = string.Empty;
    public int? PublicationYear { get; set; }
    public string EvidenceTier { get; set; } = string.Empty;
    public string TopicCategory { get; set; } = string.Empty;
}

/// <summary>
/// Inline citation reference for tips and phase guidance.
/// </summary>
public class StudyCitationDto
{
    public int Id { get; set; }
    public string ShortCitation { get; set; } = string.Empty; // e.g. "McNulty et al., 2020"
    public string? Doi { get; set; }
}

/// <summary>
/// Describes why a study is relevant to a specific cycle phase.
/// </summary>
public class PhaseRelevanceDto
{
    public string Phase { get; set; } = string.Empty;
    public string RelevanceSummary { get; set; } = string.Empty;
}

/// <summary>
/// A cycle phase tip with citation references.
/// </summary>
public class CyclePhaseTipDto
{
    public string Tip { get; set; } = string.Empty;
    public List<StudyCitationDto> Citations { get; set; } = new();
}

/// <summary>
/// A workout tip with citation references.
/// </summary>
public class WorkoutTipDto
{
    public string Text { get; set; } = string.Empty;
    public List<StudyCitationDto> Citations { get; set; } = new();
}
