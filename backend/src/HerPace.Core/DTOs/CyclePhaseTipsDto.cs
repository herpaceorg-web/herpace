namespace HerPace.Core.DTOs;

/// <summary>
/// Contains wellness tips for a specific cycle phase covering nutrition, rest, injury prevention, and mood.
/// Each tip now includes citations to backing research studies.
/// </summary>
public class CyclePhaseTipsDto
{
    public string Phase { get; set; } = string.Empty;
    public List<CyclePhaseTipDto> NutritionTips { get; set; } = new();
    public List<CyclePhaseTipDto> RestTips { get; set; } = new();
    public List<CyclePhaseTipDto> InjuryPreventionTips { get; set; } = new();
    public List<CyclePhaseTipDto> MoodInsights { get; set; } = new();
}
