using HerPace.Core.Entities;
using HerPace.Core.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HerPace.Infrastructure.Data;

/// <summary>
/// EF Core database context for HerPace application.
/// Extends IdentityDbContext to include ASP.NET Core Identity tables.
/// </summary>
public class HerPaceDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public HerPaceDbContext(DbContextOptions<HerPaceDbContext> options)
        : base(options)
    {
    }

    // DbSets for application entities
    public DbSet<Runner> Runners => Set<Runner>();
    public DbSet<Race> Races => Set<Race>();
    public DbSet<TrainingPlan> TrainingPlans => Set<TrainingPlan>();
    public DbSet<TrainingSession> TrainingSessions => Set<TrainingSession>();
    public DbSet<CycleLog> CycleLogs => Set<CycleLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");

            entity.Property(u => u.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(u => u.DeletedAt)
                .IsRequired(false);

            // One-to-one relationship with Runner
            entity.HasOne(u => u.Runner)
                .WithOne(r => r.User)
                .HasForeignKey<Runner>(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure Runner entity
        modelBuilder.Entity<Runner>(entity =>
        {
            entity.ToTable("runners");

            entity.HasKey(r => r.Id);

            entity.HasIndex(r => r.UserId)
                .IsUnique();

            entity.Property(r => r.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(r => r.TypicalWeeklyMileage)
                .HasPrecision(6, 2);

            // One-to-many relationship with Race
            entity.HasMany(r => r.Races)
                .WithOne(race => race.Runner)
                .HasForeignKey(race => race.RunnerId)
                .OnDelete(DeleteBehavior.Cascade);

            // One-to-many relationship with TrainingPlan
            entity.HasMany(r => r.TrainingPlans)
                .WithOne(tp => tp.Runner)
                .HasForeignKey(tp => tp.RunnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure Race entity
        modelBuilder.Entity<Race>(entity =>
        {
            entity.ToTable("races");

            entity.HasKey(r => r.Id);

            entity.Property(r => r.RaceName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(r => r.Location)
                .HasMaxLength(300);

            entity.Property(r => r.Distance)
                .HasPrecision(6, 2);

            entity.Property(r => r.GoalTime)
                .HasMaxLength(10);

            entity.Property(r => r.RaceCompletionGoal)
                .HasMaxLength(1000);

            entity.Property(r => r.CompletionStatus)
                .HasDefaultValue(RaceCompletionStatus.NotAttempted);

            entity.Property(r => r.ResultLoggedAt)
                .IsRequired(false);

            // One-to-one optional relationship with TrainingPlan
            entity.HasOne(r => r.TrainingPlan)
                .WithOne(tp => tp.Race)
                .HasForeignKey<TrainingPlan>(tp => tp.RaceId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(r => r.RunnerId);
            entity.HasIndex(r => r.RaceDate);
        });

        // Configure TrainingPlan entity
        modelBuilder.Entity<TrainingPlan>(entity =>
        {
            entity.ToTable("training_plans");

            entity.HasKey(tp => tp.Id);

            entity.Property(tp => tp.PlanName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(tp => tp.AiModel)
                .HasMaxLength(100);

            entity.Property(tp => tp.AiRationale)
                .HasMaxLength(2000);

            entity.Property(tp => tp.PlanCompletionGoal)
                .HasMaxLength(1000);

            // One-to-many relationship with TrainingSession
            entity.HasMany(tp => tp.Sessions)
                .WithOne(ts => ts.TrainingPlan)
                .HasForeignKey(ts => ts.TrainingPlanId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(tp => tp.RunnerId);
            entity.HasIndex(tp => tp.RaceId);
            entity.HasIndex(tp => tp.Status);

            // FR-017: Only one active plan allowed per runner
            // Unique partial index to enforce single active plan constraint
            entity.HasIndex(tp => new { tp.RunnerId, tp.Status })
                .IsUnique()
                .HasFilter("\"Status\" = 0"); // PlanStatus.Active = 0
        });

        // Configure TrainingSession entity
        modelBuilder.Entity<TrainingSession>(entity =>
        {
            entity.ToTable("training_sessions");

            entity.HasKey(ts => ts.Id);

            entity.Property(ts => ts.SessionName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(ts => ts.WarmUp)
                .HasMaxLength(1000);

            entity.Property(ts => ts.SessionDescription)
                .HasMaxLength(2000);

            entity.Property(ts => ts.HRZones)
                .HasMaxLength(100);

            entity.Property(ts => ts.Distance)
                .HasPrecision(6, 2);

            entity.Property(ts => ts.ActualDistance)
                .HasPrecision(6, 2);

            entity.Property(ts => ts.PhaseGuidance)
                .HasMaxLength(1000);

            entity.Property(ts => ts.UserNotes)
                .HasMaxLength(2000);

            entity.Property(ts => ts.SkipReason)
                .HasMaxLength(500);

            entity.HasIndex(ts => ts.TrainingPlanId);
            entity.HasIndex(ts => ts.ScheduledDate);
            entity.HasIndex(ts => ts.CompletedAt);
        });

        // Configure CycleLog entity
        modelBuilder.Entity<CycleLog>(entity =>
        {
            entity.ToTable("cycle_logs");

            entity.HasKey(cl => cl.Id);

            entity.Property(cl => cl.ActualPeriodStart)
                .IsRequired();

            entity.Property(cl => cl.ReportedAt)
                .IsRequired();

            entity.Property(cl => cl.ActualCycleLength)
                .IsRequired();

            entity.Property(cl => cl.WasPredictionAccurate)
                .IsRequired();

            entity.Property(cl => cl.TriggeredRegeneration)
                .IsRequired();

            // Relationship with Runner
            entity.HasOne(cl => cl.Runner)
                .WithMany()
                .HasForeignKey(cl => cl.RunnerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Optional relationship with TrainingPlan
            entity.HasOne(cl => cl.AffectedTrainingPlan)
                .WithMany()
                .HasForeignKey(cl => cl.AffectedTrainingPlanId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(cl => cl.RunnerId);
            entity.HasIndex(cl => cl.ActualPeriodStart);
            entity.HasIndex(cl => cl.ReportedAt);
        });

        // Configure Identity tables with custom names (lowercase for PostgreSQL convention)
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<IdentityRole<Guid>>().ToTable("roles");
        modelBuilder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
        modelBuilder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");
    }
}
