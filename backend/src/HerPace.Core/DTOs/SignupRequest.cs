using System.ComponentModel.DataAnnotations;

namespace HerPace.Core.DTOs;

/// <summary>
/// Request model for user signup.
/// </summary>
public class SignupRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
