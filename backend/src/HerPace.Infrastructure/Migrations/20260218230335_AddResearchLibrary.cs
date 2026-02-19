using HerPace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HerPace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddResearchLibrary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "research_studies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    ResearchTopic = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Citation = table.Column<string>(type: "text", nullable: false),
                    Doi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    StudyDesign = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SampleSize = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PublicationYear = table.Column<int>(type: "integer", nullable: true),
                    KeyFindings = table.Column<string>(type: "text", nullable: false),
                    EvidenceTier = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TopicCategory = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_research_studies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "phase_study_mappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Phase = table.Column<int>(type: "integer", nullable: false),
                    ResearchStudyId = table.Column<int>(type: "integer", nullable: false),
                    RelevanceSummary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_phase_study_mappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_phase_study_mappings_research_studies_ResearchStudyId",
                        column: x => x.ResearchStudyId,
                        principalTable: "research_studies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_phase_study_mappings_Phase",
                table: "phase_study_mappings",
                column: "Phase");

            migrationBuilder.CreateIndex(
                name: "IX_phase_study_mappings_ResearchStudyId",
                table: "phase_study_mappings",
                column: "ResearchStudyId");

            migrationBuilder.CreateIndex(
                name: "IX_research_studies_EvidenceTier",
                table: "research_studies",
                column: "EvidenceTier");

            migrationBuilder.CreateIndex(
                name: "IX_research_studies_PublicationYear",
                table: "research_studies",
                column: "PublicationYear");

            migrationBuilder.CreateIndex(
                name: "IX_research_studies_TopicCategory",
                table: "research_studies",
                column: "TopicCategory");

            // Seed research studies
            foreach (var study in ResearchSeedData.GetResearchStudies())
            {
                migrationBuilder.InsertData(
                    table: "research_studies",
                    columns: new[] { "Id", "ResearchTopic", "Citation", "Doi", "StudyDesign", "SampleSize", "PublicationYear", "KeyFindings", "EvidenceTier", "TopicCategory" },
                    values: new object?[] { study.Id, study.ResearchTopic, study.Citation, study.Doi, study.StudyDesign, study.SampleSize, study.PublicationYear, study.KeyFindings, study.EvidenceTier, study.TopicCategory });
            }

            // Seed phase-study mappings
            foreach (var mapping in ResearchSeedData.GetPhaseStudyMappings())
            {
                migrationBuilder.InsertData(
                    table: "phase_study_mappings",
                    columns: new[] { "Id", "Phase", "ResearchStudyId", "RelevanceSummary" },
                    values: new object[] { mapping.Id, (int)mapping.Phase, mapping.ResearchStudyId, mapping.RelevanceSummary });
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "phase_study_mappings");

            migrationBuilder.DropTable(
                name: "research_studies");
            // Seed data is removed automatically by dropping the tables
        }
    }
}
