using HerPace.Core.Entities;
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

    // Additional DbSets will be added in Phase 3 (User Story implementations):
    // - Race (T030)
    // - TrainingPlan (T031)
    // - TrainingSession (T032)
    // - CycleLog (T076)

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

        // Configure Runner entity (basic configuration, will be expanded in Phase 3 T029)
        modelBuilder.Entity<Runner>(entity =>
        {
            entity.ToTable("runners");

            entity.HasKey(r => r.Id);

            entity.HasIndex(r => r.UserId)
                .IsUnique();
        });

        // Configure Identity tables with custom names (lowercase for PostgreSQL convention)
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<IdentityRole<Guid>>().ToTable("roles");
        modelBuilder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
        modelBuilder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");

        // Additional model configurations will be added in Phase 3:
        // - Race entity configuration (T033)
        // - TrainingPlan entity configuration with single active plan constraint (T033, T034)
        // - TrainingSession entity configuration (T033)
        // - CycleLog entity configuration (T077)
    }
}
