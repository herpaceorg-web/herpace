using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRaceCompletionStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompletionStatus",
                table: "races",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResultLoggedAt",
                table: "races",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletionStatus",
                table: "races");

            migrationBuilder.DropColumn(
                name: "ResultLoggedAt",
                table: "races");
        }
    }
}
