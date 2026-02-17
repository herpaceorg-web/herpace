using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HerPace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IJwtTokenService jwtTokenService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    [HttpPost("signup")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Signup([FromBody] SignupRequest request)
    {
        _logger.LogInformation("Signup attempt for email: {Email}", request.Email);

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Signup failed for {Email}: Invalid model state", request.Email);
            return BadRequest(ModelState);
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            _logger.LogWarning("Signup failed for {Email}: User already exists", request.Email);
            return BadRequest(new { message = "User with this email already exists." });
        }

        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = false
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            _logger.LogError("Signup failed for {Email}: {Errors}",
                request.Email,
                string.Join(", ", result.Errors.Select(e => $"{e.Code}: {e.Description}")));
            return BadRequest(new { message = "Failed to create user.", errors = result.Errors });
        }

        _logger.LogInformation("New user registered successfully: {UserId} ({Email})", user.Id, user.Email);

        var roles = await _userManager.GetRolesAsync(user);
        var (accessToken, refreshToken, refreshExpiry) = await _jwtTokenService.GenerateTokenPairAsync(user, roles);

        var response = new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            Token = accessToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            RefreshToken = refreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };

        return CreatedAtAction(nameof(Signup), response);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Login failed for {Email}: Invalid model state", request.Email);
            return BadRequest(ModelState);
        }

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            _logger.LogWarning("Login failed for {Email}: User not found", request.Email);
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (user.DeletedAt.HasValue)
        {
            _logger.LogWarning("Login failed for {Email}: Account deleted at {DeletedAt}", request.Email, user.DeletedAt);
            return Unauthorized(new { message = "This account has been deleted." });
        }

        _logger.LogDebug("Verifying password for user {UserId}", user.Id);
        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            _logger.LogWarning("Login failed for {Email}: Account locked out", request.Email);
            return Unauthorized(new { message = "Account locked due to multiple failed login attempts. Try again later." });
        }

        if (!result.Succeeded)
        {
            _logger.LogWarning("Login failed for {Email}: Invalid password", request.Email);
            return Unauthorized(new { message = "Invalid email or password." });
        }

        _logger.LogInformation("User {UserId} ({Email}) logged in successfully", user.Id, user.Email);

        var roles = await _userManager.GetRolesAsync(user);
        var (accessToken, refreshToken, refreshExpiry) = await _jwtTokenService.GenerateTokenPairAsync(user, roles);

        var response = new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            Token = accessToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            RefreshToken = refreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };

        return Ok(response);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var storedToken = await _jwtTokenService.ValidateRefreshTokenAsync(request.RefreshToken);
        if (storedToken == null)
        {
            _logger.LogWarning("Refresh token validation failed");
            return Unauthorized(new { message = "Invalid or expired refresh token." });
        }

        var user = await _userManager.FindByIdAsync(storedToken.UserId.ToString());
        if (user == null || user.DeletedAt.HasValue)
        {
            _logger.LogWarning("Refresh failed: user {UserId} not found or deleted", storedToken.UserId);
            return Unauthorized(new { message = "User not found." });
        }

        // Rotate: revoke old, issue new
        var roles = await _userManager.GetRolesAsync(user);
        var (accessToken, newRefreshToken, refreshExpiry) = await _jwtTokenService.GenerateTokenPairAsync(user, roles);

        // Revoke the old token, linking to the new one
        var newTokenHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(newRefreshToken))).ToLowerInvariant();
        await _jwtTokenService.RevokeRefreshTokenAsync(storedToken.TokenHash, newTokenHash);

        _logger.LogInformation("Token refreshed for user {UserId}", user.Id);

        var response = new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            Token = accessToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            RefreshToken = newRefreshToken,
            RefreshTokenExpiresAt = refreshExpiry
        };

        return Ok(response);
    }

    [HttpPost("revoke")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequest request)
    {
        var storedToken = await _jwtTokenService.ValidateRefreshTokenAsync(request.RefreshToken);
        if (storedToken == null)
        {
            return Ok(new { message = "Token already revoked or invalid." });
        }

        await _jwtTokenService.RevokeRefreshTokenAsync(storedToken.TokenHash);
        _logger.LogInformation("Refresh token revoked for user {UserId}", storedToken.UserId);

        return Ok(new { message = "Token revoked." });
    }
}
