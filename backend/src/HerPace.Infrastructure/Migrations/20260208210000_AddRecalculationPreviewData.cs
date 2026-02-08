using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRecalculationPreviewData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PendingRecalculationPreviewJson",
                table: "training_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PendingRecalculationSummary",
                table: "training_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PreviewGeneratedAt",
                table: "training_plans",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PendingRecalculationPreviewJson",
                table: "training_plans");

            migrationBuilder.DropColumn(
                name: "PendingRecalculationSummary",
                table: "training_plans");

            migrationBuilder.DropColumn(
                name: "PreviewGeneratedAt",
                table: "training_plans");
        }
    }
}
