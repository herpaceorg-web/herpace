using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using MudBlazor.Services;
using HerPace.Client;
using HerPace.Client.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Configure HttpClient for API calls
var apiBaseUrl = builder.Configuration["ApiBaseUrl"] ?? "https://localhost:7001";
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(apiBaseUrl),
    Timeout = TimeSpan.FromMinutes(5) // Allow up to 5 minutes for long-running API calls like plan generation
});

// Register API client service
builder.Services.AddScoped<ApiClient>();

// Register user preferences service for managing user preferences like distance units
builder.Services.AddScoped<UserPreferencesService>();

// Add MudBlazor services
builder.Services.AddMudServices();

await builder.Build().RunAsync();
