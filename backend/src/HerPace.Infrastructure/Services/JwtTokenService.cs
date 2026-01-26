using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HerPace.Core.Entities;
using HerPace.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HerPace.Infrastructure.Services;

/// <summary>
/// Implementation of JWT token generation service.
/// Uses configuration from appsettings.json for JWT secret and settings.
/// </summary>
public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly int _jwtExpirationMinutes;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;

        // Read JWT settings from configuration
        _jwtSecret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT Secret is not configured in appsettings.json");

        _jwtIssuer = _configuration["Jwt:Issuer"] ?? "HerPace.API";
        _jwtAudience = _configuration["Jwt:Audience"] ?? "HerPace.Client";

        // Parse expiration minutes with fallback to 60
        if (!int.TryParse(_configuration["Jwt:ExpirationMinutes"], out _jwtExpirationMinutes))
        {
            _jwtExpirationMinutes = 60;
        }
    }

    /// <inheritdoc />
    public string GenerateToken(User user)
    {
        return GenerateToken(user, new List<string>());
    }

    /// <inheritdoc />
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

        // Add username if available
        if (!string.IsNullOrEmpty(user.UserName))
        {
            claims.Add(new Claim(ClaimTypes.Name, user.UserName));
        }

        // Add roles to claims
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
}
