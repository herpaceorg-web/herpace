using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRecalculationConfirmationTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PendingRecalculationConfirmation",
                table: "training_plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RecalculationConfirmationAccepted",
                table: "training_plans",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecalculationConfirmationRequestedAt",
                table: "training_plans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecalculationConfirmationRespondedAt",
                table: "training_plans",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PendingRecalculationConfirmation",
                table: "training_plans");

            migrationBuilder.DropColumn(
                name: "RecalculationConfirmationAccepted",
                table: "training_plans");

            migrationBuilder.DropColumn(
                name: "RecalculationConfirmationRequestedAt",
                table: "training_plans");

            migrationBuilder.DropColumn(
                name: "RecalculationConfirmationRespondedAt",
                table: "training_plans");
        }
    }
}
