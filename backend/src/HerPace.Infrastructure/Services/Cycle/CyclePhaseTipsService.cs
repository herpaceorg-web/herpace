using HerPace.Core.DTOs;
using HerPace.Core.Enums;
using HerPace.Core.Interfaces;

namespace HerPace.Infrastructure.Services.Cycle;

/// <summary>
/// Provides evidence-based wellness tips for each menstrual cycle phase.
/// Tips are based on recent research about nutrition, rest, injury prevention, and mood
/// during different cycle phases for women athletes.
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

    private static Dictionary<CyclePhase, CyclePhaseTipsDto> InitializeTips()
    {
        return new Dictionary<CyclePhase, CyclePhaseTipsDto>
        {
            [CyclePhase.Menstrual] = new CyclePhaseTipsDto
            {
                Phase = "Menstrual",
                NutritionTips = new List<string>
                {
                    "Focus on iron-rich foods (lean red meat, spinach, lentils) to replenish iron lost during bleeding",
                    "Include omega-3 fatty acids (salmon, walnuts, flaxseed) to help reduce inflammation",
                    "Eat magnesium-rich foods (dark chocolate, almonds, avocado) to ease cramping",
                    "Stay well-hydrated with water and herbal teas",
                    "Include complex carbohydrates for sustained energy during low-energy days"
                },
                RestTips = new List<string>
                {
                    "Prioritize gentle movement like walking, yin yoga, or Pilates over high-intensity workouts",
                    "Get adequate sleep (7-9 hours) to support recovery",
                    "Consider taking rest days during the first 1-2 days of your period",
                    "Listen to your body and reduce workout intensity if experiencing heavy cramping or fatigue",
                    "Incorporate stretching and foam rolling to ease muscle tension"
                },
                InjuryPreventionTips = new List<string>
                {
                    "Keep exercise intensity low to moderate to reduce injury risk during this phase",
                    "Avoid high-impact activities if experiencing significant discomfort or heavy flow",
                    "Focus on form and technique rather than performance goals",
                    "Warm up thoroughly before any activity to prepare joints and muscles",
                    "Training at high intensities during menstruation may increase injury risk"
                },
                MoodInsights = new List<string>
                {
                    "You may experience reduced energy, vigor, and motivation during this phase",
                    "Feelings of fatigue, irritability, or low mood are common due to hormonal changes",
                    "Physical discomfort and cramping can affect your desire to train",
                    "Be kind to yourself and adjust expectations during this phase",
                    "Gentle exercise can actually improve mood and reduce cramping for many women"
                }
            },
            [CyclePhase.Follicular] = new CyclePhaseTipsDto
            {
                Phase = "Follicular",
                NutritionTips = new List<string>
                {
                    "Prioritize lean protein (chicken, fish, tofu) to support muscle building and recovery",
                    "Include healthy fats (avocado, nuts, olive oil) for hormone production",
                    "Eat complex carbohydrates (quinoa, sweet potato, oats) for sustained energy",
                    "Focus on colorful vegetables for vitamins and antioxidants",
                    "Consume 20+ grams of protein within 30-45 minutes after workouts for optimal recovery"
                },
                RestTips = new List<string>
                {
                    "Recovery is faster during this phase, allowing you to handle more training volume",
                    "You may feel less need for rest days, but still include at least one per week",
                    "Enjoy improved sleep quality compared to other phases",
                    "Take advantage of faster recovery to do back-to-back harder sessions if desired",
                    "Your body is primed for strength gains during this phase"
                },
                InjuryPreventionTips = new List<string>
                {
                    "Excellent time for high-intensity training and strength work with lower injury risk",
                    "You'll likely experience lower rates of perceived exertion, making harder efforts feel easier",
                    "Build strength during this phase to protect against injuries in later phases",
                    "Take advantage of improved maximal strength capacity",
                    "Still warm up properly before intense sessions"
                },
                MoodInsights = new List<string>
                {
                    "Rising estrogen levels boost serotonin, leading to feelings of happiness and contentment",
                    "You'll likely feel more energetic, focused, and motivated to train",
                    "This is generally the most positive and active phase emotionally",
                    "Confidence in your abilities tends to be higher",
                    "Great time to tackle challenging workouts or new training goals"
                }
            },
            [CyclePhase.Ovulatory] = new CyclePhaseTipsDto
            {
                Phase = "Ovulatory",
                NutritionTips = new List<string>
                {
                    "Continue emphasizing protein and carbohydrates to fuel peak performance",
                    "Stay well-hydrated, especially before and after intense efforts",
                    "Consider slightly higher carbohydrate intake to match increased training intensity",
                    "Don't skip meals—your body needs fuel for the high-intensity work you're capable of",
                    "Include antioxidant-rich foods (berries, leafy greens) to combat oxidation from hard efforts"
                },
                RestTips = new List<string>
                {
                    "This is your peak performance window—take advantage of it for key workouts",
                    "You may need less recovery time between hard sessions",
                    "Maintain good sleep habits to capitalize on this high-energy phase",
                    "You'll likely feel your best and most capable during this 2-3 day window",
                    "Schedule your hardest or most important workouts during this phase"
                },
                InjuryPreventionTips = new List<string>
                {
                    "CAUTION: Estrogen surge makes joints more flexible but also more vulnerable to injury",
                    "Knees are especially at risk during this phase—focus on proper landing mechanics",
                    "Warm up thoroughly before explosive movements (sprints, jumps, lifts)",
                    "While you feel strong, be mindful of joint stability and don't overtrain",
                    "Consider slightly longer warm-ups to prepare joints for intense work"
                },
                MoodInsights = new List<string>
                {
                    "Peak confidence, motivation, and desire to compete",
                    "Increased competitiveness and drive to perform at your best",
                    "You may experience heightened focus and faster reaction times",
                    "This is when you'll likely feel most powerful and capable",
                    "Great time for races, time trials, or breakthrough workouts"
                }
            },
            [CyclePhase.Luteal] = new CyclePhaseTipsDto
            {
                Phase = "Luteal",
                NutritionTips = new List<string>
                {
                    "Your body burns 5-10% more calories during this phase—honor your increased hunger",
                    "Increase complex carbohydrates (whole grains, starchy vegetables) to match energy needs",
                    "Focus on magnesium (pumpkin seeds, black beans) and vitamin B6 (chickpeas, banana) to ease PMS",
                    "For runs over 90 minutes or high-intensity sessions, increase fueling to 40-50g carbs per hour",
                    "Consume 20+ grams protein post-workout to support slower recovery"
                },
                RestTips = new List<string>
                {
                    "Prioritize 7-9 hours of quality sleep—you need more recovery during this phase",
                    "Focus on lower-intensity workouts, easy runs, and yoga or Pilates",
                    "Recovery is slower, so be patient and allow more time between hard efforts",
                    "Consider additional rest days or active recovery days",
                    "This is the time for technique work and building aerobic base, not pushing limits"
                },
                InjuryPreventionTips = new List<string>
                {
                    "HIGHEST injury risk phase—joint, ligament, muscle, and tendon injuries are more common",
                    "Your heart rate will be 5-10 bpm higher at the same effort level",
                    "You're less tolerant to heat—be extra cautious in warm weather",
                    "Recovery is significantly slower during this phase",
                    "Avoid pushing through pain—this is when overuse injuries develop"
                },
                MoodInsights = new List<string>
                {
                    "You may experience irritability, anxiety, or mood swings during this phase",
                    "PMS symptoms like impatience, sadness, or frustration are common in the later days",
                    "Feeling more tired or mentally fatigued than usual is normal",
                    "Your motivation to train may decrease—this is hormonal, not a personal failure",
                    "Practice self-compassion and adjust training expectations during this phase"
                }
            }
        };
    }
}
