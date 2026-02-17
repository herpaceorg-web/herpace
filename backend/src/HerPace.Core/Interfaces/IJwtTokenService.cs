using HerPace.Core.Entities;

namespace HerPace.Core.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
    string GenerateToken(User user, IList<string> roles);
    Task<(string accessToken, string refreshToken, DateTime refreshExpiry)> GenerateTokenPairAsync(User user, IList<string> roles);
    Task<RefreshToken?> ValidateRefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string tokenHash, string? replacedByTokenHash = null);
}
