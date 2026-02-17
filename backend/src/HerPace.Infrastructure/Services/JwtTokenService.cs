using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HerPace.Core.Entities;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HerPace.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly HerPaceDbContext _dbContext;
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly int _jwtExpirationMinutes;
    private readonly int _refreshTokenExpirationDays;

    public JwtTokenService(IConfiguration configuration, HerPaceDbContext dbContext)
    {
        _configuration = configuration;
        _dbContext = dbContext;

        _jwtSecret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT Secret is not configured in appsettings.json");

        _jwtIssuer = _configuration["Jwt:Issuer"] ?? "HerPace.API";
        _jwtAudience = _configuration["Jwt:Audience"] ?? "HerPace.Client";

        if (!int.TryParse(_configuration["Jwt:ExpirationMinutes"], out _jwtExpirationMinutes))
        {
            _jwtExpirationMinutes = 60;
        }

        if (!int.TryParse(_configuration["Jwt:RefreshTokenExpirationDays"], out _refreshTokenExpirationDays))
        {
            _refreshTokenExpirationDays = 90;
        }
    }

    public string GenerateToken(User user)
    {
        return GenerateToken(user, new List<string>());
    }

    public string GenerateToken(User user, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (!string.IsNullOrEmpty(user.UserName))
        {
            claims.Add(new Claim(ClaimTypes.Name, user.UserName));
        }

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtExpirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<(string accessToken, string refreshToken, DateTime refreshExpiry)> GenerateTokenPairAsync(User user, IList<string> roles)
    {
        var accessToken = GenerateToken(user, roles);

        // Generate cryptographically random refresh token
        var refreshTokenBytes = RandomNumberGenerator.GetBytes(64);
        var refreshTokenString = Convert.ToBase64String(refreshTokenBytes);
        var tokenHash = HashToken(refreshTokenString);

        var refreshExpiry = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = refreshExpiry,
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync();

        return (accessToken, refreshTokenString, refreshExpiry);
    }

    public async Task<RefreshToken?> ValidateRefreshTokenAsync(string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);

        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            return null;
        }

        return storedToken;
    }

    public async Task RevokeRefreshTokenAsync(string tokenHash, string? replacedByTokenHash = null)
    {
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            storedToken.ReplacedByTokenHash = replacedByTokenHash;
            await _dbContext.SaveChangesAsync();
        }
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
