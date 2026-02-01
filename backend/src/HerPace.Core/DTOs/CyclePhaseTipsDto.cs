namespace HerPace.Core.DTOs;

/// <summary>
/// Contains wellness tips for a specific cycle phase covering nutrition, rest, injury prevention, and mood.
/// </summary>
public class CyclePhaseTipsDto
{
    public string Phase { get; set; } = string.Empty;
    public List<string> NutritionTips { get; set; } = new();
    public List<string> RestTips { get; set; } = new();
    public List<string> InjuryPreventionTips { get; set; } = new();
    public List<string> MoodInsights { get; set; } = new();
}
