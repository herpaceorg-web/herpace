using HerPace.Core.Entities;

namespace HerPace.Core.Interfaces;

/// <summary>
/// Service for generating and validating JWT tokens for user authentication.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Generates a JWT token for the specified user.
    /// </summary>
    /// <param name="user">The user to generate a token for.</param>
    /// <returns>A JWT token string.</returns>
    string GenerateToken(User user);

    /// <summary>
    /// Generates a JWT token for the specified user with additional claims.
    /// </summary>
    /// <param name="user">The user to generate a token for.</param>
    /// <param name="roles">The roles to include in the token claims.</param>
    /// <returns>A JWT token string.</returns>
    string GenerateToken(User user, IList<string> roles);
}
