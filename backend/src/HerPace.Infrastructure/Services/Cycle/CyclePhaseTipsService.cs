using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;

namespace HerPace.Infrastructure.Services.Cycle;

/// <summary>
/// Provides evidence-based wellness tips for each menstrual cycle phase.
/// Tips are based on peer-reviewed research with inline citations.
/// </summary>
public class CyclePhaseTipsService : ICyclePhaseTipsService
{
    private readonly Dictionary<CyclePhase, CyclePhaseTipsDto> _phaseTips;

    public CyclePhaseTipsService()
    {
        _phaseTips = InitializeTips();
    }

    public CyclePhaseTipsDto GetTipsForPhase(CyclePhase phase)
    {
        return _phaseTips[phase];
    }

    private static CyclePhaseTipDto Tip(string text, params (int Id, string ShortCitation, string? Doi)[] citations)
    {
        return new CyclePhaseTipDto
        {
            Tip = text,
            Citations = citations.Select(c => new StudyCitationDto
            {
                Id = c.Id,
                ShortCitation = c.ShortCitation,
                Doi = c.Doi
            }).ToList()
        };
    }

    private static Dictionary<CyclePhase, CyclePhaseTipsDto> InitializeTips()
    {
        return new Dictionary<CyclePhase, CyclePhaseTipsDto>
        {
            [CyclePhase.Menstrual] = new CyclePhaseTipsDto
            {
                Phase = "Menstrual",
                NutritionTips = new List<CyclePhaseTipDto>
                {
                    Tip("Focus on iron-rich foods (lean red meat, spinach, lentils) to replenish iron lost during bleeding",
                        (15, "Pengelly et al., 2025", "10.1016/j.jshs.2024.101009")),
                    Tip("Include omega-3 fatty acids (salmon, walnuts, flaxseed) to help reduce inflammation",
                        (26, "Loss et al., 2022", "10.1177/02601060211022266")),
                    Tip("Eat magnesium-rich foods (dark chocolate, almonds, avocado) to ease cramping",
                        (24, "Yaralizadeh et al., 2024", "10.15296/ijwhr.2023.25")),
                    Tip("Stay well-hydrated with water and herbal teas",
                        (23, "Giersch et al., 2020", "10.1007/s40279-019-01206-6")),
                    Tip("Include complex carbohydrates for sustained energy during low-energy days",
                        (21, "Oosthuyse et al., 2023", "10.1007/s00421-022-05090-3"))
                },
                RestTips = new List<CyclePhaseTipDto>
                {
                    Tip("Prioritize gentle movement like walking, yin yoga, or Pilates over high-intensity workouts",
                        (51, "SantaBarbara et al., 2024", "10.17761/2024-D-23-00077")),
                    Tip("Get adequate sleep (7-9 hours) to support recovery — sleep quality is often reduced during menses",
                        (41, "Koikawa et al., 2020", "10.5664/jcsm.8692")),
                    Tip("Consider taking rest days during the first 1-2 days of your period",
                        (1, "McNulty et al., 2020", "10.1007/s40279-020-01319-3")),
                    Tip("Listen to your body and reduce workout intensity if experiencing heavy cramping or fatigue",
                        (9, "Prado et al., 2024", "10.1097/JWH.0000000000000283")),
                    Tip("Incorporate stretching and foam rolling to ease muscle tension",
                        (55, "Bunpean et al., 2025", "10.3822/ijtmb.v18i4.1055"))
                },
                InjuryPreventionTips = new List<CyclePhaseTipDto>
                {
                    Tip("Keep exercise intensity low to moderate to reduce injury risk — muscle damage vulnerability is highest when estrogen is lowest",
                        (6, "Romero-Parra et al., 2021", "10.1519/JSC.0000000000003878")),
                    Tip("Avoid high-impact activities if experiencing significant discomfort or heavy flow",
                        (63, "Golden et al., 2025", "10.4085/1062-6050-0634.24")),
                    Tip("Focus on form and technique rather than performance goals",
                        (1, "McNulty et al., 2020", "10.1007/s40279-020-01319-3")),
                    Tip("Warm up thoroughly before any activity to prepare joints and muscles"),
                    Tip("Training at high intensities during menstruation may increase injury risk",
                        (6, "Romero-Parra et al., 2021", "10.1519/JSC.0000000000003878"))
                },
                MoodInsights = new List<CyclePhaseTipDto>
                {
                    Tip("You may experience reduced energy, vigor, and motivation during this phase",
                        (40, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("Feelings of fatigue, irritability, or low mood are common due to hormonal changes",
                        (44, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("Physical discomfort and cramping can affect your desire to train",
                        (54, "Morse et al., 2024", "10.1123/wspaj.2024-0054")),
                    Tip("Be kind to yourself and adjust expectations during this phase"),
                    Tip("Gentle exercise can actually improve mood and reduce cramping for many women",
                        (51, "SantaBarbara et al., 2024", "10.17761/2024-D-23-00077"))
                }
            },
            [CyclePhase.Follicular] = new CyclePhaseTipsDto
            {
                Phase = "Follicular",
                NutritionTips = new List<CyclePhaseTipDto>
                {
                    Tip("Prioritize lean protein (chicken, fish, tofu) to support muscle building and recovery",
                        (22, "Mercer et al., 2020", "10.3390/nu12113527")),
                    Tip("Include healthy fats (avocado, nuts, olive oil) for hormone production",
                        (2, "Colebatch et al., 2025", "10.1016/j.jsams.2025.02.001")),
                    Tip("Eat complex carbohydrates (quinoa, sweet potato, oats) for sustained energy",
                        (21, "Oosthuyse et al., 2023", "10.1007/s00421-022-05090-3")),
                    Tip("Focus on colorful vegetables for vitamins and antioxidants",
                        (34, "Mano et al., 2022", "10.1089/whr.2022.0003")),
                    Tip("Consume 20+ grams of protein within 30-45 minutes after workouts for optimal recovery",
                        (22, "Mercer et al., 2020", "10.3390/nu12113527"))
                },
                RestTips = new List<CyclePhaseTipDto>
                {
                    Tip("Recovery is faster during this phase, allowing you to handle more training volume",
                        (6, "Romero-Parra et al., 2021", "10.1519/JSC.0000000000003878")),
                    Tip("You may feel less need for rest days, but still include at least one per week"),
                    Tip("Enjoy improved sleep quality compared to other phases",
                        (41, "Koikawa et al., 2020", "10.5664/jcsm.8692")),
                    Tip("Take advantage of faster recovery to do back-to-back harder sessions if desired",
                        (45, "Schlie et al., 2025", "10.1152/japplphysiol.00223.2025")),
                    Tip("Your body is primed for strength gains during this phase",
                        (11, "Niering et al., 2024", "10.3390/sports12010031"))
                },
                InjuryPreventionTips = new List<CyclePhaseTipDto>
                {
                    Tip("Excellent time for high-intensity training and strength work with lower injury risk",
                        (11, "Niering et al., 2024", "10.3390/sports12010031")),
                    Tip("You'll likely experience lower rates of perceived exertion, making harder efforts feel easier",
                        (9, "Prado et al., 2024", "10.1097/JWH.0000000000000283")),
                    Tip("Build strength during this phase to protect against injuries in later phases",
                        (61, "McNulty et al., 2020", "10.1007/s40279-020-01319-3")),
                    Tip("Take advantage of improved maximal strength capacity",
                        (11, "Niering et al., 2024", "10.3390/sports12010031")),
                    Tip("Still warm up properly before intense sessions")
                },
                MoodInsights = new List<CyclePhaseTipDto>
                {
                    Tip("Rising estrogen levels boost serotonin, leading to feelings of happiness and contentment",
                        (40, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("You'll likely feel more energetic, focused, and motivated to train",
                        (42, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("This is generally the most positive and active phase emotionally",
                        (50, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("Confidence in your abilities tends to be higher"),
                    Tip("Great time to tackle challenging workouts or new training goals",
                        (59, "Cristina-Souza et al., 2019", "10.1080/02640414.2019.1597826"))
                }
            },
            [CyclePhase.Ovulatory] = new CyclePhaseTipsDto
            {
                Phase = "Ovulatory",
                NutritionTips = new List<CyclePhaseTipDto>
                {
                    Tip("Continue emphasizing protein and carbohydrates to fuel peak performance",
                        (22, "Mercer et al., 2020", "10.3390/nu12113527")),
                    Tip("Stay well-hydrated, especially before and after intense efforts",
                        (23, "Giersch et al., 2020", "10.1007/s40279-019-01206-6")),
                    Tip("Consider slightly higher carbohydrate intake to match increased training intensity",
                        (21, "Oosthuyse et al., 2023", "10.1007/s00421-022-05090-3")),
                    Tip("Don't skip meals—your body needs fuel for the high-intensity work you're capable of"),
                    Tip("Include antioxidant-rich foods (berries, leafy greens) to combat oxidation from hard efforts",
                        (34, "Mano et al., 2022", "10.1089/whr.2022.0003"))
                },
                RestTips = new List<CyclePhaseTipDto>
                {
                    Tip("This is your peak performance window—take advantage of it for key workouts",
                        (16, "Elorduy-Terrado et al., 2025", "10.3390/muscles4020015")),
                    Tip("You may need less recovery time between hard sessions"),
                    Tip("Maintain good sleep habits to capitalize on this high-energy phase",
                        (49, "Miles et al., 2022", "10.5114/biolsport.2022.108705")),
                    Tip("You'll likely feel your best and most capable during this 2-3 day window",
                        (42, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("Schedule your hardest or most important workouts during this phase")
                },
                InjuryPreventionTips = new List<CyclePhaseTipDto>
                {
                    Tip("CAUTION: Estrogen surge makes joints more flexible but also more vulnerable to injury",
                        (66, "Elorduy-Terrado et al., 2025", "10.3390/muscles4020015")),
                    Tip("Knees are especially at risk during this phase—focus on proper landing mechanics"),
                    Tip("Warm up thoroughly before explosive movements (sprints, jumps, lifts)"),
                    Tip("While you feel strong, be mindful of joint stability and don't overtrain"),
                    Tip("Consider slightly longer warm-ups to prepare joints for intense work")
                },
                MoodInsights = new List<CyclePhaseTipDto>
                {
                    Tip("Peak confidence, motivation, and desire to compete",
                        (42, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("Increased competitiveness and drive to perform at your best",
                        (44, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("You may experience heightened focus and faster reaction times",
                        (53, "Ronca et al., 2025", "10.1186/s40798-025-00924-8")),
                    Tip("This is when you'll likely feel most powerful and capable"),
                    Tip("Great time for races, time trials, or breakthrough workouts")
                }
            },
            [CyclePhase.Luteal] = new CyclePhaseTipsDto
            {
                Phase = "Luteal",
                NutritionTips = new List<CyclePhaseTipDto>
                {
                    Tip("Your body burns 5-10% more calories during this phase—honor your increased hunger",
                        (35, "Tucker et al., 2025", "10.1093/nutrit/nuae093")),
                    Tip("Increase complex carbohydrates (whole grains, starchy vegetables) to match energy needs",
                        (30, "Larrosa et al., 2024", "10.1093/nutrit/nuae082")),
                    Tip("Focus on magnesium (pumpkin seeds, black beans) and vitamin B6 (chickpeas, banana) to ease PMS",
                        (24, "Yaralizadeh et al., 2024", "10.15296/ijwhr.2023.25")),
                    Tip("For runs over 90 minutes or high-intensity sessions, increase fueling to 40-50g carbs per hour",
                        (14, "Rattley et al., 2024", "10.3390/physiologia4040033")),
                    Tip("Consume 20+ grams protein post-workout to support slower recovery",
                        (30, "Larrosa et al., 2024", "10.1093/nutrit/nuae082"))
                },
                RestTips = new List<CyclePhaseTipDto>
                {
                    Tip("Prioritize 7-9 hours of quality sleep—you need more recovery during this phase",
                        (49, "Miles et al., 2022", "10.5114/biolsport.2022.108705")),
                    Tip("Focus on lower-intensity workouts, easy runs, and yoga or Pilates",
                        (45, "Schlie et al., 2025", "10.1152/japplphysiol.00223.2025")),
                    Tip("Recovery is slower, so be patient and allow more time between hard efforts",
                        (58, "Silva et al., 2025", "10.52082/jssm.2025.532")),
                    Tip("Consider additional rest days or active recovery days"),
                    Tip("This is the time for technique work and building aerobic base, not pushing limits")
                },
                InjuryPreventionTips = new List<CyclePhaseTipDto>
                {
                    Tip("HIGHEST injury risk phase—joint, ligament, muscle, and tendon injuries are more common",
                        (58, "Silva et al., 2025", "10.52082/jssm.2025.532")),
                    Tip("Your heart rate will be 5-10 bpm higher at the same effort level",
                        (10, "Schmalenberger et al., 2019", "10.3390/jcm8111946")),
                    Tip("You're less tolerant to heat—be extra cautious in warm weather",
                        (5, "Giersch et al., 2020", "10.1016/j.jsams.2020.05.014")),
                    Tip("Recovery is significantly slower during this phase",
                        (58, "Silva et al., 2025", "10.52082/jssm.2025.532")),
                    Tip("Avoid pushing through pain—this is when overuse injuries develop")
                },
                MoodInsights = new List<CyclePhaseTipDto>
                {
                    Tip("You may experience irritability, anxiety, or mood swings during this phase",
                        (40, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("PMS symptoms like impatience, sadness, or frustration are common in the later days",
                        (46, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("Feeling more tired or mentally fatigued than usual is normal",
                        (50, "Paludo et al., 2022", "10.3389/fpsyg.2022.926854")),
                    Tip("Your motivation to train may decrease—this is hormonal, not a personal failure"),
                    Tip("Practice self-compassion and adjust training expectations during this phase")
                }
            }
        };
    }
}
