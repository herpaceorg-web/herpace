namespace HerPace.Core.DTOs;

/// <summary>
/// Response model for successful authentication (signup or login).
/// </summary>
public class AuthResponse
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
