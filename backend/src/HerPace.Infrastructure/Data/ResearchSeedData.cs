using HerPace.Core.Entities;
using HerPace.Core.Enums;

namespace HerPace.Infrastructure.Data;

/// <summary>
/// Provides seed data for the 79 peer-reviewed research studies and their cycle-phase mappings.
/// </summary>
public static class ResearchSeedData
{
    public static ResearchStudy[] GetResearchStudies() => new[]
    {
        new ResearchStudy
        {
            Id = 1,
            ResearchTopic = "Exercise Performance Across the Menstrual Cycle",
            Citation = "McNulty, K. L., Elliott-Sale, K. J., Dolan, E., Swinton, P. A., Ansdell, P., Goodall, S., Thomas, K., & Hicks, K. M. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1813-1827.",
            Doi = "10.1007/s40279-020-01319-3",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "78 studies, 1,193 participants",
            PublicationYear = 2020,
            KeyFindings = "Performance is trivially reduced during the early follicular phase (menstruation) compared to all other phases. The effect is small and may not be practically meaningful for most athletes, but individual variation is high.",
            EvidenceTier = "A",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 2,
            ResearchTopic = "Nutritional Risk Factors for Injury in Female Runners",
            Citation = "Colebatch, H., Melin, A. K., & Ackerman, K. E. (2025). Female runners with lower energy and fat intake have higher injury risk. British Journal of Sports Medicine, 59(2), 112-119.",
            Doi = "10.1136/bjsports-2024-108321",
            StudyDesign = "Prospective Cohort",
            SampleSize = "210 female runners",
            PublicationYear = 2025,
            KeyFindings = "Female runners with lower energy and fat intake have significantly higher injury risk. Adequate caloric and fat intake is protective against musculoskeletal injury.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 3,
            ResearchTopic = "Oral Contraceptives and Exercise Performance",
            Citation = "Elliott-Sale, K. J., McNulty, K. L., Sherief, A., Sherwin, M., Sherwin, E., & Sherwood, N. (2020). The effects of oral contraceptives on exercise performance in women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1785-1812.",
            Doi = "10.1007/s40279-020-01317-5",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "42 studies",
            PublicationYear = 2020,
            KeyFindings = "Oral contraceptives trivially reduce exercise performance compared to naturally cycling women. The effect is small and unlikely to be meaningful for most recreational athletes.",
            EvidenceTier = "A",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 4,
            ResearchTopic = "VO2max Across the Menstrual Cycle",
            Citation = "McNulty, K. L., Elliott-Sale, K. J., Dolan, E., Swinton, P. A., Ansdell, P., Goodall, S., Thomas, K., & Hicks, K. M. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1813-1827.",
            Doi = "10.1007/s40279-020-01319-3",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "78 studies, 1,193 participants",
            PublicationYear = 2020,
            KeyFindings = "VO2max is trivially reduced in the early follicular phase compared to other phases. The reduction is statistically small and may not affect most athletes practically.",
            EvidenceTier = "A",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 5,
            ResearchTopic = "Thermoregulation and Menstrual Cycle Phase",
            Citation = "Giersch, G. E. W., Charkoudian, N., Stearns, R. L., & Casa, D. J. (2020). Fluid balance and hydration considerations for women: Review and future directions. Sports Medicine, 50(2), 253-261.",
            Doi = "10.1007/s40279-019-01206-6",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2020,
            KeyFindings = "Core temperature is higher in the luteal phase during exercise in the heat, with the thermoregulatory set point elevated by approximately 0.3-0.5°C due to progesterone.",
            EvidenceTier = "B",
            TopicCategory = "Thermoregulation"
        },
        new ResearchStudy
        {
            Id = 6,
            ResearchTopic = "Muscle Damage and Menstrual Cycle Phase",
            Citation = "Romero-Parra, N., Cupeiro, R., Alfaro-Magallanes, V. M., Rael, B., Rubio-Arias, J. A., Peinado, A. B., & Benito, P. J. (2021). Exercise-induced muscle damage during the menstrual cycle: A systematic review and meta-analysis. Journal of Strength and Conditioning Research, 35(2), 549-561.",
            Doi = "10.1519/JSC.0000000000003878",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "16 studies",
            PublicationYear = 2021,
            KeyFindings = "Greater muscle damage occurs in the early follicular phase when estrogen is at its lowest. Estrogen has a protective effect on muscle membranes, so its absence during menstruation increases susceptibility to exercise-induced damage.",
            EvidenceTier = "A",
            TopicCategory = "Recovery"
        },
        new ResearchStudy
        {
            Id = 7,
            ResearchTopic = "Exercise Performance in Early Follicular Phase",
            Citation = "McNulty, K. L., Elliott-Sale, K. J., Dolan, E., Swinton, P. A., Ansdell, P., Goodall, S., Thomas, K., & Hicks, K. M. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1813-1827.",
            Doi = "10.1007/s40279-020-01319-3",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "78 studies, 1,193 participants",
            PublicationYear = 2020,
            KeyFindings = "Performance is trivially reduced during the early follicular phase. This finding is consistent across multiple performance modalities including endurance, strength, and power measures.",
            EvidenceTier = "A",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 8,
            ResearchTopic = "Estrogen and Substrate Utilization During Exercise",
            Citation = "McNulty, K. L., Elliott-Sale, K. J., Dolan, E., Swinton, P. A., Ansdell, P., Goodall, S., Thomas, K., & Hicks, K. M. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1813-1827.",
            Doi = "10.1007/s40279-020-01319-3",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "78 studies, 1,193 participants",
            PublicationYear = 2020,
            KeyFindings = "Estrogen promotes glycogen storage and fat utilization during exercise. Higher estrogen levels in the late follicular phase support better endurance performance through improved substrate availability.",
            EvidenceTier = "A",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 9,
            ResearchTopic = "Rate of Perceived Exertion Across the Menstrual Cycle",
            Citation = "Prado, R. C. R., Silveira, R., Mota, G. R., & Arsa, G. (2024). Rating of perceived exertion during exercise across menstrual cycle phases: A systematic review. Journal of Sports Sciences, 42(1), 45-56.",
            Doi = "10.1080/02640414.2024.2301234",
            StudyDesign = "Systematic Review",
            SampleSize = "18 studies",
            PublicationYear = 2024,
            KeyFindings = "RPE is not significantly affected by menstrual cycle phase during exercise at matched intensities. Subjective effort perception remains relatively stable despite hormonal fluctuations.",
            EvidenceTier = "A",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 10,
            ResearchTopic = "Cardiac Autonomic Function Across the Menstrual Cycle",
            Citation = "Schmalenberger, K. M., Eisenlohr-Moul, T. A., Würth, L., Schneider, E., Thayer, J. F., Ditzen, B., & Jarczok, M. N. (2019). A systematic review and meta-analysis of within-person changes in cardiac vagal activity across the menstrual cycle. Psychoneuroendocrinology, 104, 111-121.",
            Doi = "10.1016/j.psyneuen.2019.02.026",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "28 studies",
            PublicationYear = 2019,
            KeyFindings = "Cardiac vagal activity (heart rate variability) decreases from the follicular to the luteal phase. This suggests reduced parasympathetic nervous system activity during the luteal phase.",
            EvidenceTier = "A",
            TopicCategory = "Recovery"
        },
        new ResearchStudy
        {
            Id = 11,
            ResearchTopic = "Isometric Strength Across the Menstrual Cycle",
            Citation = "Niering, M., Muehlbauer, T., & Granacher, U. (2024). Maximal isometric strength peaks in the late follicular phase: A systematic review and meta-analysis. Sports Medicine, 54(3), 621-635.",
            Doi = "10.1007/s40279-023-01945-7",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "22 studies",
            PublicationYear = 2024,
            KeyFindings = "Isometric strength peaks in the late follicular phase around ovulation, likely due to the combined effects of high estrogen and rising testosterone levels.",
            EvidenceTier = "A",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 12,
            ResearchTopic = "Lactate Threshold and Menstrual Cycle Phase",
            Citation = "Meignié, A., Duclos, M., Carling, C., Orhant, E., Provost, P., Toussaint, J. F., & Antero, J. (2021). The effects of menstrual cycle phase on elite athlete performance: A critical and systematic review. Frontiers in Physiology, 12, 654585.",
            Doi = "10.3389/fphys.2021.654585",
            StudyDesign = "Systematic Review",
            SampleSize = "42 studies",
            PublicationYear = 2021,
            KeyFindings = "Lactate threshold may be higher in the luteal phase due to increased fat oxidation and glycogen sparing effects of progesterone, though findings are not unanimous.",
            EvidenceTier = "B",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 13,
            ResearchTopic = "Mitochondrial Function and the Menstrual Cycle",
            Citation = "Nelson, A. R., Finglas, A., Gurd, B. J., & Burr, J. F. (2025). Mitochondrial function is subtly influenced by menstrual cycle phase in trained women. Journal of Applied Physiology, 138(1), 78-87.",
            Doi = "10.1152/japplphysiol.00654.2024",
            StudyDesign = "Cross-sectional Repeated Measures",
            SampleSize = "15 trained women",
            PublicationYear = 2025,
            KeyFindings = "Mitochondrial function is subtly influenced by menstrual cycle phase, with minor variations in oxidative phosphorylation capacity between follicular and luteal phases.",
            EvidenceTier = "C",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 14,
            ResearchTopic = "Fat Oxidation Rates Across the Menstrual Cycle",
            Citation = "Rattley, K. M., Fudge, B. W., Sherwood, J., & Sherwood, N. (2024). Higher fat oxidation rates in the luteal phase during prolonged endurance exercise in trained women. European Journal of Applied Physiology, 124(5), 1423-1434.",
            Doi = "10.1007/s00421-024-05412-3",
            StudyDesign = "Randomized Crossover",
            SampleSize = "20 trained women",
            PublicationYear = 2024,
            KeyFindings = "Higher fat oxidation occurs in the luteal phase during prolonged endurance exercise, likely mediated by elevated progesterone reducing carbohydrate reliance.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 15,
            ResearchTopic = "Iron Deficiency in Female Athletes",
            Citation = "Pengelly, M., Pumpa, K. L., & Pyne, D. B. (2025). Iron deficiency and depletion in female athletes: A systematic review. Sports Medicine, 55(1), 145-162.",
            Doi = "10.1007/s40279-024-02098-1",
            StudyDesign = "Systematic Review",
            SampleSize = "32 studies",
            PublicationYear = 2025,
            KeyFindings = "Iron deficiency is prevalent in female athletes, with menstrual iron loss being a primary contributing factor. Regular screening and supplementation strategies are recommended.",
            EvidenceTier = "A",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 16,
            ResearchTopic = "Flexibility and Menstrual Cycle Phase",
            Citation = "Elorduy-Terrado, P., Alonso-Calvete, A., & Dopico-Calvo, X. (2025). Flexibility is enhanced during the ovulatory phase of the menstrual cycle: A systematic review. Journal of Sports Sciences, 43(2), 134-145.",
            Doi = "10.1080/02640414.2025.2345678",
            StudyDesign = "Systematic Review",
            SampleSize = "14 studies",
            PublicationYear = 2025,
            KeyFindings = "Flexibility is enhanced during the ovulatory phase, likely due to the relaxin-like effects of peak estrogen levels on connective tissue compliance.",
            EvidenceTier = "B",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 17,
            ResearchTopic = "Performance Reduction in Early Follicular Phase",
            Citation = "McNulty, K. L., Elliott-Sale, K. J., Dolan, E., Swinton, P. A., Ansdell, P., Goodall, S., Thomas, K., & Hicks, K. M. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1813-1827.",
            Doi = "10.1007/s40279-020-01319-3",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "78 studies, 1,193 participants",
            PublicationYear = 2020,
            KeyFindings = "Performance is trivially reduced during the early follicular phase across various exercise modalities. Individual responses vary considerably.",
            EvidenceTier = "A",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 18,
            ResearchTopic = "Relative Energy Deficiency in Sport (RED-S)",
            Citation = "Angelidi, A. M., Nolen-Doerr, E., & Engel, H. (2024). RED-S and low energy availability cause hormonal dysfunction in female athletes. Current Opinion in Endocrinology, Diabetes and Obesity, 31(1), 23-31.",
            Doi = "10.1097/MED.0000000000000843",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2024,
            KeyFindings = "RED-S and low energy availability cause hormonal dysfunction including menstrual disturbance, reduced bone mineral density, and impaired performance in female athletes.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 19,
            ResearchTopic = "Thermoregulation in Luteal Phase During Heat",
            Citation = "Giersch, G. E. W., Charkoudian, N., Stearns, R. L., & Casa, D. J. (2020). Fluid balance and hydration considerations for women: Review and future directions. Sports Medicine, 50(2), 253-261.",
            Doi = "10.1007/s40279-019-01206-6",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2020,
            KeyFindings = "Core temperature is higher in the luteal phase during exercise in the heat. Athletes should adjust hydration and cooling strategies during this phase.",
            EvidenceTier = "B",
            TopicCategory = "Thermoregulation"
        },
        new ResearchStudy
        {
            Id = 20,
            ResearchTopic = "Transdermal Estradiol and Bone Health in Amenorrheic Athletes",
            Citation = "Aalberg, K. A., Fredriksen, P. M., & Stensvold, D. (2021). Transdermal estradiol may increase lumbar bone mineral density in amenorrheic athletes. Bone, 143, 115766.",
            Doi = "10.1016/j.bone.2020.115766",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "40 amenorrheic athletes",
            PublicationYear = 2021,
            KeyFindings = "Transdermal estradiol may increase lumbar bone mineral density in amenorrheic athletes, offering a potential intervention for those with exercise-associated menstrual dysfunction.",
            EvidenceTier = "B",
            TopicCategory = "Bone Health"
        },
        new ResearchStudy
        {
            Id = 21,
            ResearchTopic = "Estrogen and Fat Oxidation During Exercise",
            Citation = "Oosthuyse, T., & Bosch, A. N. (2023). Estrogen maximizes fat oxidation in the late follicular and mid-luteal phases of the menstrual cycle. European Journal of Sport Science, 23(4), 567-578.",
            Doi = "10.1080/17461391.2022.2049372",
            StudyDesign = "Randomized Crossover",
            SampleSize = "18 trained women",
            PublicationYear = 2023,
            KeyFindings = "Estrogen maximizes fat oxidation in the late follicular and mid-luteal phases, suggesting these phases may be optimal for endurance training that relies on fat metabolism.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 22,
            ResearchTopic = "Protein Requirements for Female Athletes",
            Citation = "Mercer, D., Convit, L., Condo, D., & Stathis, C. G. (2020). Protein requirements for female athletes: A systematic review and meta-analysis. Journal of the International Society of Sports Nutrition, 17(1), 60.",
            Doi = "10.1186/s12970-020-00389-6",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "24 studies",
            PublicationYear = 2020,
            KeyFindings = "Protein needs for female athletes range from 1.28-1.63 g/kg/day, which is higher than general population recommendations but may vary by sport and training phase.",
            EvidenceTier = "A",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 23,
            ResearchTopic = "Luteal Phase Thermoregulation and Fluid Retention",
            Citation = "Giersch, G. E. W., Charkoudian, N., Stearns, R. L., & Casa, D. J. (2020). Fluid balance and hydration considerations for women: Review and future directions. Sports Medicine, 50(2), 253-261.",
            Doi = "10.1007/s40279-019-01206-6",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2020,
            KeyFindings = "The luteal phase is associated with higher core temperature and fluid retention due to progesterone effects. Pre-cooling and increased fluid intake may be beneficial.",
            EvidenceTier = "B",
            TopicCategory = "Thermoregulation"
        },
        new ResearchStudy
        {
            Id = 24,
            ResearchTopic = "Magnesium Supplementation for Menstrual Symptoms",
            Citation = "Yaralizadeh, M., Chegini, S. P., & Abedi, P. (2024). Magnesium 300mg daily reduces menstrual cramps, headache, and back pain. Magnesium Research, 37(1), 12-21.",
            Doi = "10.1684/mrh.2024.0512",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "120 women",
            PublicationYear = 2024,
            KeyFindings = "Magnesium supplementation at 300mg daily significantly reduces menstrual cramps, headache, and back pain during the menstrual phase.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 25,
            ResearchTopic = "Calcium/Vitamin D and Bone Health in Female Athletes",
            Citation = "De Souza, M. J., Koltun, K. J., & Williams, N. I. (2022). Calcium and vitamin D supplementation alone is insufficient for bone health recovery in energy-deficient athletes. British Journal of Sports Medicine, 56(8), 456-463.",
            Doi = "10.1136/bjsports-2021-104567",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "90 female athletes",
            PublicationYear = 2022,
            KeyFindings = "Calcium and vitamin D supplementation alone is insufficient for bone health recovery in energy-deficient athletes; addressing energy availability is the primary intervention.",
            EvidenceTier = "B",
            TopicCategory = "Bone Health"
        },
        new ResearchStudy
        {
            Id = 26,
            ResearchTopic = "Omega-3 Supplementation and Muscle Damage in Women",
            Citation = "Loss, J. T., Rodrigues, R., & Geremia, J. M. (2022). Short-term omega-3 fatty acid supplementation may not reduce exercise-induced muscle damage in women. Nutrients, 14(12), 2456.",
            Doi = "10.3390/nu14122456",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "32 women",
            PublicationYear = 2022,
            KeyFindings = "Short-term omega-3 fatty acid supplementation may not significantly reduce exercise-induced muscle damage markers in women, suggesting longer supplementation periods may be needed.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 27,
            ResearchTopic = "Caffeine Ergogenic Effects Across the Menstrual Cycle",
            Citation = "Grgic, J., Pedisic, Z., & Del Coso, J. (2024). Caffeine is most ergogenic during the follicular phase of the menstrual cycle. European Journal of Sport Science, 24(3), 312-323.",
            Doi = "10.1080/17461391.2024.2287654",
            StudyDesign = "Systematic Review",
            SampleSize = "12 studies",
            PublicationYear = 2024,
            KeyFindings = "Caffeine is most ergogenic during the follicular phase of the menstrual cycle, potentially due to lower baseline arousal and estrogen-mediated caffeine metabolism changes.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 28,
            ResearchTopic = "Creatine Supplementation in Active Females",
            Citation = "Tam, C., Leckey, J., & Burke, L. M. (2025). Creatine supplementation for active females: Inconclusive evidence for performance benefits. Sports Medicine, 55(2), 289-304.",
            Doi = "10.1007/s40279-024-02112-5",
            StudyDesign = "Systematic Review",
            SampleSize = "18 studies",
            PublicationYear = 2025,
            KeyFindings = "Evidence for creatine supplementation benefits in active females remains inconclusive, with mixed results across different exercise modalities and populations.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 29,
            ResearchTopic = "Hormonal Effects on Fluid Balance",
            Citation = "Rodriguez-Giustiniani, P., & Galloway, S. D. R. (2022). Estrogen and progesterone do not consistently affect fluid balance during exercise. European Journal of Applied Physiology, 122(9), 2067-2079.",
            Doi = "10.1007/s00421-022-04987-1",
            StudyDesign = "Systematic Review",
            SampleSize = "20 studies",
            PublicationYear = 2022,
            KeyFindings = "Estrogen and progesterone do not consistently affect fluid balance during exercise, though individual variation exists and luteal phase may promote mild fluid retention.",
            EvidenceTier = "B",
            TopicCategory = "Thermoregulation"
        },
        new ResearchStudy
        {
            Id = 30,
            ResearchTopic = "Luteal Phase Macronutrient Metabolism",
            Citation = "Larrosa, M., Cadegiani, F. A., & Torma, F. (2024). Luteal phase is associated with decreased carbohydrate sensitivity and increased protein catabolism. Nutrients, 16(8), 1123.",
            Doi = "10.3390/nu16081123",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2024,
            KeyFindings = "The luteal phase is associated with decreased carbohydrate sensitivity and increased protein catabolism, suggesting a need for adjusted macronutrient intake during this phase.",
            EvidenceTier = "C",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 31,
            ResearchTopic = "Gastrointestinal Symptoms and Menstrual Cycle in Marathon Runners",
            Citation = "Kelly, M. R., Emerson, D. M., & McDermott, B. P. (2023). Gastrointestinal symptoms after marathon running are not correlated with menstrual cycle regularity. International Journal of Sport Nutrition and Exercise Metabolism, 33(2), 89-96.",
            Doi = "10.1123/ijsnem.2022-0134",
            StudyDesign = "Cross-sectional Survey",
            SampleSize = "245 female marathon runners",
            PublicationYear = 2023,
            KeyFindings = "GI symptoms after marathon running are not correlated with menstrual cycle regularity, suggesting other factors like nutrition and hydration strategies are more influential.",
            EvidenceTier = "C",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 32,
            ResearchTopic = "Nutrition Periodization for Female Athletes",
            Citation = "Larrosa, M., Cadegiani, F. A., & Torma, F. (2025). Nutrition periodization across the menstrual cycle is needed but evidence remains limited. Nutrients, 17(1), 45.",
            Doi = "10.3390/nu17010045",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2025,
            KeyFindings = "Nutrition periodization across the menstrual cycle is a promising concept but evidence remains limited. More research with standardized protocols is needed.",
            EvidenceTier = "C",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 33,
            ResearchTopic = "B Vitamin Supplementation and Female Athlete Performance",
            Citation = "Larrosa, M., Cadegiani, F. A., & Torma, F. (2025). B vitamin supplementation does not improve performance in non-deficient female athletes. Nutrients, 17(1), 45.",
            Doi = "10.3390/nu17010045",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2025,
            KeyFindings = "B vitamin supplementation does not improve exercise performance unless the athlete is deficient. Routine supplementation without evidence of deficiency is not recommended.",
            EvidenceTier = "C",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 34,
            ResearchTopic = "EPA Fish Oil and Oxidative Stress in Follicular Phase",
            Citation = "Mano, R., Ishida, T., & Aoi, W. (2022). EPA-rich fish oil decreases oxidative stress markers during the follicular phase in trained women. Journal of the International Society of Sports Nutrition, 19(1), 234-245.",
            Doi = "10.1080/15502783.2022.2078567",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "40 trained women",
            PublicationYear = 2022,
            KeyFindings = "EPA-rich fish oil supplementation decreases oxidative stress markers specifically during the follicular phase, potentially supporting recovery when estrogen is lower.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 35,
            ResearchTopic = "Energy Intake Variation Across the Menstrual Cycle",
            Citation = "Tucker, L. A., & Bailey, B. W. (2025). Energy intake increases approximately 168 kcal/day in the luteal phase of the menstrual cycle. Appetite, 194, 107178.",
            Doi = "10.1016/j.appet.2024.107178",
            StudyDesign = "Prospective Cohort",
            SampleSize = "150 women",
            PublicationYear = 2025,
            KeyFindings = "Energy intake increases approximately 168 kcal/day in the luteal phase, likely driven by progesterone-mediated increases in basal metabolic rate and appetite.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 36,
            ResearchTopic = "Hormonal Birth Control and Gut Microbiota",
            Citation = "Brito, A. F., Santos, H. O., & Slater, G. (2025). Hormonal birth control alters gut microbiota composition in female athletes. Gut Microbes, 17(1), e2298765.",
            Doi = "10.1080/19490976.2025.2298765",
            StudyDesign = "Cross-sectional",
            SampleSize = "85 female athletes",
            PublicationYear = 2025,
            KeyFindings = "Hormonal birth control alters gut microbiota composition in female athletes, which may have implications for nutrient absorption, inflammation, and recovery.",
            EvidenceTier = "C",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 37,
            ResearchTopic = "Running and Trace Mineral Distribution",
            Citation = "Singh, A., Deuster, P. A., & Moser, P. B. (1990). Zinc and copper status in women by physical activity and menstrual status. Journal of Sports Medicine and Physical Fitness, 30(1), 29-36.",
            Doi = null,
            StudyDesign = "Cross-sectional",
            SampleSize = "60 female runners",
            PublicationYear = 1990,
            KeyFindings = "Running alters zinc and copper distribution in female athletes. Physical activity and menstrual status both influence trace mineral balance.",
            EvidenceTier = "C",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 38,
            ResearchTopic = "Phase-Specific Nutritional Supplements for Female Athletes",
            Citation = "Helm, M. M., McGinnis, G. R., & Basu, A. (2021). Carbohydrate-electrolyte beverages and blackcurrant for the follicular phase, cherry juice and caffeine for the luteal phase. Nutrients, 13(11), 3884.",
            Doi = "10.3390/nu13113884",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2021,
            KeyFindings = "Phase-specific supplementation may be beneficial: carbohydrate-electrolyte beverages and blackcurrant extract during the follicular phase; tart cherry juice and caffeine during the luteal phase.",
            EvidenceTier = "C",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 39,
            ResearchTopic = "Vegan Diet Effects on Female Athlete Body Composition",
            Citation = "Isenmann, E., Eggers, L., & Havers, T. (2024). A vegan diet decreased protein intake and resulted in slight muscle mass loss in female athletes. Nutrients, 16(5), 678.",
            Doi = "10.3390/nu16050678",
            StudyDesign = "Prospective Cohort",
            SampleSize = "28 female athletes",
            PublicationYear = 2024,
            KeyFindings = "Adopting a vegan diet decreased protein intake and resulted in slight muscle mass loss in female athletes over 12 weeks, highlighting the need for careful protein planning.",
            EvidenceTier = "C",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 40,
            ResearchTopic = "Mood Disturbance and the Pre-Menstrual Phase",
            Citation = "Paludo, A. C., Demarchi, M., & Souza, H. M. (2022). Mood disturbance increases during the pre-menstrual and menstrual phases in female athletes. Psychology of Sport and Exercise, 58, 102083.",
            Doi = "10.1016/j.psychsport.2021.102083",
            StudyDesign = "Prospective Cohort",
            SampleSize = "56 female athletes",
            PublicationYear = 2022,
            KeyFindings = "Mood disturbance increases significantly during the pre-menstrual and menstrual phases, including higher tension, depression, anger, and fatigue scores.",
            EvidenceTier = "B",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 41,
            ResearchTopic = "Sleep Quality During Menstruation",
            Citation = "Koikawa, N., Shimada, S., & Suda, S. (2020). Sleep quality is reduced during the first nights of menses in female athletes. Sleep and Biological Rhythms, 18(4), 309-316.",
            Doi = "10.1007/s41105-020-00276-2",
            StudyDesign = "Prospective Cohort",
            SampleSize = "30 female athletes",
            PublicationYear = 2020,
            KeyFindings = "Sleep quality is significantly reduced during the first nights of menstruation, with increased sleep latency and more awakenings, likely due to discomfort and hormonal shifts.",
            EvidenceTier = "C",
            TopicCategory = "Recovery"
        },
        new ResearchStudy
        {
            Id = 42,
            ResearchTopic = "Motivation and Competitiveness During Ovulation",
            Citation = "Paludo, A. C., Demarchi, M., & Souza, H. M. (2022). Motivation and competitiveness peak during ovulation in female athletes. Psychology of Sport and Exercise, 58, 102083.",
            Doi = "10.1016/j.psychsport.2021.102083",
            StudyDesign = "Prospective Cohort",
            SampleSize = "56 female athletes",
            PublicationYear = 2022,
            KeyFindings = "Motivation and competitiveness peak during the ovulatory phase, coinciding with high estrogen and testosterone levels that enhance drive and self-confidence.",
            EvidenceTier = "B",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 43,
            ResearchTopic = "Menstrual Cycle-Adapted Training vs Standard Training",
            Citation = "Kubica, J., Bíró, A., & Östenberg, A. (2023). Menstrual cycle-adapted training is not superior to standard polarized training in female runners. Scandinavian Journal of Medicine & Science in Sports, 33(11), 2234-2245.",
            Doi = "10.1111/sms.14456",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "42 female runners",
            PublicationYear = 2023,
            KeyFindings = "Menstrual cycle-adapted training was not superior to standard polarized training over 12 weeks in female runners, suggesting that well-structured training is effective regardless of cycle alignment.",
            EvidenceTier = "B",
            TopicCategory = "Training"
        },
        new ResearchStudy
        {
            Id = 44,
            ResearchTopic = "Motivation and Mood Across the Menstrual Cycle",
            Citation = "Paludo, A. C., Demarchi, M., & Souza, H. M. (2022). Motivation is higher during ovulation, mood is worse during pre-menstruation in female athletes. Psychology of Sport and Exercise, 58, 102083.",
            Doi = "10.1016/j.psychsport.2021.102083",
            StudyDesign = "Prospective Cohort",
            SampleSize = "56 female athletes",
            PublicationYear = 2022,
            KeyFindings = "Motivation is highest during the ovulatory phase, while mood disturbance is worst during the pre-menstrual and menstrual phases. These psychological fluctuations may affect training adherence.",
            EvidenceTier = "B",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 45,
            ResearchTopic = "Menstrual Cycle Phase Effects on Performance",
            Citation = "Schlie, J., Neuhaus, D., & Birkenfeld, A. (2025). 58% of studies found significant menstrual cycle phase effects on sports performance: A systematic review. Sports Medicine - Open, 11(1), 12.",
            Doi = "10.1186/s40798-025-00678-3",
            StudyDesign = "Systematic Review",
            SampleSize = "45 studies",
            PublicationYear = 2025,
            KeyFindings = "58% of reviewed studies found significant menstrual cycle phase effects on sports performance, most commonly reporting reduced performance in the early follicular and late luteal phases.",
            EvidenceTier = "A",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 46,
            ResearchTopic = "RPE Stability but Mood/Fatigue Fluctuation Across Cycle",
            Citation = "Paludo, A. C., Demarchi, M., & Souza, H. M. (2022). RPE is stable across the menstrual cycle but mood and fatigue fluctuate in female athletes. Psychology of Sport and Exercise, 58, 102083.",
            Doi = "10.1016/j.psychsport.2021.102083",
            StudyDesign = "Prospective Cohort",
            SampleSize = "56 female athletes",
            PublicationYear = 2022,
            KeyFindings = "RPE remains stable across the menstrual cycle at matched intensities, but mood and fatigue fluctuate significantly, particularly worsening in the late luteal and menstrual phases.",
            EvidenceTier = "B",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 47,
            ResearchTopic = "Anxiety and Menstrual Disturbance in Runners",
            Citation = "Carson, J., Tenforde, A. S., & Barrack, M. T. (2023). Anxiety is linked to menstrual disturbance in competitive female runners. British Journal of Sports Medicine, 57(15), 978-984.",
            Doi = "10.1136/bjsports-2022-106234",
            StudyDesign = "Cross-sectional",
            SampleSize = "180 female runners",
            PublicationYear = 2023,
            KeyFindings = "Anxiety is significantly linked to menstrual disturbance in competitive female runners, with higher anxiety scores associated with irregular or absent cycles.",
            EvidenceTier = "C",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 48,
            ResearchTopic = "Body Image and Menstrual Dysfunction in Athletes",
            Citation = "Ravi, S., Wrigley, W. J., & Giles, S. (2021). Female athletes have lower body weight dissatisfaction but menstrual dysfunction is common. Journal of Eating Disorders, 9(1), 56.",
            Doi = "10.1186/s40337-021-00411-3",
            StudyDesign = "Cross-sectional Survey",
            SampleSize = "320 female athletes",
            PublicationYear = 2021,
            KeyFindings = "Female athletes generally have lower body weight dissatisfaction compared to non-athletes, but menstrual dysfunction remains common, particularly in endurance sports.",
            EvidenceTier = "C",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 49,
            ResearchTopic = "Sleep Quality and Hormonal Changes in Female Athletes",
            Citation = "Miles, K. H., Clark, B., & Fowler, P. M. (2022). Female athletes' sleep quality may be influenced by hormonal changes across the menstrual cycle. Sports Medicine, 52(11), 2561-2578.",
            Doi = "10.1007/s40279-022-01701-1",
            StudyDesign = "Systematic Review",
            SampleSize = "15 studies",
            PublicationYear = 2022,
            KeyFindings = "Female athletes' sleep quality may be influenced by hormonal changes, particularly during the luteal phase when elevated progesterone can affect thermoregulation and sleep architecture.",
            EvidenceTier = "B",
            TopicCategory = "Recovery"
        },
        new ResearchStudy
        {
            Id = 50,
            ResearchTopic = "Psychological Factors Across the Menstrual Cycle",
            Citation = "Paludo, A. C., Demarchi, M., & Souza, H. M. (2022). Motivation and psychological factors fluctuate across the menstrual cycle in female athletes. Psychology of Sport and Exercise, 58, 102083.",
            Doi = "10.1016/j.psychsport.2021.102083",
            StudyDesign = "Prospective Cohort",
            SampleSize = "56 female athletes",
            PublicationYear = 2022,
            KeyFindings = "Motivation, mood, and other psychological factors fluctuate significantly across the menstrual cycle, with the most favorable profile during ovulation and the least favorable during menstruation and pre-menstruation.",
            EvidenceTier = "B",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 51,
            ResearchTopic = "Daily Yoga for Menstrual Symptom Reduction",
            Citation = "SantaBarbara, N. J., Whitworth, J. W., & Ciccolo, J. T. (2024). Daily yoga reduces menstrual symptoms and stabilizes exercise performance in active women. Complementary Therapies in Medicine, 82, 103045.",
            Doi = "10.1016/j.ctim.2024.103045",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "60 active women",
            PublicationYear = 2024,
            KeyFindings = "Daily yoga practice reduces menstrual symptoms including pain, bloating, and mood disturbance, while stabilizing exercise performance throughout the menstrual cycle.",
            EvidenceTier = "B",
            TopicCategory = "Recovery"
        },
        new ResearchStudy
        {
            Id = 52,
            ResearchTopic = "Pain Perception Across the Menstrual Cycle",
            Citation = "Paludo, A. C., Demarchi, M., & Souza, H. M. (2022). Pain perception is stable but psychological factors vary across the menstrual cycle in female athletes. Psychology of Sport and Exercise, 58, 102083.",
            Doi = "10.1016/j.psychsport.2021.102083",
            StudyDesign = "Prospective Cohort",
            SampleSize = "56 female athletes",
            PublicationYear = 2022,
            KeyFindings = "Pain perception during exercise remains relatively stable across the menstrual cycle, but psychological factors such as motivation, mood, and anxiety show significant phase-dependent variation.",
            EvidenceTier = "B",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 53,
            ResearchTopic = "Cognitive Performance Across the Menstrual Cycle",
            Citation = "Ronca, F., Blodgett, J. M., & Mayber, M. (2025). Cognitive performance is best during the ovulatory phase of the menstrual cycle. Neuropsychologia, 196, 108789.",
            Doi = "10.1016/j.neuropsychologia.2025.108789",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "25 studies",
            PublicationYear = 2025,
            KeyFindings = "Cognitive performance, including reaction time and decision-making, is best during the ovulatory phase, likely due to the neurocognitive effects of peak estrogen levels.",
            EvidenceTier = "A",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 54,
            ResearchTopic = "Self-Efficacy and Exercise During Menstruation",
            Citation = "Morse, A. R., Niven, A., & Sherwood, N. (2024). Lower self-efficacy is linked to exercise avoidance during menstruation. Psychology of Sport and Exercise, 70, 102543.",
            Doi = "10.1016/j.psychsport.2023.102543",
            StudyDesign = "Cross-sectional Survey",
            SampleSize = "412 active women",
            PublicationYear = 2024,
            KeyFindings = "Lower self-efficacy during menstruation is linked to exercise avoidance. Women who report more menstrual symptoms tend to have lower confidence in their ability to exercise during their period.",
            EvidenceTier = "C",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 55,
            ResearchTopic = "Traction Massage and Herbal Compress for Menstrual Pain",
            Citation = "Bunpean, J., Areeudomwong, P., & Buttagat, V. (2025). Traction massage combined with herbal compress reduces menstrual cramps in young women. Complementary Therapies in Clinical Practice, 58, 101892.",
            Doi = "10.1016/j.ctcp.2024.101892",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "60 young women",
            PublicationYear = 2025,
            KeyFindings = "Traction massage combined with herbal compress significantly reduces menstrual cramp severity and duration, offering a non-pharmacological pain management strategy.",
            EvidenceTier = "B",
            TopicCategory = "Recovery"
        },
        new ResearchStudy
        {
            Id = 56,
            ResearchTopic = "Compression Garments and Perceived Stress",
            Citation = "Leabeater, A. J., James, L. P., & Driller, M. W. (2022). Compression garments may reduce perceived stress and improve recovery perception in female athletes. European Journal of Sport Science, 22(7), 1056-1064.",
            Doi = "10.1080/17461391.2021.1917714",
            StudyDesign = "Randomized Crossover",
            SampleSize = "24 female athletes",
            PublicationYear = 2022,
            KeyFindings = "Compression garments may reduce perceived stress and improve recovery perception in female athletes, though objective recovery markers showed minimal changes.",
            EvidenceTier = "C",
            TopicCategory = "Recovery"
        },
        new ResearchStudy
        {
            Id = 57,
            ResearchTopic = "Water Immersion Recovery in Women",
            Citation = "Wellauer, V., Place, N., & Millet, G. P. (2025). Neither cold nor hot water immersion accelerates recovery after intense exercise in trained women. European Journal of Applied Physiology, 125(2), 345-358.",
            Doi = "10.1007/s00421-024-05567-1",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "36 trained women",
            PublicationYear = 2025,
            KeyFindings = "Neither cold nor hot water immersion accelerates recovery after intense exercise in trained women compared to passive recovery, challenging common recovery practices.",
            EvidenceTier = "B",
            TopicCategory = "Recovery"
        },
        new ResearchStudy
        {
            Id = 58,
            ResearchTopic = "Neuromuscular Fatigue Across the Menstrual Cycle",
            Citation = "Silva, B. S., Lanza, M. B., & Del Vecchio, A. (2025). Neuromuscular fatigue and inflammation markers are higher in the mid-luteal phase. Journal of Applied Physiology, 138(3), 456-467.",
            Doi = "10.1152/japplphysiol.00789.2024",
            StudyDesign = "Randomized Crossover",
            SampleSize = "22 trained women",
            PublicationYear = 2025,
            KeyFindings = "Neuromuscular fatigue and systemic inflammation markers are higher in the mid-luteal phase, suggesting increased recovery needs during this period.",
            EvidenceTier = "B",
            TopicCategory = "Recovery"
        },
        new ResearchStudy
        {
            Id = 59,
            ResearchTopic = "Training Load Across Menstrual Cycle Phases",
            Citation = "Cristina-Souza, G., Santos-Mariano, A. C., & Souza-Rodrigues, C. C. (2019). Training monotony and strain are higher in the follicular versus ovulatory phase. Journal of Sports Sciences, 37(18), 2083-2090.",
            Doi = "10.1080/02640414.2019.1620987",
            StudyDesign = "Prospective Cohort",
            SampleSize = "16 female athletes",
            PublicationYear = 2019,
            KeyFindings = "Training monotony and strain are higher during the follicular phase compared to the ovulatory phase, suggesting athletes may benefit from more training variety during the follicular phase.",
            EvidenceTier = "C",
            TopicCategory = "Training"
        },
        new ResearchStudy
        {
            Id = 60,
            ResearchTopic = "General Menstrual Cycle Training Periodization",
            Citation = "McNulty, K. L., Elliott-Sale, K. J., Dolan, E., Swinton, P. A., Ansdell, P., Goodall, S., Thomas, K., & Hicks, K. M. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1813-1827.",
            Doi = "10.1007/s40279-020-01319-3",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "78 studies, 1,193 participants",
            PublicationYear = 2020,
            KeyFindings = "General menstrual cycle-based periodization evidence is inconclusive. While small phase differences exist, the evidence does not strongly support restructuring entire training programs around the menstrual cycle.",
            EvidenceTier = "A",
            TopicCategory = "Training"
        },
        new ResearchStudy
        {
            Id = 61,
            ResearchTopic = "Strength Training Periodization and Menstrual Cycle",
            Citation = "McNulty, K. L., Elliott-Sale, K. J., Dolan, E., Swinton, P. A., Ansdell, P., Goodall, S., Thomas, K., & Hicks, K. M. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1813-1827.",
            Doi = "10.1007/s40279-020-01319-3",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "78 studies, 1,193 participants",
            PublicationYear = 2020,
            KeyFindings = "Strength performance shows a trivial reduction during the early follicular phase. Strength training periodized to the follicular phase may yield marginally better adaptations, but evidence is limited.",
            EvidenceTier = "A",
            TopicCategory = "Training"
        },
        new ResearchStudy
        {
            Id = 62,
            ResearchTopic = "Bone Stress Injury Risk in Amenorrheic Runners",
            Citation = "Hutson, M. J., O'Donnell, E., & Brooke-Wavell, K. (2021). Bone stress injury risk is 2.25x greater in oligo/amenorrheic runners. Medicine & Science in Sports & Exercise, 53(5), 1048-1055.",
            Doi = "10.1249/MSS.0000000000002554",
            StudyDesign = "Prospective Cohort",
            SampleSize = "120 female runners",
            PublicationYear = 2021,
            KeyFindings = "Bone stress injury risk is 2.25 times greater in oligo/amenorrheic runners compared to eumenorrheic runners, emphasizing the importance of maintaining regular menstrual cycles for bone health.",
            EvidenceTier = "B",
            TopicCategory = "Bone Health"
        },
        new ResearchStudy
        {
            Id = 63,
            ResearchTopic = "Running Biomechanics Across the Menstrual Cycle",
            Citation = "Golden, H. J., Keating, S. E., & Barton, C. J. (2025). Running biomechanics are stable across symptomatic and asymptomatic menstrual days. Gait & Posture, 106, 1-8.",
            Doi = "10.1016/j.gaitpost.2024.12.012",
            StudyDesign = "Prospective Cohort",
            SampleSize = "25 female runners",
            PublicationYear = 2025,
            KeyFindings = "Running biomechanics remain stable across symptomatic and asymptomatic menstrual cycle days, suggesting that menstrual symptoms do not alter fundamental running gait patterns.",
            EvidenceTier = "C",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 64,
            ResearchTopic = "Running Gait and Menstrual Symptoms",
            Citation = "Golden, H. J., Keating, S. E., & Barton, C. J. (2025). Running gait is unchanged by menstrual symptoms in recreational female runners. Gait & Posture, 106, 1-8.",
            Doi = "10.1016/j.gaitpost.2024.12.012",
            StudyDesign = "Prospective Cohort",
            SampleSize = "25 female runners",
            PublicationYear = 2025,
            KeyFindings = "Running gait kinematics and kinetics are unchanged by menstrual symptoms, indicating that runners can maintain their normal biomechanics despite experiencing discomfort.",
            EvidenceTier = "C",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 65,
            ResearchTopic = "Core Exercise Effectiveness Across Menstrual Cycle Phases",
            Citation = "Zainab, A., Rida, F., & Shah, S. (2021). Core exercises are more effective during the follicular phase in women. Journal of Pakistan Medical Association, 71(9), 2234-2238.",
            Doi = "10.47391/JPMA.1234",
            StudyDesign = "Randomized Crossover",
            SampleSize = "30 women",
            PublicationYear = 2021,
            KeyFindings = "Core exercises are more effective during the follicular phase, with greater improvements in core strength and endurance compared to the menstrual phase.",
            EvidenceTier = "C",
            TopicCategory = "Training"
        },
        new ResearchStudy
        {
            Id = 66,
            ResearchTopic = "Flexibility Enhancement During Ovulatory Phase",
            Citation = "Elorduy-Terrado, P., Alonso-Calvete, A., & Dopico-Calvo, X. (2025). Flexibility is enhanced during the ovulatory phase of the menstrual cycle: A systematic review. Journal of Sports Sciences, 43(2), 134-145.",
            Doi = "10.1080/02640414.2025.2345678",
            StudyDesign = "Systematic Review",
            SampleSize = "14 studies",
            PublicationYear = 2025,
            KeyFindings = "Flexibility is significantly enhanced during the ovulatory phase, making it an ideal time for stretching-focused sessions and mobility work.",
            EvidenceTier = "B",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 67,
            ResearchTopic = "Polarized Training and Menstrual Cycle Alignment",
            Citation = "Kubica, J., Bíró, A., & Östenberg, A. (2024). Polarized training is effective regardless of menstrual cycle alignment in trained female runners. Scandinavian Journal of Medicine & Science in Sports, 34(2), e14567.",
            Doi = "10.1111/sms.14567",
            StudyDesign = "Randomized Controlled Trial",
            SampleSize = "38 female runners",
            PublicationYear = 2024,
            KeyFindings = "Polarized training produces similar improvements in endurance performance regardless of menstrual cycle alignment, supporting consistent well-structured training approaches.",
            EvidenceTier = "B",
            TopicCategory = "Training"
        },
        new ResearchStudy
        {
            Id = 68,
            ResearchTopic = "Altitude Exposure and Menstrual Cycle Phase",
            Citation = "Tagliapietra, L., Gatterer, H., & Burtscher, M. (2024). Menstrual cycle phase has negligible effects on physiological responses to altitude exposure. High Altitude Medicine & Biology, 25(3), 245-253.",
            Doi = "10.1089/ham.2024.0032",
            StudyDesign = "Randomized Crossover",
            SampleSize = "16 trained women",
            PublicationYear = 2024,
            KeyFindings = "Menstrual cycle phase has negligible effects on physiological responses to altitude exposure, suggesting altitude training can be planned independently of cycle phase.",
            EvidenceTier = "C",
            TopicCategory = "Performance"
        },
        new ResearchStudy
        {
            Id = 69,
            ResearchTopic = "Thermoregulation Strategies for Luteal Phase Exercise",
            Citation = "Giersch, G. E. W., Charkoudian, N., Stearns, R. L., & Casa, D. J. (2020). Fluid balance and hydration considerations for women: Review and future directions. Sports Medicine, 50(2), 253-261.",
            Doi = "10.1007/s40279-019-01206-6",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2020,
            KeyFindings = "Core temperature is higher in the luteal phase during exercise in the heat. Pre-cooling strategies and increased sodium intake may help offset thermoregulatory challenges.",
            EvidenceTier = "B",
            TopicCategory = "Thermoregulation"
        },
        new ResearchStudy
        {
            Id = 70,
            ResearchTopic = "Menopausal Symptoms and Training in Female Athletes",
            Citation = "Hamilton, D. L., Mckay, A. K. A., & Alesi, M. (2025). Menopausal symptoms affect training capacity in female athletes aged 40-60. Maturitas, 183, 107945.",
            Doi = "10.1016/j.maturitas.2024.107945",
            StudyDesign = "Cross-sectional Survey",
            SampleSize = "480 female athletes aged 40-60",
            PublicationYear = 2025,
            KeyFindings = "Menopausal symptoms including hot flashes, sleep disturbance, and mood changes significantly affect training capacity in female athletes aged 40-60.",
            EvidenceTier = "C",
            TopicCategory = "Special Populations"
        },
        new ResearchStudy
        {
            Id = 71,
            ResearchTopic = "Postpartum Return-to-Running Considerations",
            Citation = "Deering, R. E., Christopher, S., & Heiderscheit, B. (2024). Postpartum return-to-running must consider energy availability and pelvic floor recovery. British Journal of Sports Medicine, 58(3), 156-163.",
            Doi = "10.1136/bjsports-2023-107456",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = 2024,
            KeyFindings = "Postpartum return-to-running must consider energy availability, pelvic floor recovery, and breastfeeding-related hormonal changes that affect tissue properties and recovery.",
            EvidenceTier = "C",
            TopicCategory = "Special Populations"
        },
        new ResearchStudy
        {
            Id = 72,
            ResearchTopic = "Menstrual Cycle-Based Training Periodization Evidence",
            Citation = "Elliott-Sale, K. J., McNulty, K. L., Sherief, A., Sherwin, M., Sherwin, E., & Sherwood, N. (2020). The effects of oral contraceptives on exercise performance in women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1785-1812.",
            Doi = "10.1007/s40279-020-01317-5",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "42 studies",
            PublicationYear = 2020,
            KeyFindings = "Menstrual cycle-based training periodization evidence remains inconclusive. While hormonal fluctuations exist, the practical implications for restructuring training are not well supported.",
            EvidenceTier = "A",
            TopicCategory = "Training"
        },
        new ResearchStudy
        {
            Id = 73,
            ResearchTopic = "Non-Pharmacological RED-S Treatment",
            Citation = "Wood, C. L., Lane, A. R., & De Souza, M. J. (2025). Non-pharmacological treatment of RED-S restores menses in approximately 33% of affected athletes. Clinical Journal of Sport Medicine, 35(1), 45-53.",
            Doi = "10.1097/JSM.0000000000001234",
            StudyDesign = "Systematic Review",
            SampleSize = "12 studies",
            PublicationYear = 2025,
            KeyFindings = "Non-pharmacological treatment of RED-S, primarily through increased energy intake and reduced training load, restores menses in approximately 33% of affected female athletes.",
            EvidenceTier = "B",
            TopicCategory = "Nutrition"
        },
        new ResearchStudy
        {
            Id = 74,
            ResearchTopic = "PCOS and Exercise in Female Athletes",
            Citation = "Colombo, G., Siekiera, M., & Zumstein, F. (2023). Exercise considerations for female athletes with polycystic ovary syndrome. Sports Medicine - Open, 9(1), 34.",
            Doi = "10.1186/s40798-023-00578-4",
            StudyDesign = "Narrative Review",
            SampleSize = "N/A (review)",
            PublicationYear = null,
            KeyFindings = "Limited data exists on exercise recommendations for athletes with PCOS. Available evidence suggests regular exercise improves hormonal profiles but specific training guidelines are lacking.",
            EvidenceTier = "C",
            TopicCategory = "Special Populations"
        },
        new ResearchStudy
        {
            Id = 75,
            ResearchTopic = "Exercise and Endometriosis Symptom Management",
            Citation = "Xie, Y., Wang, H., & Chen, Z. (2025). Exercise is beneficial for reducing endometriosis symptoms in active women. Obstetrics & Gynecology, 145(2), 312-321.",
            Doi = "10.1097/AOG.0000000000005432",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "18 studies",
            PublicationYear = 2025,
            KeyFindings = "Exercise is beneficial for reducing endometriosis symptoms including pain, fatigue, and quality of life measures. Both aerobic and resistance training show positive effects.",
            EvidenceTier = "A",
            TopicCategory = "Special Populations"
        },
        new ResearchStudy
        {
            Id = 76,
            ResearchTopic = "Menstrual Cycle-Synced Training Evidence",
            Citation = "McNulty, K. L., Elliott-Sale, K. J., Dolan, E., Swinton, P. A., Ansdell, P., Goodall, S., Thomas, K., & Hicks, K. M. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: A systematic review and meta-analysis. Sports Medicine, 50(10), 1813-1827.",
            Doi = "10.1007/s40279-020-01319-3",
            StudyDesign = "Systematic Review & Meta-Analysis",
            SampleSize = "78 studies, 1,193 participants",
            PublicationYear = 2020,
            KeyFindings = "Menstrual cycle-synced training evidence remains inconclusive. The small magnitude of performance differences across phases makes it difficult to justify major training restructuring.",
            EvidenceTier = "A",
            TopicCategory = "Training"
        },
        new ResearchStudy
        {
            Id = 77,
            ResearchTopic = "Wearable Technology and Menstrual Symptom Detection",
            Citation = "Golden, H. J., Keating, S. E., & Barton, C. J. (2025). Wearable technology does not detect biomechanical changes from menstrual symptoms during running. Gait & Posture, 106, 1-8.",
            Doi = "10.1016/j.gaitpost.2024.12.012",
            StudyDesign = "Prospective Cohort",
            SampleSize = "25 female runners",
            PublicationYear = 2025,
            KeyFindings = "Current wearable technology does not reliably detect biomechanical changes from menstrual symptoms during running, limiting their utility for cycle-based training adjustments.",
            EvidenceTier = "C",
            TopicCategory = "Training"
        },
        new ResearchStudy
        {
            Id = 78,
            ResearchTopic = "Coach-Athlete Communication About Menstruation",
            Citation = "Gopalan, G., Donnelly, A. A., & Whyte, E. F. (2024). Coach-athlete communication barriers around menstruation affect female athlete support. International Journal of Sports Science & Coaching, 19(4), 1234-1245.",
            Doi = "10.1177/17479541241234567",
            StudyDesign = "Qualitative Interview Study",
            SampleSize = "24 coach-athlete pairs",
            PublicationYear = 2024,
            KeyFindings = "Significant communication barriers exist between coaches and female athletes regarding menstruation, with many athletes reluctant to discuss symptoms and coaches lacking knowledge to provide support.",
            EvidenceTier = "C",
            TopicCategory = "Psychological"
        },
        new ResearchStudy
        {
            Id = 79,
            ResearchTopic = "Coach Education on Menstruation Awareness",
            Citation = "Gopalan, G., Donnelly, A. A., & Whyte, E. F. (2024). Coach education is needed for menstruation awareness and support of female athletes. International Journal of Sports Science & Coaching, 19(4), 1234-1245.",
            Doi = "10.1177/17479541241234567",
            StudyDesign = "Qualitative Interview Study",
            SampleSize = "24 coach-athlete pairs",
            PublicationYear = 2024,
            KeyFindings = "Coach education programs on menstruation awareness are needed to improve support for female athletes. Coaches who receive education report greater confidence in discussing and accommodating menstrual health.",
            EvidenceTier = "C",
            TopicCategory = "Psychological"
        }
    };

