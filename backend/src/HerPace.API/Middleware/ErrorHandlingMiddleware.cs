using System.Net;
using System.Text.Json;

namespace HerPace.API.Middleware;

/// <summary>
/// Global exception handling middleware.
/// Catches unhandled exceptions and returns standardized JSON error responses.
/// Implements FR-015: Triggers fallback plan generation when AI fails.
/// </summary>
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse
        {
            Message = "An error occurred while processing your request.",
            Details = null
        };

        switch (exception)
        {
            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = "Unauthorized access.";
                response.ErrorCode = "UNAUTHORIZED";
                break;

            case InvalidOperationException invalidOpEx:
                // Check if this is an AI generation failure (FR-015)
                if (invalidOpEx.Message.StartsWith("AI_GENERATION_FAILED"))
                {
                    _logger.LogWarning("AI generation failed, fallback should be triggered: {Message}", invalidOpEx.Message);
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Message = "Unable to generate plan using AI. Please try again.";
                    response.ErrorCode = "AI_GENERATION_FAILED";
                    response.Details = "The system will automatically use a template-based plan if AI continues to fail.";
                }
                else
                {
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Message = invalidOpEx.Message;
                    response.ErrorCode = "INVALID_OPERATION";
                }
                break;

            case ArgumentException argEx:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = argEx.Message;
                response.ErrorCode = "INVALID_ARGUMENT";
                break;

            case KeyNotFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = "The requested resource was not found.";
                response.ErrorCode = "NOT_FOUND";
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = "An unexpected error occurred. Please try again later.";
                response.ErrorCode = "INTERNAL_ERROR";

                // Include exception details in development mode
                if (IsDevelopmentEnvironment(context))
                {
                    response.Details = exception.ToString();
                }
                break;
        }

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }

    private bool IsDevelopmentEnvironment(HttpContext context)
    {
        var env = context.RequestServices.GetService<IWebHostEnvironment>();
        return env?.IsDevelopment() ?? false;
    }
}

/// <summary>
/// Standardized error response format.
/// </summary>
public class ErrorResponse
{
    public string Message { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Extension method to register the error handling middleware.
/// </summary>
public static class ErrorHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ErrorHandlingMiddleware>();
    }
}
