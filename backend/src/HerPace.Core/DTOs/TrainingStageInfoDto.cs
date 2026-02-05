namespace HerPace.Core.DTOs;

/// <summary>
/// Static descriptive information about a training stage, hydrated from TrainingStageLibrary.
/// </summary>
public class TrainingStageInfoDto
{
    public string Name { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Focus { get; set; } = string.Empty;
    public string WhatToExpect { get; set; } = string.Empty;
    public string Tip { get; set; } = string.Empty;
}
