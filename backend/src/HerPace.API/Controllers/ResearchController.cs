using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HerPace.API.Controllers;

/// <summary>
/// Provides access to the peer-reviewed research library powering HerPace training recommendations.
/// </summary>
[ApiController]
[Route("api/research")]
public class ResearchController : ControllerBase
{
    private readonly HerPaceDbContext _context;

    public ResearchController(HerPaceDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lists all studies with optional filtering by category, tier, search term, or cycle phase.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ResearchStudySummaryDto>>> GetStudies(
        [FromQuery] string? category = null,
        [FromQuery] string? tier = null,
        [FromQuery] string? search = null,
        [FromQuery] string? phase = null)
    {
        var query = _context.ResearchStudies.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(s => s.TopicCategory == category);
        }

        if (!string.IsNullOrWhiteSpace(tier))
        {
            query = query.Where(s => s.EvidenceTier == tier);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(s =>
                s.ResearchTopic.ToLower().Contains(searchLower) ||
                s.KeyFindings.ToLower().Contains(searchLower) ||
                s.Citation.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(phase) && Enum.TryParse<CyclePhase>(phase, true, out var cyclePhase))
        {
            var studyIds = await _context.PhaseStudyMappings
                .Where(psm => psm.Phase == cyclePhase)
                .Select(psm => psm.ResearchStudyId)
                .ToListAsync();
            query = query.Where(s => studyIds.Contains(s.Id));
        }

        var studies = await query
            .OrderBy(s => s.Id)
            .Select(s => new ResearchStudySummaryDto
            {
                Id = s.Id,
                ResearchTopic = s.ResearchTopic,
                Citation = s.Citation,
                PublicationYear = s.PublicationYear,
                EvidenceTier = s.EvidenceTier,
                TopicCategory = s.TopicCategory
            })
            .ToListAsync();

        return Ok(studies);
    }

    /// <summary>
    /// Gets full detail for a single study including phase relevance.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ResearchStudyDto>> GetStudy(int id)
    {
        var study = await _context.ResearchStudies
            .Include(s => s.PhaseStudyMappings)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (study == null)
        {
            return NotFound(new { message = "Study not found." });
        }

        return Ok(new ResearchStudyDto
        {
            Id = study.Id,
            ResearchTopic = study.ResearchTopic,
            Citation = study.Citation,
            Doi = study.Doi,
            StudyDesign = study.StudyDesign,
            SampleSize = study.SampleSize,
            PublicationYear = study.PublicationYear,
            KeyFindings = study.KeyFindings,
            EvidenceTier = study.EvidenceTier,
            TopicCategory = study.TopicCategory,
            PhaseRelevance = study.PhaseStudyMappings.Select(psm => new PhaseRelevanceDto
            {
                Phase = psm.Phase.ToString(),
                RelevanceSummary = psm.RelevanceSummary
            }).ToList()
        });
    }

    /// <summary>
    /// Returns distinct topic categories for filter UI.
    /// </summary>
    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        var categories = await _context.ResearchStudies
            .Select(s => s.TopicCategory)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Ok(categories);
    }

    /// <summary>
    /// Returns studies relevant to a specific cycle phase with relevance summaries.
    /// </summary>
    [HttpGet("for-phase/{phase}")]
    public async Task<ActionResult<List<ResearchStudySummaryDto>>> GetStudiesForPhase(string phase)
    {
        if (!Enum.TryParse<CyclePhase>(phase, true, out var cyclePhase))
        {
            return BadRequest(new { message = $"Invalid cycle phase: {phase}. Valid values: Menstrual, Follicular, Ovulatory, Luteal." });
        }

        var studies = await _context.PhaseStudyMappings
            .Where(psm => psm.Phase == cyclePhase)
            .Include(psm => psm.ResearchStudy)
            .OrderBy(psm => psm.ResearchStudy.Id)
            .Select(psm => new ResearchStudySummaryDto
            {
                Id = psm.ResearchStudy.Id,
                ResearchTopic = psm.ResearchStudy.ResearchTopic,
                Citation = psm.ResearchStudy.Citation,
                PublicationYear = psm.ResearchStudy.PublicationYear,
                EvidenceTier = psm.ResearchStudy.EvidenceTier,
                TopicCategory = psm.ResearchStudy.TopicCategory
            })
            .ToListAsync();

        return Ok(studies);
    }
}
