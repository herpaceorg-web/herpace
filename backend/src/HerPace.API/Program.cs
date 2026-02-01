using System.Text;
using Hangfire;
using Hangfire.PostgreSql;
using HerPace.API.Middleware;
using HerPace.Core.Entities;
using HerPace.Core.Interfaces;
using HerPace.Infrastructure.AI;
using HerPace.Infrastructure.Data;
using HerPace.Infrastructure.Services;
using HerPace.Infrastructure.Services.Cycle;
using HerPace.Infrastructure.Services.Plan;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Configure Database Connection
var useCloudSql = builder.Configuration.GetValue<bool>("UseCloudSql");
var connectionString = useCloudSql
    ? builder.Configuration.GetConnectionString("CloudSqlConnection")
    : builder.Configuration.GetConnectionString("HerPaceDb");

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Database connection string is not configured.");
}

// Add Entity Framework Core with PostgreSQL
builder.Services.AddDbContext<HerPaceDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure Hangfire with PostgreSQL storage for background jobs
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options =>
        options.UseNpgsqlConnection(connectionString)));

// Add Hangfire server for processing background jobs
builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 2; // Limit concurrent jobs
    options.ServerName = "HerPace-API";
});

// Configure ASP.NET Core Identity
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    // Password settings (development - will be strengthened for production)
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;

    // User settings
    options.User.RequireUniqueEmail = true;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddEntityFrameworkStores<HerPaceDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("JWT Secret is not configured in appsettings.json");

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "HerPace.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "HerPace.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false; // Set to true in production
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero // Remove default 5 minute tolerance
    };
});

// Register application services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ICyclePhaseCalculator, CyclePhaseCalculator>();
builder.Services.AddScoped<ICyclePhaseTipsService, CyclePhaseTipsService>();
builder.Services.AddScoped<IRaceService, RaceService>();
builder.Services.AddScoped<IPlanGenerationService, PlanGenerationService>();
builder.Services.AddScoped<ICycleTrackingService, CycleTrackingService>();
builder.Services.AddScoped<IPlanRegenerationService, PlanRegenerationService>();
builder.Services.AddScoped<ISessionCompletionService, SessionCompletionService>();
builder.Services.AddScoped<IPlanAdaptationService, PlanAdaptationService>();


// Configure AI Provider (Gemini or Fallback)
var aiProvider = builder.Configuration["AI:Provider"] ?? "Gemini";
builder.Services.AddHttpClient<GeminiPlanGenerator>(client =>
{
    client.Timeout = TimeSpan.FromMinutes(5); // Allow up to 5 minutes for AI plan generation
}); // Register HttpClient for Gemini API

builder.Services.AddScoped<IAIPlanGenerator>(sp =>
{
    var logger = sp.GetRequiredService<ILoggerFactory>();

    return aiProvider.ToLower() switch
    {
        "gemini" => sp.GetRequiredService<GeminiPlanGenerator>(),
        "fallback" => new FallbackPlanGenerator(logger.CreateLogger<FallbackPlanGenerator>()),
        _ => new FallbackPlanGenerator(logger.CreateLogger<FallbackPlanGenerator>())
    };
});

// Add Controllers
builder.Services.AddControllers();

// Add API Explorer and Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "HerPace API", Version = "v1" });
});

// Configure CORS for Blazor Client
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowBlazorClient", policy =>
    {
        policy.WithOrigins(
            "https://localhost:5001",
            "http://localhost:5000",
            "https://herpace-frontend-81066941589.us-central1.run.app" // Cloud Run frontend URL
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using (var scope = app.Services.CreateScope())
    {
        try
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HerPaceDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

            logger.LogInformation("Ensuring database is created and applying migrations...");

            // This will create the database if it doesn't exist and apply all migrations
            dbContext.Database.Migrate();

            logger.LogInformation("Database migrations applied successfully.");
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred while migrating the database.");
            throw;
        }
    }
}

app.UseHttpsRedirection();

// Global error handling middleware
app.UseErrorHandling();

// Enable CORS
app.UseCors("AllowBlazorClient");

// Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Hangfire Dashboard (development only)
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        Authorization = new[] { new HerPace.API.Infrastructure.HangfireAuthorizationFilter() }
    });
}

// Map controllers
app.MapControllers();

app.Run();
