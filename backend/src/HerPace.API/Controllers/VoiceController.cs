using System.Security.Claims;
using HerPace.Core.DTOs;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HerPace.API.Controllers;

/// <summary>
/// API endpoints for voice interaction with the Gemini Live API.
/// Provides ephemeral tokens for client-side voice sessions.
/// </summary>
[ApiController]
[Route("api/voice")]
[Authorize]
public class VoiceController : ControllerBase
{
    private readonly IVoiceSessionService _voiceSessionService;
    private readonly ISessionCompletionService _sessionCompletionService;
    private readonly HerPaceDbContext _context;
    private readonly ILogger<VoiceController> _logger;

    public VoiceController(
        IVoiceSessionService voiceSessionService,
        ISessionCompletionService sessionCompletionService,
        HerPaceDbContext context,
        ILogger<VoiceController> logger)
    {
        _voiceSessionService = voiceSessionService;
        _sessionCompletionService = sessionCompletionService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Generate an ephemeral token for a voice session with the Gemini Live API.
    /// The token can be used by the client to establish a WebSocket connection directly to Gemini.
    /// </summary>
    /// <param name="request">Optional session ID for context-aware voice interaction</param>
    [HttpPost("token")]
    [ProducesResponseType(typeof(VoiceSessionTokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSessionToken([FromBody] VoiceSessionTokenRequest? request)
    {
        try
        {
            var runnerId = await GetRunnerIdFromClaimsAsync();
            _logger.LogInformation("Generating voice token for runner {RunnerId}, session {SessionId}",
                runnerId, request?.SessionId);

            var response = await _voiceSessionService.GenerateSessionTokenAsync(runnerId, request?.SessionId);

            return Ok(response);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("profile not found"))
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to generate voice session token");
            return StatusCode(500, new { message = "Failed to generate voice session token", error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error generating voice session token");
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Complete a session via voice interaction.
    /// Called after the voice assistant has collected completion data from the user.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="request">Completion data extracted from voice interaction</param>
    [HttpPost("sessions/{id}/complete")]
    [ProducesResponseType(typeof(SessionCompletionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CompleteSessionVoice(
        Guid id,
        [FromBody] VoiceCompletionRequest request)
    {
        try
        {
            var runnerId = await GetRunnerIdFromClaimsAsync();
            _logger.LogInformation("Voice completing session {SessionId} for runner {RunnerId}. Transcript: {Transcript}",
                id, runnerId, request.VoiceTranscript ?? "N/A");

            // Convert to standard completion request
            var completionRequest = new CompleteSessionRequest
            {
                ActualDistance = request.ActualDistance,
                ActualDuration = request.ActualDuration,
                RPE = request.RPE,
                UserNotes = string.IsNullOrEmpty(request.VoiceTranscript)
                    ? request.UserNotes
                    : $"{request.UserNotes ?? ""} [Voice: {request.VoiceTranscript}]".Trim()
            };

            var result = await _sessionCompletionService.CompleteSessionAsync(id, runnerId, completionRequest);

            if (!result.Success)
            {
                return result.ErrorMessage?.Contains("not found") == true
                    ? NotFound(result.ErrorMessage)
                    : BadRequest(result.ErrorMessage);
            }

            var response = new SessionCompletionResponse
            {
                SessionId = id,
                Success = true,
                RecalculationTriggered = result.RecalculationTriggered,
                Message = result.RecalculationTriggered
                    ? "Session completed via voice. Your training plan is being adapted."
                    : "Session completed via voice. Great job!"
            };

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile not found for authenticated user");
            return NotFound(new { message = ex.Message });
        }
    }

    private async Task<Guid> GetRunnerIdFromClaimsAsync()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }

        var runner = await _context.Runners.FirstOrDefaultAsync(r => r.UserId == userId);
        if (runner == null)
        {
            throw new InvalidOperationException("Runner profile not found. Please create a profile first.");
        }

        return runner.Id;
    }
}
