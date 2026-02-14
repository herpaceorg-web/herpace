using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGarminWomensHealthOptIn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "WomensHealthDataOptIn",
                table: "connected_services",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WomensHealthDataOptIn",
                table: "connected_services");
        }
    }
}
