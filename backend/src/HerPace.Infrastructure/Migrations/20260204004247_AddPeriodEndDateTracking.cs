using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPeriodEndDateTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "ActualPeriodStart",
                table: "cycle_logs",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<DateTime>(
                name: "ActualPeriodEnd",
                table: "cycle_logs",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActualPeriodEnd",
                table: "cycle_logs");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ActualPeriodStart",
                table: "cycle_logs",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }
    }
}
