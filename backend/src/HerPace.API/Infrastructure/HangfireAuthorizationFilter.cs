using Hangfire.Dashboard;

namespace HerPace.API.Infrastructure;

/// <summary>
/// Authorization filter for Hangfire Dashboard.
/// In development: allows all access for testing.
/// In production: should implement proper authentication.
/// </summary>
public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        // For development, allow all access to Hangfire dashboard
        // TODO: In production, add proper authorization (e.g., check user roles)
        // Example: return context.GetHttpContext().User.IsInRole("Admin");
        return true;
    }
}
