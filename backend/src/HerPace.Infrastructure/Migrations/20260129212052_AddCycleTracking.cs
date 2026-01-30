using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCycleTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cycle_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RunnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActualPeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PredictedPeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DaysDifference = table.Column<int>(type: "integer", nullable: true),
                    WasPredictionAccurate = table.Column<bool>(type: "boolean", nullable: false),
                    ActualCycleLength = table.Column<int>(type: "integer", nullable: false),
                    TriggeredRegeneration = table.Column<bool>(type: "boolean", nullable: false),
                    AffectedTrainingPlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cycle_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cycle_logs_runners_RunnerId",
                        column: x => x.RunnerId,
                        principalTable: "runners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cycle_logs_training_plans_AffectedTrainingPlanId",
                        column: x => x.AffectedTrainingPlanId,
                        principalTable: "training_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cycle_logs_ActualPeriodStart",
                table: "cycle_logs",
                column: "ActualPeriodStart");

            migrationBuilder.CreateIndex(
                name: "IX_cycle_logs_AffectedTrainingPlanId",
                table: "cycle_logs",
                column: "AffectedTrainingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_cycle_logs_ReportedAt",
                table: "cycle_logs",
                column: "ReportedAt");

            migrationBuilder.CreateIndex(
                name: "IX_cycle_logs_RunnerId",
                table: "cycle_logs",
                column: "RunnerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cycle_logs");
        }
    }
}