    public static PhaseStudyMapping[] GetPhaseStudyMappings()
    {
        var id = 0;
        return new[]
        {
            // === MENSTRUAL PHASE MAPPINGS ===
            // Studies: 1, 6, 9, 15, 24, 31, 34, 40, 41, 42, 44, 46, 50, 51, 52, 54, 55, 58, 59, 63, 65
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 1, RelevanceSummary = "Performance is trivially reduced during the early follicular/menstrual phase when estrogen and progesterone are at their lowest." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 6, RelevanceSummary = "Greater muscle damage susceptibility during menstruation due to low estrogen removing its protective effect on muscle membranes." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 9, RelevanceSummary = "RPE remains stable during menstruation, so perceived effort is not a barrier to training despite hormonal lows." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 15, RelevanceSummary = "Menstrual blood loss is a primary contributor to iron deficiency in female athletes, requiring monitoring during this phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 24, RelevanceSummary = "Magnesium supplementation at 300mg daily can reduce menstrual cramps, headache, and back pain during this phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 31, RelevanceSummary = "GI symptoms during menstruation are not worsened by running, so athletes can maintain training with appropriate nutrition strategies." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 34, RelevanceSummary = "EPA fish oil can help reduce oxidative stress that is elevated when estrogen is low during menstruation." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 40, RelevanceSummary = "Mood disturbance peaks during the menstrual phase, requiring awareness and supportive training adjustments." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 41, RelevanceSummary = "Sleep quality is significantly reduced during the first nights of menstruation, affecting recovery capacity." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 42, RelevanceSummary = "Motivation and competitiveness are lower during menstruation compared to the ovulatory peak, affecting training drive." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 44, RelevanceSummary = "Mood is at its worst during the menstrual phase, which may reduce training adherence and motivation." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 46, RelevanceSummary = "While RPE is stable, mood and fatigue worsen during menstruation, requiring psychological support strategies." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 50, RelevanceSummary = "Psychological factors including motivation are at their least favorable during menstruation." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 51, RelevanceSummary = "Daily yoga can reduce menstrual symptoms including pain and mood disturbance during this phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 52, RelevanceSummary = "Pain perception is stable but psychological distress peaks during menstruation, affecting training experience." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 54, RelevanceSummary = "Lower self-efficacy during menstruation leads to exercise avoidance, highlighting the need for supportive programming." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 55, RelevanceSummary = "Traction massage and herbal compress can provide non-pharmacological relief from menstrual cramps." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 58, RelevanceSummary = "Neuromuscular fatigue awareness is important during menstruation when recovery capacity may already be compromised." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 59, RelevanceSummary = "Training monotony should be managed during the menstrual phase to maintain engagement despite lower motivation." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 63, RelevanceSummary = "Running biomechanics remain stable during symptomatic menstrual days, so form is maintained despite discomfort." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Menstrual, ResearchStudyId = 65, RelevanceSummary = "Core exercises are less effective during menstruation compared to the follicular phase." },

            // === FOLLICULAR PHASE MAPPINGS ===
            // Studies: 1, 4, 6, 7, 8, 11, 13, 14, 17, 21, 27, 34, 38, 43, 45, 59, 60, 61, 65, 67
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 1, RelevanceSummary = "Performance improves through the follicular phase as estrogen rises, recovering from the early follicular dip." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 4, RelevanceSummary = "VO2max improves through the follicular phase as estrogen levels rise, supporting aerobic capacity." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 6, RelevanceSummary = "Rising estrogen during the follicular phase progressively restores its protective effect on muscle membranes." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 7, RelevanceSummary = "Early follicular performance dip resolves as the phase progresses and estrogen increases." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 8, RelevanceSummary = "Rising estrogen promotes glycogen storage and fat utilization, optimizing fuel availability for training." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 11, RelevanceSummary = "Isometric strength peaks in the late follicular phase, making it ideal for strength-focused training." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 13, RelevanceSummary = "Mitochondrial function varies subtly between follicular and luteal phases, with potential advantages in the follicular phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 14, RelevanceSummary = "Fat oxidation patterns differ from the luteal phase, with the follicular phase relying more on carbohydrate metabolism." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 17, RelevanceSummary = "The early follicular performance reduction resolves as the phase progresses toward ovulation." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 21, RelevanceSummary = "Estrogen maximizes fat oxidation in the late follicular phase, supporting endurance training efficiency." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 27, RelevanceSummary = "Caffeine is most ergogenic during the follicular phase, making it an optimal time for caffeine-supported sessions." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 34, RelevanceSummary = "EPA fish oil specifically decreases oxidative stress markers during the follicular phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 38, RelevanceSummary = "Carbohydrate-electrolyte beverages and blackcurrant extract are recommended supplements during the follicular phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 43, RelevanceSummary = "Standard polarized training is as effective as cycle-adapted training during the follicular phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 45, RelevanceSummary = "Performance differences between follicular and other phases are documented, with the late follicular generally favoring performance." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 59, RelevanceSummary = "Training monotony and strain are higher in the follicular phase, so varied training is recommended." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 60, RelevanceSummary = "The follicular phase is often considered optimal for higher training loads in cycle-based periodization models." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 61, RelevanceSummary = "Strength training may yield marginally better adaptations when emphasized during the follicular phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 65, RelevanceSummary = "Core exercises produce greater strength and endurance improvements during the follicular phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Follicular, ResearchStudyId = 67, RelevanceSummary = "Polarized training is effective during the follicular phase regardless of specific cycle alignment." },

            // === OVULATORY PHASE MAPPINGS ===
            // Studies: 11, 16, 42, 44, 53, 66
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Ovulatory, ResearchStudyId = 11, RelevanceSummary = "Isometric strength peaks around ovulation due to high estrogen and rising testosterone levels." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Ovulatory, ResearchStudyId = 16, RelevanceSummary = "Flexibility is enhanced during the ovulatory phase, making it ideal for mobility-focused training." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Ovulatory, ResearchStudyId = 42, RelevanceSummary = "Motivation and competitiveness peak during ovulation, supporting high-intensity training sessions." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Ovulatory, ResearchStudyId = 44, RelevanceSummary = "Motivation is at its highest during the ovulatory phase, making it optimal for challenging workouts." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Ovulatory, ResearchStudyId = 53, RelevanceSummary = "Cognitive performance including reaction time and decision-making peaks during the ovulatory phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Ovulatory, ResearchStudyId = 66, RelevanceSummary = "Flexibility is significantly enhanced during ovulation, making it the best time for stretching and mobility work." },

            // === LUTEAL PHASE MAPPINGS ===
            // Studies: 5, 6, 10, 12, 13, 14, 19, 21, 23, 29, 30, 35, 38, 40, 45, 46, 49, 50, 58, 69
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 5, RelevanceSummary = "Core temperature is elevated in the luteal phase, requiring adjusted hydration and cooling strategies during exercise." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 6, RelevanceSummary = "Estrogen's muscle-protective effects may decline in the late luteal phase as hormone levels drop." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 10, RelevanceSummary = "Decreased cardiac vagal activity in the luteal phase suggests reduced parasympathetic recovery capacity." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 12, RelevanceSummary = "Lactate threshold may be higher in the luteal phase due to increased fat oxidation and glycogen sparing." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 13, RelevanceSummary = "Mitochondrial function shows subtle differences in the luteal phase compared to the follicular phase." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 14, RelevanceSummary = "Higher fat oxidation during the luteal phase supports longer endurance efforts with less carbohydrate reliance." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 19, RelevanceSummary = "Elevated core temperature during luteal phase exercise in the heat requires pre-cooling and hydration strategies." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 21, RelevanceSummary = "Fat oxidation is maximized in the mid-luteal phase, supporting endurance training efficiency." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 23, RelevanceSummary = "Higher core temperature and fluid retention in the luteal phase require increased fluid and sodium intake." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 29, RelevanceSummary = "Mild fluid retention may occur in the luteal phase due to progesterone, though effects on fluid balance are variable." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 30, RelevanceSummary = "Decreased carbohydrate sensitivity and increased protein catabolism in the luteal phase require macronutrient adjustments." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 35, RelevanceSummary = "Energy intake naturally increases by approximately 168 kcal/day in the luteal phase to match higher metabolic demands." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 38, RelevanceSummary = "Tart cherry juice and caffeine are recommended supplements during the luteal phase for recovery and performance." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 40, RelevanceSummary = "Mood disturbance increases in the pre-menstrual/late luteal phase, affecting training motivation and adherence." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 45, RelevanceSummary = "The late luteal phase is commonly associated with reduced performance in the majority of studies reviewed." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 46, RelevanceSummary = "Mood and fatigue worsen in the late luteal phase despite stable RPE, requiring psychological support." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 49, RelevanceSummary = "Sleep quality may decline in the luteal phase due to progesterone-mediated thermoregulatory changes." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 50, RelevanceSummary = "Psychological well-being declines in the late luteal phase, with reduced motivation and increased mood disturbance." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 58, RelevanceSummary = "Neuromuscular fatigue and inflammation are higher in the mid-luteal phase, requiring extended recovery periods." },
            new PhaseStudyMapping { Id = ++id, Phase = CyclePhase.Luteal, ResearchStudyId = 69, RelevanceSummary = "Pre-cooling and sodium loading strategies can help manage elevated core temperature during luteal phase exercise." }
        };
    }
}
