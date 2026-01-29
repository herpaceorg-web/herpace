using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanRecalculationTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastRecalculatedAt",
                table: "training_plans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastRecalculationJobId",
                table: "training_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastRecalculationRequestedAt",
                table: "training_plans",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastRecalculatedAt",
                table: "training_plans");

            migrationBuilder.DropColumn(
                name: "LastRecalculationJobId",
                table: "training_plans");

            migrationBuilder.DropColumn(
                name: "LastRecalculationRequestedAt",
                table: "training_plans");
        }
    }
}
