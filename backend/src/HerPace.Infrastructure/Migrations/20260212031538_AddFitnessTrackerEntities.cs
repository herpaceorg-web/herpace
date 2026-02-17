using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFitnessTrackerEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "connected_services",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RunnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Platform = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ExternalUserId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AccessToken = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RefreshToken = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    TokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Scopes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ConnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DisconnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSyncAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSyncError = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_connected_services", x => x.Id);
                    table.ForeignKey(
                        name: "FK_connected_services_runners_RunnerId",
                        column: x => x.RunnerId,
                        principalTable: "runners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "imported_activities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RunnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Platform = table.Column<int>(type: "integer", nullable: false),
                    ExternalActivityId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TrainingSessionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActivityDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActivityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActivityTitle = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DistanceMeters = table.Column<double>(type: "double precision", nullable: true),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    MovingTimeSeconds = table.Column<int>(type: "integer", nullable: true),
                    AveragePaceSecondsPerKm = table.Column<double>(type: "double precision", nullable: true),
                    AverageHeartRate = table.Column<int>(type: "integer", nullable: true),
                    MaxHeartRate = table.Column<int>(type: "integer", nullable: true),
                    Cadence = table.Column<int>(type: "integer", nullable: true),
                    ElevationGainMeters = table.Column<double>(type: "double precision", nullable: true),
                    CaloriesBurned = table.Column<int>(type: "integer", nullable: true),
                    GpsRouteJson = table.Column<string>(type: "jsonb", nullable: true),
                    RawResponseJson = table.Column<string>(type: "jsonb", nullable: true),
                    ImportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_imported_activities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_imported_activities_runners_RunnerId",
                        column: x => x.RunnerId,
                        principalTable: "runners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_imported_activities_training_sessions_TrainingSessionId",
                        column: x => x.TrainingSessionId,
                        principalTable: "training_sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "sync_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConnectedServiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    RunnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Platform = table.Column<int>(type: "integer", nullable: false),
                    SyncType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ActivitiesFound = table.Column<int>(type: "integer", nullable: false),
                    ActivitiesImported = table.Column<int>(type: "integer", nullable: false),
                    ActivitiesDuplicate = table.Column<int>(type: "integer", nullable: false),
                    ActivitiesFiltered = table.Column<int>(type: "integer", nullable: false),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sync_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sync_logs_connected_services_ConnectedServiceId",
                        column: x => x.ConnectedServiceId,
                        principalTable: "connected_services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_sync_logs_runners_RunnerId",
                        column: x => x.RunnerId,
                        principalTable: "runners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_connected_services_RunnerId_Platform",
                table: "connected_services",
                columns: new[] { "RunnerId", "Platform" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_imported_activities_Platform_ExternalActivityId",
                table: "imported_activities",
                columns: new[] { "Platform", "ExternalActivityId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_imported_activities_RunnerId_ActivityDate",
                table: "imported_activities",
                columns: new[] { "RunnerId", "ActivityDate" });

            migrationBuilder.CreateIndex(
                name: "IX_imported_activities_RunnerId_Platform",
                table: "imported_activities",
                columns: new[] { "RunnerId", "Platform" });

            migrationBuilder.CreateIndex(
                name: "IX_imported_activities_TrainingSessionId",
                table: "imported_activities",
                column: "TrainingSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_sync_logs_ConnectedServiceId",
                table: "sync_logs",
                column: "ConnectedServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_sync_logs_RunnerId",
                table: "sync_logs",
                column: "RunnerId");

            migrationBuilder.CreateIndex(
                name: "IX_sync_logs_StartedAt",
                table: "sync_logs",
                column: "StartedAt",
                descending: new bool[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "imported_activities");

            migrationBuilder.DropTable(
                name: "sync_logs");

            migrationBuilder.DropTable(
                name: "connected_services");
        }
    }
}
