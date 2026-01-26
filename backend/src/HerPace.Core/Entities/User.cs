using Microsoft.AspNetCore.Identity;

namespace HerPace.Core.Entities;

/// <summary>
/// Represents a user account in the HerPace system.
/// Extends ASP.NET Core Identity for authentication and account management.
/// </summary>
public class User : IdentityUser<Guid>
{
    /// <summary>
    /// Account creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Soft delete timestamp for GDPR compliance (30-day retention).
    /// NULL indicates an active account.
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    // Navigation properties

    /// <summary>
    /// One-to-one relationship with Runner profile.
    /// </summary>
    public Runner? Runner { get; set; }
}
