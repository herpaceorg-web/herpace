using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserStory1Entities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "runners",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CycleLength",
                table: "runners",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "runners",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DistanceUnit",
                table: "runners",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FitnessLevel",
                table: "runners",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "FiveKPR",
                table: "runners",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "HalfMarathonPR",
                table: "runners",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastPeriodStart",
                table: "runners",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "MarathonPR",
                table: "runners",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "runners",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<TimeSpan>(
                name: "TenKPR",
                table: "runners",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TypicalCycleRegularity",
                table: "runners",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "TypicalWeeklyMileage",
                table: "runners",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "runners",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "races",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RunnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    RaceName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Location = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    RaceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Distance = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    DistanceType = table.Column<int>(type: "integer", nullable: false),
                    GoalTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    RaceCompletionGoal = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    RaceResult = table.Column<TimeSpan>(type: "interval", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_races", x => x.Id);
                    table.ForeignKey(
                        name: "FK_races_runners_RunnerId",
                        column: x => x.RunnerId,
                        principalTable: "runners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "training_plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    RunnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PlanName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TrainingDaysPerWeek = table.Column<int>(type: "integer", nullable: false),
                    LongRunDay = table.Column<int>(type: "integer", nullable: false),
                    DaysBeforePeriodToReduceIntensity = table.Column<int>(type: "integer", nullable: false),
                    DaysAfterPeriodToReduceIntensity = table.Column<int>(type: "integer", nullable: false),
                    PlanCompletionGoal = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    GenerationSource = table.Column<int>(type: "integer", nullable: false),
                    AiModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AiRationale = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_training_plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_training_plans_races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "races",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_training_plans_runners_RunnerId",
                        column: x => x.RunnerId,
                        principalTable: "runners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "training_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainingPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ScheduledDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WorkoutType = table.Column<int>(type: "integer", nullable: false),
                    WarmUp = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SessionDescription = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    Distance = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    IntensityLevel = table.Column<int>(type: "integer", nullable: false),
                    HRZones = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CyclePhase = table.Column<int>(type: "integer", nullable: true),
                    PhaseGuidance = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ActualDistance = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    ActualDuration = table.Column<int>(type: "integer", nullable: true),
                    RPE = table.Column<int>(type: "integer", nullable: true),
                    UserNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsSkipped = table.Column<bool>(type: "boolean", nullable: false),
                    SkipReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_training_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_training_sessions_training_plans_TrainingPlanId",
                        column: x => x.TrainingPlanId,
                        principalTable: "training_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_races_RaceDate",
                table: "races",
                column: "RaceDate");

            migrationBuilder.CreateIndex(
                name: "IX_races_RunnerId",
                table: "races",
                column: "RunnerId");

            migrationBuilder.CreateIndex(
                name: "IX_training_plans_RaceId",
                table: "training_plans",
                column: "RaceId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_training_plans_RunnerId",
                table: "training_plans",
                column: "RunnerId");

            migrationBuilder.CreateIndex(
                name: "IX_training_plans_RunnerId_Status",
                table: "training_plans",
                columns: new[] { "RunnerId", "Status" },
                unique: true,
                filter: "\"Status\" = 0");

            migrationBuilder.CreateIndex(
                name: "IX_training_plans_Status",
                table: "training_plans",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_training_sessions_CompletedAt",
                table: "training_sessions",
                column: "CompletedAt");

            migrationBuilder.CreateIndex(
                name: "IX_training_sessions_ScheduledDate",
                table: "training_sessions",
                column: "ScheduledDate");

            migrationBuilder.CreateIndex(
                name: "IX_training_sessions_TrainingPlanId",
                table: "training_sessions",
                column: "TrainingPlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "training_sessions");

            migrationBuilder.DropTable(
                name: "training_plans");

            migrationBuilder.DropTable(
                name: "races");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "CycleLength",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "DistanceUnit",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "FitnessLevel",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "FiveKPR",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "HalfMarathonPR",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "LastPeriodStart",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "MarathonPR",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "TenKPR",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "TypicalCycleRegularity",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "TypicalWeeklyMileage",
                table: "runners");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "runners");
        }
    }
}
