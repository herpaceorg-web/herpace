using System.ComponentModel.DataAnnotations;

namespace HerPace.Core.DTOs;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
