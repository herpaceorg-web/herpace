using HerPace.Core.DTOs;
using HerPace.Core.Entities;
using HerPace.Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HerPace.API.Controllers;

/// <summary>
/// Controller for authentication endpoints (signup and login).
/// </summary>
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

    /// <summary>
    /// Register a new user account.
    /// </summary>
    /// <param name="request">Signup credentials (email and password).</param>
    /// <returns>Authentication response with JWT token.</returns>
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

        // Check if user already exists
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            _logger.LogWarning("Signup failed for {Email}: User already exists", request.Email);
            return BadRequest(new { message = "User with this email already exists." });
        }

        // Create new user
        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = false // Will be set to true after email verification (Phase 7)
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

        // Generate JWT token
        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenService.GenerateToken(user, roles);

        var response = new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(1) // 1 day expiration (configured in appsettings)
        };

        return CreatedAtAction(nameof(Signup), response);
    }

    /// <summary>
    /// Authenticate an existing user.
    /// </summary>
    /// <param name="request">Login credentials (email and password).</param>
    /// <returns>Authentication response with JWT token.</returns>
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

        // Find user by email
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            _logger.LogWarning("Login failed for {Email}: User not found", request.Email);
            return Unauthorized(new { message = "Invalid email or password." });
        }

        // Check if user is soft-deleted (GDPR compliance)
        if (user.DeletedAt.HasValue)
        {
            _logger.LogWarning("Login failed for {Email}: Account deleted at {DeletedAt}", request.Email, user.DeletedAt);
            return Unauthorized(new { message = "This account has been deleted." });
        }

        // Verify password
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

        // Generate JWT token
        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenService.GenerateToken(user, roles);

        var response = new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(1) // 1 day expiration (configured in appsettings)
        };

        return Ok(response);
    }
}
