using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanAdaptationHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Recovery",
                table: "training_sessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastPeriodEnd",
                table: "runners",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "plan_adaptation_history",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainingPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdaptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Summary = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    SessionsAffectedCount = table.Column<int>(type: "integer", nullable: false),
                    TriggerReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ChangesJson = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_plan_adaptation_history", x => x.Id);
                    table.ForeignKey(
                        name: "FK_plan_adaptation_history_training_plans_TrainingPlanId",
                        column: x => x.TrainingPlanId,
                        principalTable: "training_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_plan_adaptation_history_AdaptedAt",
                table: "plan_adaptation_history",
                column: "AdaptedAt",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_plan_adaptation_history_TrainingPlanId",
                table: "plan_adaptation_history",
                column: "TrainingPlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "plan_adaptation_history");

            migrationBuilder.DropColumn(
                name: "Recovery",
                table: "training_sessions");

            migrationBuilder.DropColumn(
                name: "LastPeriodEnd",
                table: "runners");
        }
    }
}
