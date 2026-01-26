namespace HerPace.Core.DTOs;

/// <summary>
/// Represents a predicted cycle phase for a specific date.
/// </summary>
public class CyclePhaseDto
{
    public DateTime Date { get; set; }
    public string Phase { get; set; } = string.Empty; // Follicular, Ovulatory, Luteal, Menstrual
    public int DayInCycle { get; set; }
}
