"use client";

import { useState, useEffect, useRef } from "react";
import { CardType } from "@/types/quiz";
import type { Block } from "@/types/blocks";
import { legacyLayerToBlocks } from "@/types/blocks";
import { logEvent } from "@/utils/logEvent";
import { getSessionId } from "@/utils/sessionId";
import ExpandedView from "@/components/ExpandedView";
import FeedPaperCard from "@/components/FeedPaperCard";
import placeholderCards from "@/data/placeholderCards";

interface CardDisplayProps {
    cardType: CardType;
    fieldGroup?: string;
    readingComfort?: string;
    readingGoal?: string;
    timeAvailable?: string;
    trustAnchor?: string;
    researchInterest?: string;
    confusionResponse?: string;
    normalisedScore?: number;
    onProceed: (suitability: number, calibration: 'too_basic' | 'just_right' | 'too_advanced', openFeedback: string, paperTitle: string) => void;
    excludeTitles?: string[];
}

// ─── Card Content ────────────────────────────────────────────────────────────

const DEFAULT_PAPER = {
    A: {
        maxLayer: 2,
        layers: [
            {
                label: "Preview",
                headline: "Your body doesn't age gradually. It ages in sudden bursts, and scientists just found out when.",
                body: "Most people assume the body slowly wears down over the years. A Stanford study just proved that's wrong, and it pinpointed two specific ages when your biology shifts dramatically."
            },
            {
                label: "Story",
                headline: null,
                body: "Researchers tracked 108 people for up to 7 years, regularly collecting samples of blood, skin, gut bacteria, and more. When they analysed over 135,000 different molecules inside these people's bodies, something surprising showed up: 81% of those molecules don't change gradually with age. They spike or crash in sudden windows.\n\nTwo windows stood out:\n\nAround age 44: Your body's ability to process alcohol, fats, and caffeine all shifted significantly. This might be why hangovers get worse in your 40s. Your skin and muscle tissue also begin changing around this time.\n\nAround age 60: A second, larger wave hits. The immune system weakens, kidney function begins to dip, and blood sugar regulation changes, increasing risk for diabetes and heart disease.\n\nInterestingly, these patterns showed up in both men and women. So it's not just menopause causing the mid-40s shift, something bigger is happening in everyone."
            },
            {
                label: "How they found it",
                headline: null,
                body: "The team didn't just take blood samples. They collected stool, skin swabs, saliva, and nasal samples repeatedly over years, building one of the most comprehensive biological portraits of aging ever assembled. They tracked molecules across every layer of biology: genes being switched on and off, proteins, fats, metabolites, gut bacteria, skin bacteria. Then they looked for patterns in when things changed, and the two bursts emerged clearly across all of it.\n\nSource: Nature Aging, Stanford Medicine, August 2024\nAuthors: Xiaotao Shen, Chuchu Wang, Michael P. Snyder et al."
            }
        ]
    },
    B: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "Stanford's multi-omics study: aging doesn't decline linearly, it surges in two waves at 44 and 60",
                body: "A landmark longitudinal study tracking 135,000+ biological markers found that 81% of molecules in the human body change nonlinearly with age, clustering into two high-magnitude transition periods with distinct biological mechanisms driving each."
            },
            {
                label: "The findings",
                headline: null,
                body: "108 adults aged 25–75 were tracked for a median of 1.7 years (some up to 6.8 years), with samples collected every 3–6 months across 10 types of biological data: transcriptomics, proteomics, metabolomics, cytokines, clinical lab tests, lipidomics, and gut, skin, oral, and nasal microbiomes. Only 6.6% of the 11,305 molecular features examined changed linearly with age. The majority, 81%, exhibited nonlinear patterns. All figures are from the original peer-reviewed paper: Shen et al., Nature Aging, Vol. 4, November 2024, pp. 1619–1634.\n\nTwo crests of maximal molecular dysregulation emerged consistently across all data types:\n\nCrest 1 (~age 44): Cardiovascular markers, lipid and cholesterol metabolism, alcohol metabolism, caffeine processing, and skin/muscle structural proteins all shifted. Notably, this pattern appeared in both sexes, ruling out menopause as the primary driver.\n\nCrest 2 (~age 60): Immune system dysfunction (immunosenescence), kidney function decline (glomerular filtration), carbohydrate metabolism disruption, and markers for Type 2 diabetes risk were the dominant signals.\n\nBoth crests showed shared cardiovascular dysregulation (complement cascade, blood coagulation, fibrinolysis) suggesting that heart disease risk escalates at both transition points."
            },
            {
                label: "How they found it",
                headline: null,
                body: "Two complementary analytical methods were used to identify the crests:\n\n1. Fuzzy c-means trajectory clustering: grouped the 11,305 molecular features into 11 clusters based on how their levels changed across the lifespan. Three clusters showed the clearest nonlinear patterns peaking around ages 44 and 60.\n\n2. Modified DE-SWAN algorithm: slides a 20-year window across the cohort's age range in 1-year steps, comparing molecular expression between the younger and older half of each window. This approach revealed the two-crest structure robustly across different statistical thresholds (q < 0.0001 to 0.05) and window widths (15–30 years). When participant ages were randomly permuted, the crests disappeared, confirming they reflect real biological change and not statistical noise."
            },
            {
                label: "So what",
                headline: null,
                body: "The authors identify ages 44 and 60 as actionable windows for targeted clinical screening and preventive intervention. Limitations include a small cohort (n=108), geographic concentration near Stanford, median follow-up of only 1.7 years (insufficient to track within-individual longitudinal change), and absence of lifestyle data (physical activity, alcohol/caffeine consumption) as potential confounders.\n\nSource: Nature Aging, Vol. 4, November 2024, pp. 1619–1634"
            }
        ]
    },
    C: {
        maxLayer: 2,
        layers: [
            {
                label: "Preview",
                headline: "Nonlinear multi-omics dysregulation during human aging: two crests at ~44 and ~60 via DE-SWAN and trajectory clustering (n=108, Nature Aging 2024)",
                body: "A longitudinal multi-omics study (n=108, 25–75 yrs, up to 6.8-yr follow-up) identifies two robust nonlinear dysregulation crests at ~44 and ~60, consistent across transcriptomics, proteomics, metabolomics, cytokines, lipidomics, and four microbiome types, with distinct functional module signatures at each crest and implications for nonlinear disease risk modelling."
            },
            {
                label: "Key findings",
                headline: null,
                body: "Of 11,305 molecular features, only 749 (6.6%) changed linearly by Spearman correlation. 81.03% (9,106) exhibited nonlinear dysregulation in at least one 5-year age stage vs. baseline (25–40 yr), per two-sided Wilcoxon test (unadjusted p < 0.05). Metabolomics showed the strongest age association (|r| = 0.66, p = 2.6×10⁻¹³); transcriptomics the weakest (|r| = 0.29, p = 4.5×10⁻³).\n\nAll figures are from the original peer-reviewed paper: Shen et al., Nature Aging, Vol. 4, November 2024, pp. 1619–1634.\n\nFuzzy c-means clustering (Mfuzz, R) yielded 11 trajectory clusters. Modified DE-SWAN (20-yr sliding window, 10-yr parcels, 1-yr step; BH-adjusted q < 0.05) identified crests at ages 44 and 60, robust across q-value cutoffs (0.0001–0.05) and window widths (15–30 yr), disappearing on age permutation.\n\nCrest 1 (~44) dominant modules: Complement and coagulation cascades (adj. p = 1.78×10⁻⁴⁶), platelet degranulation (adj. p = 1.77×10⁻³⁰), fibrinolysis (adj. p = 2.11×10⁻¹⁵), plasma lipoprotein remodelling, alcohol binding (adj. p = 8.49×10⁻⁷), caffeine metabolism (adj. p = 3.78×10⁻³), ECM structural constituent (adj. p = 3.32×10⁻⁸), actin filament organisation (adj. p = 8.41×10⁻⁹).\n\nCrest 2 (~60) dominant modules: Acute-phase response (adj. p = 2.85×10⁻⁸), antimicrobial humoral response (adj. p = 2.18×10⁻⁵), mononuclear cell differentiation (adj. p = 9.35×10⁻⁸), glomerular filtration (adj. p = 8.69×10⁻³), carbohydrate binding, BCAAs (valine/leucine/isoleucine; adj. p = 0.017). Male/female subgroup analyses independently reproduced the two-crest structure, dissociating the ~44 crest from menopausal aetiology."
            },
            {
                label: "Methodology and limitations",
                headline: null,
                body: "5,405 samples (1,440 blood, 926 stool, 1,116 skin, 1,001 oral, 922 nasal) across 108 participants (51.9% female; median BMI 28.2; diverse ethnicity). 10 omics types: transcriptomics from PBMCs (Illumina HiSeq 2000; HTseq/DESeq2; 8,556 features), SWATH proteomics (TripleTOF 6600; 302 proteins; FDR 1% peptide/10% protein), untargeted metabolomics (HILIC/RPLC, Thermo Q Exactive Plus; 814 features), cytokines (66), clinical labs (51), lipidomics (846), microbiomes via genus-level taxonomy (gut/skin/oral/nasal). Confounders (BMI, sex, IRIS, ethnicity) adjusted via linear regression residuals. LOESS smoothing applied prior to clustering. Pathway enrichment via clusterProfiler (GO/KEGG/Reactome); redundancy reduced via Jaccard-index similarity networks and edge-betweenness community detection (igraph).\n\nLimitations: n=108 with only 8 participants aged 25–40 (underpowers baseline); Stanford-proximate cohort; median follow-up 1.7 yr (insufficient for intra-individual trajectory detection); absent lifestyle covariates (physical activity, alcohol/caffeine intake); blood-derived transcriptomics limits tissue-specific interpretation."
            }
        ]
    }
};

const MEDICINE_PAPER = {
    A: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "The First Drug That Actually Slows Alzheimer's, Not Just Treats It",
                body: "For decades, every drug developed for Alzheimer's disease could only reduce symptoms. A 2023 trial involving 1,795 people found the first drug that slows the disease itself.",
            },
            {
                label: "Story",
                headline: null,
                body: "Alzheimer's disease damages the brain partly because a protein called amyloid builds up into sticky plaques between brain cells, disrupting how they communicate. Lecanemab is a drug that targets and clears these plaques directly. In an 18-month trial, patients on lecanemab experienced 27% less cognitive decline compared to those on a placebo. Their memory, judgment, and ability to manage daily tasks deteriorated noticeably more slowly. This is not a cure, and it does not stop Alzheimer's. But for someone in the early stages of the disease, it represents real extra time: more months of recognising family, making decisions independently, and living with dignity before the disease advances.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "The trial enrolled 1,795 participants aged 50 to 90 with early-stage Alzheimer's, confirmed by brain scans showing amyloid buildup. Half received lecanemab injections every two weeks; half received a placebo. After 18 months, researchers measured decline using the CDR-SB, a standard scale rating memory, orientation, judgment, and daily function from 0 (no impairment) to 18 (severe). Both groups declined, but the lecanemab group declined significantly less.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Van Dyck CH, et al. Lecanemab in Early Alzheimer's Disease. New England Journal of Medicine. 2023;388:9-21. https://doi.org/10.1056/NEJMoa2212948

All figures including the 27% slowing of decline and 1,795 participant sample are reported directly from the published Phase 3 trial in the New England Journal of Medicine. Full text available at https://pmc.ncbi.nlm.nih.gov/articles/PMC10512855/`,
            }
        ]
    },
    B: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "Lecanemab Slows Alzheimer's Progression by 27%: A First in Disease Modification",
                body: "A landmark Phase 3 trial published in the NEJM in 2023 demonstrated that lecanemab, an anti-amyloid antibody, produced statistically significant slowing of cognitive and functional decline in early Alzheimer's patients over 18 months. This is the first drug in history to demonstrate disease modification at this scale, rather than symptom management alone.",
            },
            {
                label: "The findings",
                headline: null,
                body: "Lecanemab works by binding to soluble amyloid-beta protofibrils, the toxic aggregating form of the amyloid protein, and clearing them from the brain. The trial measured outcomes using the CDR-SB scale, which assesses six domains: memory, orientation, judgment, community activities, home activities, and personal care. After 18 months, the lecanemab group scored 1.21 points worse from baseline while the placebo group scored 1.66 points worse. This difference of 0.45 points represents a 27% slowing of decline. Secondary endpoints including the ADAS-Cog14 cognitive battery and ADCS-MCI-ADL functional scale showed consistent benefit. In a substudy, brain amyloid burden was reduced by an average of 59.1 centiloids, confirming the drug's mechanism was working as intended.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "This was a randomised, double-blind, placebo-controlled Phase 3 trial across 96 sites in 13 countries. Participants received 10 mg/kg intravenous lecanemab or placebo every two weeks for 18 months. Inclusion required confirmed amyloid pathology via PET scan or CSF biomarkers. The primary endpoint was CDR-SB change from baseline at 18 months, analysed by mixed-model repeated-measures. The trial was powered at 90% to detect a 25% difference between arms.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Van Dyck CH, et al. Lecanemab in Early Alzheimer's Disease. New England Journal of Medicine. 2023;388:9-21. https://doi.org/10.1056/NEJMoa2212948

All statistics are sourced directly from the published Clarity AD Phase 3 trial. CDR-SB values, centiloid reduction, and ARIA incidence figures are as reported in the primary NEJM publication. Full text available via PubMed Central.`,
            }
        ]
    },
    C: {
        maxLayer: 4,
        layers: [
            {
                label: "Preview",
                headline: "Clarity AD Phase 3: Lecanemab Achieves 27% CDR-SB Slowing via Amyloid-Beta Protofibril Clearance",
                body: "The Clarity AD trial establishes lecanemab as the first anti-amyloid immunotherapy to demonstrate statistically significant, clinically meaningful disease modification in early Alzheimer's disease at Phase 3 scale. The 0.45-point CDR-SB treatment difference at 18 months (p less than 0.001) was achieved alongside confirmed target engagement: a 59.1 centiloid mean amyloid reduction.",
            },
            {
                label: "Findings",
                headline: null,
                body: "Lecanemab is a humanised IgG1 monoclonal antibody with preferential binding affinity for soluble amyloid-beta protofibrils over monomers and insoluble fibrils. Adjusted least-squares mean CDR-SB change from baseline was 1.21 in the lecanemab arm versus 1.66 in the placebo arm (difference: 0.45; 95% CI, 0.67 to 0.23; p less than 0.001), representing a 27% relative slowing of decline. All secondary endpoints were directionally consistent: ADAS-Cog14 at 26% slowing, ADCS-MCI-ADL at 37% slowing, and iADRS at 26% slowing. The amyloid PET substudy confirmed 59.1 centiloid mean reduction versus 2.1 centiloids gained in placebo, with 80% of lecanemab recipients reaching amyloid-negative status at 18 months.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "Clarity AD was a randomised (1:1), double-blind, placebo-controlled, Phase 3 multicentre trial. N=1,795 (lecanemab: 898; placebo: 897). Eligibility required age 50 to 90, MCI or mild AD dementia, confirmed amyloid pathology, and CDR global score 0.5 or 1.0. Intervention: 10 mg/kg IV lecanemab every two weeks for 18 months. Primary endpoint analysed via mixed-model repeated-measures with treatment, visit, baseline CDR-SB, region, and ApoE status as covariates.",
            },
            {
                label: "Technical detail",
                headline: null,
                body: "ARIA-E incidence was 12.6% in the lecanemab group versus 1.7% in placebo. ARIA-H incidence was 17.3% versus 9.0%. Risk is substantially elevated in ApoE e4 homozygotes, with ARIA-E rates of 35.0% versus 10.3% in non-carriers. The 0.45-point CDR-SB difference exceeds the lower bound of the Minimal Clinically Important Difference range (0.35 to 0.98 points), making clinical meaningfulness a legitimately contested question in the literature. In absolute terms, the 27% slowing translates to approximately 5 months of slower progression over 18 months. The ongoing AHEAD 3-45 trial is testing lecanemab in preclinical participants who are amyloid-positive but cognitively normal.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Van Dyck CH, et al. Lecanemab in Early Alzheimer's Disease. New England Journal of Medicine. 2023;388:9-21. DOI: 10.1056/NEJMoa2212948. ClinicalTrials.gov: NCT03887455.

All quantitative values including CDR-SB means, confidence intervals, ARIA incidence rates, and centiloid reductions are reported verbatim from the primary Phase 3 publication. No values have been inferred or approximated. Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC10512855/`,
            }
        ]
    }
};

const DESIGN_PAPER = {
    A: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "Your Phone's Screen Time Data Is More Honest Than You Are",
                body: "When researchers compared what people said about their screen time with what their devices actually recorded, the two numbers barely matched. A 2021 study combining 47 separate research projects and over 52,000 people found that human estimates of digital media use are far less accurate than most people assume.",
            },
            {
                label: "Story",
                headline: null,
                body: "Across those 47 studies, only 6 in every 100 people gave a screen time estimate that came close to what their device actually logged. The rest were significantly off, and not in a predictable direction. Some overestimated, some underestimated. This matters because almost everything we believe about phone addiction, social media harm, and screen time guidelines is based on surveys asking people how much they use their devices. If those surveys are unreliable, the conclusions built on them are shaky too. The researchers also found that questionnaires designed to measure problematic or addictive phone use were even less connected to actual logged behaviour than basic time estimates.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "The researchers searched six academic databases and identified 47 studies that measured both what people said about their screen time and what their devices actually recorded. They combined the results using a statistical method that accounts for the fact that some studies contributed multiple measurements. The total number of participants across the main analysis was 52,007.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Parry DA, et al. A systematic review and meta-analysis of discrepancies between logged and self-reported digital media use. Nature Human Behaviour. 2021;5:1535-1547. https://doi.org/10.1038/s41562-021-01117-5

All figures including the 6% accuracy rate and participant count are reported directly from the published meta-analysis in Nature Human Behaviour. Full text available at https://gwern.net/doc/psychology/2021-parry.pdf`,
            },
        ],
    },
    B: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "Screen Time Self-Reports Correlate With Reality at Only r = 0.38, Undermining a Decade of Digital Wellbeing Research",
                body: "A pre-registered meta-analysis published in Nature Human Behaviour synthesised 47 studies and 52,007 participants to assess how accurately people estimate their own digital media use. The finding is direct: self-reports correlate with device logs at r = 0.38, well below the convergent validity threshold. They cannot be treated as reliable proxies for actual behaviour.",
            },
            {
                label: "The findings",
                headline: null,
                body: "The meta-analysis found a positive but only moderate association between self-reported and logged media use (r = 0.38, 95% CI 0.33 to 0.42, p less than 0.001). This falls below the r = 0.5 threshold the researchers identify as necessary for two measures to be considered interchangeable. Accuracy analysis across 49 effect sizes found that only 6.12% of self-reported estimates fell within 5% of the logged mean. Roughly equal proportions of studies showed over- and under-reporting, indicating the error is large in magnitude but not consistent in direction. For problematic media use scales, the association is weaker still at r = 0.25 (95% CI 0.20 to 0.29). The implication is that screen time surveys are measuring perceived behaviour, not actual behaviour, and the two are substantially different constructs.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "Pre-registered systematic review and meta-analysis. Six databases searched yielding 12,132 records; 47 records met eligibility criteria, producing 106 effect sizes. Main correlation analysis: 66 effect sizes from 44 studies, N = 52,007. Reporting accuracy analysis: 49 comparisons from 30 studies, N = 17,523. Analysis used robust variance estimation to account for dependent effect sizes within studies. Heterogeneity was high across the main analysis (I2 = 92.18%), indicating substantial variation in measurement accuracy across study contexts.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Parry DA, Davidson BI, Sewall CJR, Fisher JT, Mieczkowski H, Quintana DS. A systematic review and meta-analysis of discrepancies between logged and self-reported digital media use. Nature Human Behaviour. 2021;5:1535-1547. https://doi.org/10.1038/s41562-021-01117-5

All statistics including the r = 0.38 summary effect, 95% confidence intervals, and 6.12% accuracy rate are reported directly from the primary publication.`,
            },
        ],
    },
    C: {
        maxLayer: 4,
        layers: [
            {
                label: "Preview",
                headline: "Parry et al. 2021: r = 0.38 Meta-Analytic Correlation Reveals Convergent Validity Crisis in Self-Reported Digital Media Use Research",
                body: "This pre-registered meta-analysis of 106 effect sizes across 52,007 participants establishes that self-reported digital media use fails to meet basic convergent validity criteria relative to device logs (r = 0.38, 95% CI 0.33 to 0.42). Fewer than 7% of self-report estimates fall within 5% of logged values. For researchers designing studies with media use as a variable, this constitutes a fundamental measurement validity challenge.",
            },
            {
                label: "Findings",
                headline: null,
                body: "The summary correlation of r = 0.38 was calculated using robust variance estimation, accounting for dependency among the 106 effect sizes nested within 47 studies. The authors identify r = 0.5 as the minimum convergent validity threshold; the obtained value falls meaningfully below this benchmark. Heterogeneity was substantial (I2 = 92.18%, Q(63) = 734.89, p less than 0.001), suggesting the weak correlation is not uniform and that contextual moderators substantially affect measurement accuracy. Moderator analyses found no significant effects for medium type, self-report form, or self-report category, leaving the primary sources of heterogeneity unresolved. The problematic use analysis (r = 0.25, 95% CI 0.20 to 0.29, k = 40, N = 5,552) showed lower heterogeneity (I2 = 29.41%), suggesting more consistent but uniformly weak associations between addiction scales and actual logged usage.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "Pre-registered (OSF: osf.io/dhx48) systematic review following PRISMA guidelines. Six databases: Scopus, PubMed, PsychInfo, ACM Digital Library, Communication and Mass Media Complete, ProQuest Dissertations. Initial yield: 12,132 records. Final inclusion: 47 records yielding 106 effect sizes. Quality assessment via Q-SSP checklist: 55.56% rated acceptable, mean score 66.60/100. Robust variance estimation used throughout to handle dependent effects.",
            },
            {
                label: "Technical detail",
                headline: null,
                body: "Reporting accuracy analysis: weighted ratio of means R = 1.21 (95% CI 0.94 to 1.54, p = 0.129). The confidence interval spans accurate reporting, over-reporting, and under-reporting, meaning the direction of error is not statistically established. Claims of systematic overestimation are not supported by this paper's own test. The high heterogeneity (I2 = 92.18%) combined with null moderator results suggests unmeasured study-level variables drive accuracy differences, likely including ecological momentary assessment design, log granularity, and participant awareness of being measured. For design researchers: retrospective survey instruments measuring digital behaviour frequency or duration should be treated as perceptual proxies rather than behavioural measures. Log-based methods should be prioritised wherever feasible.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Parry DA, Davidson BI, Sewall CJR, Fisher JT, Mieczkowski H, Quintana DS. A systematic review and meta-analysis of discrepancies between logged and self-reported digital media use. Nature Human Behaviour. 2021;5:1535-1547. DOI: 10.1038/s41562-021-01117-5. Pre-registration: osf.io/dhx48.

All values including the r = 0.38 summary correlation, I2 = 92.18% heterogeneity, R = 1.21 reporting ratio, and 6.12% accuracy rate are reported verbatim from the primary publication. No values have been inferred or approximated.`,
            },
        ],
    }
};

const ENGINEERING_PAPER = {
    A: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "Self-Driving Cars Are Safer Than Humans in Most Situations, But Have One Dangerous Blind Spot",
                body: "Researchers analysed over 37,000 real road accidents in California to compare self-driving cars with human drivers under the same conditions. The result is more nuanced than headlines suggest: autonomous vehicles are generally safer, but significantly worse in specific situations most drivers encounter daily.",
            },
            {
                label: "Story",
                headline: null,
                body: "After matching accidents for road conditions, weather, and time of day, the study found that self-driving systems were safer than human drivers across most scenarios. Only 1.8% of self-driving car accidents were caused by inattention or poor decision-making, compared to 19.8% for human drivers. But two situations revealed a clear weakness: at dawn and dusk, self-driving cars were 5.25 times more likely to be involved in accidents than human drivers. While turning, they were nearly twice as likely to crash. This points to a specific technical gap: the sensors these vehicles rely on struggle in low and shifting light, and turning requires a level of situational awareness that current systems have not fully solved. The overall safety picture is positive, but these failure conditions matter because they are common, everyday situations, not rare edge cases.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "The researchers used California accident data from 2016 to 2022, which required manufacturers to report all accidents. They started with 2,100 accidents involving vehicles with automated driving systems and 35,113 involving human drivers. To ensure a fair comparison, they used a matched case-control method, pairing each autonomous vehicle accident with human driver accidents that happened under the same road conditions, weather, time of day, and location. This produced 548 matched pairs for the main analysis.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Abdel-Aty M, Ding S. A matched case-control analysis of autonomous vs human-driven vehicle accidents. Nature Communications. 2024;15:4931. https://doi.org/10.1038/s41467-024-48526-4

All figures including the 5.25 times dawn/dusk risk and 1.98 times turning risk are reported directly from the published study in Nature Communications. Full text available at https://www.nature.com/articles/s41467-024-48526-4`,
            },
        ],
    },
    B: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "Autonomous Driving Systems Are Safer Than Human Drivers Except at Dawn/Dusk (5.25x Risk) and While Turning (1.98x Risk)",
                body: "A matched case-control study published in Nature Communications analysed 37,213 California road accidents between 2016 and 2022 to compare accident risk between vehicles with Advanced Driving Systems and human-driven vehicles under comparable conditions. The headline finding is that ADS are generally safer, with two statistically significant exceptions that point to specific sensor and situational awareness limitations.",
            },
            {
                label: "The findings",
                headline: null,
                body: "After matching 548 ADS accidents with human-driven vehicle accidents on road conditions, weather, time of day, and location, the logistic regression model found that ADS generally reduce accident probability across most scenarios. Inattention or poor driving behaviour accounted for only 1.8% of ADS accidents versus 19.8% for human-driven vehicles. However, two conditions showed significantly elevated risk for ADS: dawn/dusk lighting (OR = 5.25, indicating 5.25 times higher accident likelihood than HDVs) and turning manoeuvres (OR = 1.988). ADS also showed a 5% accident rate in work zones and traffic event areas compared to 1.3% for human drivers, suggesting difficulty with non-standard road conditions. From a severity perspective, ADS showed decreased probability of moderate and fatal injury accidents relative to HDVs, indicating that when accidents do occur, they tend to be less severe.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "Cross-sectional matched case-control study using California SWITRS and DMV AV accident reports (2016 to 2022). Initial dataset: 2,100 ADS/ADAS accidents and 35,113 HDV accidents. Matched case-control design controlled for road surface, weather, lighting, junction type, and traffic conditions. Final matched analysis: 548 ADS accidents paired with HDV accidents under comparable conditions. Statistical method: conditional logistic regression on matched pairs. Accident categories distinguished between full ADS (SAE Level 3 to 5) and ADAS (Level 1 to 2).",
            },
            {
                label: "Sources",
                headline: null,
                body: `Abdel-Aty M, Ding S. A matched case-control analysis of autonomous vs human-driven vehicle accidents. Nature Communications. 2024;15:4931. https://doi.org/10.1038/s41467-024-48526-4

All odds ratios and accident percentages are reported directly from the primary publication. Full text available at https://www.nature.com/articles/s41467-024-48526-4`,
            },
        ],
    },
    C: {
        maxLayer: 4,
        layers: [
            {
                label: "Preview",
                headline: "Abdel-Aty & Ding 2024: Matched Case-Control Logistic Regression Quantifies ADS vs HDV Accident Risk Disparities Across Operational Conditions",
                body: "This matched case-control study of 548 ADS accident pairs from California's mandatory AV incident reporting database (2016 to 2022) establishes condition-specific odds ratios for ADS accident risk relative to HDVs. ADS demonstrate lower accident probability in most operational conditions but show statistically significant elevated risk under dawn/dusk illumination (OR = 5.25) and turning manoeuvres (OR = 1.988), identifying specific failure modes in current sensor and decision architectures.",
            },
            {
                label: "Findings",
                headline: null,
                body: "Conditional logistic regression on 548 matched pairs produced the primary odds ratios. Pre-accident movement analysis identified turning as the only movement category increasing ADS accident likelihood (OR = 1.988) versus HDVs, while backing (OR less than 1) and lane entry (OR = 0.267) showed reduced ADS risk. Inattention or poor driving behaviour accounted for 1.8% of ADS accidents versus 19.8% for HDVs, reflecting the elimination of human attentional failure as a primary accident cause. For severity, ADS showed decreased probability for both moderate and fatal injury accidents, with ADAS accidents showing 11.37% higher no-injury rate but 2.1% lower fatal injury rate than ADS-only accidents. Work zone and traffic event locations showed a 5% ADS accident rate versus 1.3% HDV, suggesting difficulty with non-nominal operational design domain conditions.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "Dataset: California SWITRS (2016 to 2022) merged with DMV mandatory AV accident reports. Initial ADS/ADAS sample: 2,100 vehicles; HDV comparison pool: 35,113. Matching variables: road surface condition, weather, lighting condition, junction type, traffic control, and speed limit. Final matched pairs: 548. Statistical model: conditional logistic regression with matched sets as strata. ADS sub-classification distinguished SAE Level 3 to 5 (full ADS) from Level 1 to 2 (ADAS) for secondary analyses.",
            },
            {
                label: "Technical detail",
                headline: null,
                body: "Two methodological limitations the authors explicitly acknowledge. First, the ADS sample size of 548 matched accidents is small relative to the HDV comparison pool, reducing statistical power for subgroup analyses and widening confidence intervals for the OR estimates. Second, ADS accident data relies on manufacturer self-reporting to the California DMV, introducing potential systematic underreporting bias — if manufacturers selectively underreport minor incidents, the ADS safety advantage may be overstated. The dawn/dusk OR of 5.25 aligns mechanistically with known limitations of camera-based perception systems under high-dynamic-range lighting conditions. LiDAR-dominant sensor architectures show lower susceptibility to this specific failure mode, suggesting the finding may not generalise equally across all ADS hardware configurations. The turning OR of 1.988 likely reflects gaps in V2X communication and multi-agent prediction models rather than raw sensor failure.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Abdel-Aty M, Ding S. A matched case-control analysis of autonomous vs human-driven vehicle accidents. Nature Communications. 2024;15:4931. DOI: 10.1038/s41467-024-48526-4.

All odds ratios, accident percentages, and matched pair counts are reported verbatim from the primary publication. The methodological limitations noted are drawn from the paper's own Discussion section. No values have been inferred or approximated.`,
            },
        ],
    }
};

const BUSINESS_PAPER = {
    A: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "The Largest Real-World Trial on Hybrid Work Has a Clear Answer: Let People Work From Home Two Days a Week",
                body: "For years, executives and employees have argued about whether working from home hurts productivity. In 2021, a Chinese technology company ran a six-month randomised experiment on 1,612 of its own employees to find out. The results, published in Nature in 2024, are clearer than most people expected.",
            },
            {
                label: "Story",
                headline: null,
                body: "Employees were randomly assigned to either work from home on Wednesdays and Fridays, or come into the office five days a week. After six months, the hybrid group was one-third less likely to quit their jobs — attrition dropped from 7.2% to 4.8%. Job satisfaction scores rose significantly. The effect was especially strong for women, whose quit rate fell by 54%, and for employees with long commutes, whose quit rate fell by 52%. At the same time, performance reviews, promotion rates, and even the number of lines of code written by engineers showed no difference between the two groups across two full years of follow-up. Managers, who were sceptical before the experiment (expecting a 2.6% productivity drop), changed their minds after it (expecting a 1% gain). The company found the result convincing enough to extend the policy to all 35,000 employees the day the experiment ended.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "Researchers from Stanford, Peking University, and the Chinese University of Hong Kong ran a six-month randomised controlled trial at Trip.com in Shanghai from August 2021 to January 2022. Employees were randomised by whether their birthday fell on an odd or even date of the month. The hybrid group worked from home on Wednesdays and Fridays. Performance was tracked for two full years after the experiment using the company's official review system and promotion records.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Bloom N, Han R, Liang J. Hybrid working from home improves retention without damaging performance. Nature. 2024;630:920-925. https://doi.org/10.1038/s41586-024-07500-2

All figures including the one-third quit rate reduction, 54% female retention improvement, and two-year performance equivalence results are reported directly from the published randomised controlled trial in Nature. Full text available at https://pmc.ncbi.nlm.nih.gov/articles/PMC11208135/`,
            },
        ],
    },
    B: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "Hybrid Work RCT: One-Third Reduction in Attrition, Zero Performance Impact Across Two Years of Reviews",
                body: "A six-month randomised controlled trial on 1,612 employees at Trip.com, published in Nature in 2024, provides the strongest causal evidence to date on hybrid work. Hybrid scheduling reduced quit rates by one-third and improved job satisfaction significantly, while null equivalence tests across four consecutive performance review periods confirmed no detectable effect on output.",
            },
            {
                label: "The findings",
                headline: null,
                body: "The attrition reduction was statistically significant: control group attrition was 7.2%, treatment group 4.8% (t(1610) = 2.02, p = 0.043), a 33% relative reduction. Job satisfaction improved significantly (p less than 0.001) across all measured dimensions including work-life balance, life satisfaction, and intention to quit. Subgroup analysis found the largest attrition effects for non-managers (40% reduction, p = 0.026), female employees (54% reduction, p = 0.017), and long-commute employees (52% reduction, p = 0.062). For performance, equivalence testing across four six-monthly review periods confirmed null effects. Lines of code submitted by the 653 computer engineers also showed no treatment effect. Managers' self-assessed productivity beliefs shifted from -2.6% pre-experiment to +1.0% post-experiment, converging with non-managers' consistently positive views (p = 0.345 for end-line difference). The firm calculated that each quit cost approximately $20,000 in recruitment and training, making the one-third attrition reduction financially significant independent of any productivity effect.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "Randomised controlled trial, August 2021 to January 2022, Trip.com Shanghai. N = 1,612 graduate employees across engineering, marketing, accounting, and finance. Randomisation by odd/even birthday within the month. Treatment: option to WFH Wednesday and Friday; control: five days in office. Primary outcomes: attrition and performance reviews. Performance tracked for two full years post-experiment. Equivalence bounds set at plus or minus 0.5 performance grade points (TOST procedure). Promotion equivalence bounds set at plus or minus 2 percentage points.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Bloom N, Han R, Liang J. Hybrid working from home improves retention without damaging performance. Nature. 2024;630:920-925. https://doi.org/10.1038/s41586-024-07500-2

All statistics including t-statistics, p-values, and subgroup effect sizes are reported directly from the primary publication. Full text available at https://pmc.ncbi.nlm.nih.gov/articles/PMC11208135/`,
            },
        ],
    },
    C: {
        maxLayer: 4,
        layers: [
            {
                label: "Preview",
                headline: "Bloom et al. 2024: RCT Evidence on Hybrid WFH Shows 33% Attrition Reduction with Null Equivalence on Performance Across Four Review Periods",
                body: "This pre-registered RCT of 1,612 Trip.com employees provides the first large-scale causal evidence on hybrid (as distinct from fully remote) working. The study separates two confounded questions in prior WFH literature: whether full remote work damages productivity (prior evidence: often yes) versus whether hybrid scheduling does (this paper: no, confirmed via equivalence testing). The 33% attrition reduction represents a material organisational cost saving independent of any productivity consideration.",
            },
            {
                label: "Findings",
                headline: null,
                body: "Attrition: control 7.20%, treatment 4.80%, difference 2.4pp, t(1610) = 2.02, p = 0.043. Job satisfaction composite score: control 7.84, treatment 8.19, t(1343) = 4.17, p less than 0.001. Subgroup heterogeneity in attrition: non-managers (control 8.59%, treatment 5.33%, p = 0.026), female employees (control 9.19%, treatment 4.18%, p = 0.017), long commuters (control 6.00%, treatment 2.89%, p = 0.062). Manager attrition effect was insignificant and directionally opposite (p = 0.922). Performance equivalence confirmed across all four six-monthly review periods (TOST p less than 0.001 for each period against plus or minus 0.5 grade bound). Lines of code equivalence confirmed (TOST p = 0.003 against plus or minus 29 lines/day bound). Manager self-assessed productivity: baseline mean -2.6% (managers) vs +0.7% (non-managers), t(1313) = -4.56, p less than 0.001; end-line convergence: managers +1.0% vs non-managers +1.62%, p = 0.345.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "RCT, Trip.com Shanghai, Airfare and IT divisions. N = 1,612 (395 managers, 1,217 non-managers). Randomisation: odd vs even birthday within month. Treatment: WFH eligibility Wednesday and Friday for six months. Actual WFH take-up: approximately 55% volunteers, 40% non-volunteers. Performance follow-up: four semi-annual review cycles, 24 months post-randomisation. TOST equivalence procedure used for null performance claims. Lines of code data available for 653 engineers only.",
            },
            {
                label: "Technical detail",
                headline: null,
                body: "Three limitations require note for researchers applying these findings. First, the study was conducted at a single Chinese technology firm; generalisability to Western contexts, service industries, or fully creative roles is assumed but not demonstrated. Second, WFH take-up was partial — most employees used only Friday, not both permitted days — meaning the intervention was effectively one day WFH per week in practice, not two. Effect sizes may underestimate what a fully utilised two-day hybrid schedule would produce. Third, the promotion equivalence result is mixed: confirmed for two of four periods but underpowered for the others, leaving open the question of whether hybrid work affects long-term career progression. The female attrition finding (54% reduction, p = 0.017) is the most striking subgroup result but the low volunteer rate among female employees (32% vs 35% for men) suggests career-signalling concerns may be suppressing optimal take-up in hybrid schemes that are not mandatory.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Bloom N, Han R, Liang J. Hybrid working from home improves retention without damaging performance. Nature. 2024;630:920-925. DOI: 10.1038/s41586-024-07500-2. PMC: PMC11208135.

All values including t-statistics, p-values, TOST results, and subgroup effect sizes are reported verbatim from the primary publication. No values have been inferred or approximated. Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC11208135/`,
            },
        ],
    }
};

const SOCIAL_SCIENCES_PAPER = {
    A: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "73 Research Teams Studied the Exact Same Question With the Same Data. They Got Completely Different Answers.",
                body: "What happens when independent scientists all analyse the same dataset to test the same hypothesis? A 2022 study coordinated 73 research teams to find out. The answer should change how you read any scientific finding reported in the news.",
            },
            {
                label: "Story",
                headline: null,
                body: "All 73 teams were given identical data and the same research question: does higher immigration reduce public support for social welfare policies? Every team was independent, qualified, and working in good faith. Yet their results ranged from large negative effects to large positive effects — opposite conclusions from the same data. This was not caused by fraud, incompetence, or ideological bias. It was caused by the hundreds of small, legitimate methodological choices every researcher makes along the way: which variables to include, how to handle missing data, which statistical model to use. More than 95% of the variation in outcomes could not be explained even after cataloguing every decision each team made. The study's conclusion is direct: a single published study tells you less than you think it does, and the uncertainty hidden behind any one finding is far larger than the confidence intervals reported in the paper.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "The researchers recruited 161 scientists organised into 73 independent teams. Each team received the same cross-country survey dataset and the same written hypothesis to test. Teams worked independently and submitted their results, which the coordinating researchers then compared. All team decisions were qualitatively coded and analysed to understand how much of the variation in results could be explained by identifiable choices.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Breznau N, et al. Observing many researchers using the same data and hypothesis reveals a hidden universe of uncertainty. Proceedings of the National Academy of Sciences. 2022;119(44):e2203150119. https://doi.org/10.1073/pnas.2203150119

All figures including the 73 teams, 161 researchers, and 95% unexplained variance are reported directly from the published study in PNAS. Full text available at https://pmc.ncbi.nlm.nih.gov/articles/PMC9636921/`,
            },
        ],
    },
    B: {
        maxLayer: 3,
        layers: [
            {
                label: "Preview",
                headline: "Many-Analyst Study: 73 Independent Teams, Same Data, Opposite Conclusions — 95% of Result Variance Unexplained",
                body: "A coordinated metascience experiment published in PNAS in 2022 assigned 73 independent research teams to test the same social science hypothesis using identical data. Teams produced widely diverging numerical estimates and opposing substantive conclusions. Even after coding every identifiable methodological decision, more than 95% of the variance in results remained unexplained, revealing what the authors call a hidden universe of analytical uncertainty.",
            },
            {
                label: "The findings",
                headline: null,
                body: "The study tested the hypothesis that greater immigration reduces public support for government social policy provision — a prominent, contested claim in political sociology. All 73 teams used the same cross-country survey dataset with no restrictions on analytical approach. Results ranged from large negative to large positive effects, with no convergence around a consensus estimate. Researchers' prior beliefs, expertise level, and field of specialisation were poor predictors of their results. The coordinating team qualitatively coded all identifiable analytical decisions across workflows and found these choices explained very little of the divergence. The implication is that outcome variation in social science is substantially idiosyncratic: driven by implicit, difficult-to-detect analytical micro-decisions that do not appear in methods sections and cannot be recovered by replication alone.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "Coordinated many-analyst design. 161 researchers in 73 independent teams recruited through professional networks. Each team received identical ISSP cross-country survey data and the same written hypothesis. Teams submitted numerical results, analytical code, and written conclusions. Coordinating researchers coded each team's methodological choices across a standardised taxonomy. Variance decomposition analysis assessed how much of total result variation was attributable to coded decisions versus residual idiosyncrasy.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Breznau N, Rinke EM, Wuttke A, et al. Observing many researchers using the same data and hypothesis reveals a hidden universe of uncertainty. Proceedings of the National Academy of Sciences. 2022;119(44):e2203150119. https://doi.org/10.1073/pnas.2203150119

All statistics including the 95% unexplained variance figure are reported directly from the primary publication. Full text available at https://pmc.ncbi.nlm.nih.gov/articles/PMC9636921/`,
            },
        ],
    },
    C: {
        maxLayer: 4,
        layers: [
            {
                label: "Preview",
                headline: "Breznau et al. 2022: Many-Analyst Variance Decomposition Reveals Idiosyncratic Analytical Decisions as Primary Driver of Social Science Result Heterogeneity",
                body: "This coordinated many-analyst study of 73 independent research teams demonstrates that researcher degrees of freedom in social science produce outcome heterogeneity that cannot be reduced to systematic bias, prior beliefs, or expertise. More than 95% of variance in numerical effect-size estimates remains unaccounted for after comprehensive coding of all identifiable analytical decisions, establishing idiosyncratic analytical choices as a previously underappreciated driver of contested empirical findings.",
            },
            {
                label: "Findings",
                headline: null,
                body: "All 73 teams tested an identical hypothesis (immigration reduces social policy support) using identical ISSP cross-country survey data. Results ranged continuously from large negative to large positive effects with no discernible consensus cluster. Predictors of result variation that were coded and tested included: researcher expertise, prior beliefs about the hypothesis, field of specialisation, and all identifiable analytical decisions (variable selection, model specification, sample restrictions, missing data handling). These predictors together explained less than 5% of total numerical variance across teams. The study distinguishes this finding from the systematic-bias literature: the observed variation is not directional or predictable — it is idiosyncratic, meaning it cannot be corrected through pre-registration alone, since the relevant decisions often occur at levels of analytical granularity not captured by standard pre-registration templates.",
            },
            {
                label: "Methodology",
                headline: null,
                body: "Many-analyst experimental design. N = 161 researchers, 73 teams, recruited via professional social science networks. Identical dataset: International Social Survey Programme (ISSP) cross-country data on immigration attitudes and welfare preferences. No analytical constraints imposed. Teams submitted code, numerical results, and written conclusions. Coordinating team coded decisions using a standardised taxonomy covering 29 analytical choice points. Variance decomposition via multilevel modelling with coded decisions as level-2 predictors.",
            },
            {
                label: "Technical detail",
                headline: null,
                body: "Three findings warrant particular attention for researchers. First, pre-registration is necessary but insufficient: the majority of analytical decisions that drive result variation occur downstream of hypothesis specification, at the level of operationalisation and model-building choices that pre-registration templates do not typically capture. Second, the study tested one specific hypothesis in one discipline — political sociology using cross-country survey data. The degree of idiosyncrasy may differ across fields with more constrained analytical pipelines or more constrained data structures. Third, the result should not be interpreted as implying all social science findings are equally uncertain. It implies that single studies of complex social phenomena carry more hidden uncertainty than their reported confidence intervals suggest, and that multi-team or multiverse analysis approaches should become standard practice for contested empirical claims in social science. A 2024 correction to the paper (PNAS, 121(26):e2410677121) made minor adjustments but did not change the main finding.",
            },
            {
                label: "Sources",
                headline: null,
                body: `Breznau N, Rinke EM, Wuttke A, et al. Observing many researchers using the same data and hypothesis reveals a hidden universe of uncertainty. Proceedings of the National Academy of Sciences. 2022;119(44):e2203150119. DOI: 10.1073/pnas.2203150119. PMC: PMC9636921.

All values including the 73 teams, 161 researchers, and 95% unexplained variance are reported verbatim from the primary publication. The 2024 correction reference is included for completeness. No values have been inferred or approximated. Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC9636921/`,
            },
        ],
    }
};

const PAPER_CONTENT = {
    default: DEFAULT_PAPER,
    Medicine: MEDICINE_PAPER,
    Design: DESIGN_PAPER,
    Engineering: ENGINEERING_PAPER,
    Business: BUSINESS_PAPER,
    Sciences: DEFAULT_PAPER,
    "Social Sciences": SOCIAL_SCIENCES_PAPER
};

// ─── Component ────────────────────────────────────────────────────────────────

function mapTrustAnchor(q9Answer: string | undefined): string {
    if (!q9Answer) return "What they found";
    if (q9Answer.includes("Where it came from")) return "Where it came from";
    if (q9Answer.includes("Why it matters")) return "Why it matters";
    if (q9Answer.includes("How it fits")) return "How it fits";
    return "What they found";
}

export default function CardDisplay({ cardType, fieldGroup, readingComfort, readingGoal, timeAvailable, trustAnchor, researchInterest, confusionResponse, normalisedScore, onProceed, excludeTitles }: CardDisplayProps) {
    // AI-generated card state
    type CardContent = {
        maxLayer: number;
        layers: Array<{
            label: string;
            headline?: string | null;
            body?: string;
            blocks?: Block[];
        }>;
    };
    const [allGeneratedCards, setAllGeneratedCards] = useState<{ A: CardContent; B: CardContent; C: CardContent } | null>(null);
    const [paperTitle, setPaperTitle] = useState<string | null>(null);
    const [paperAbstract, setPaperAbstract] = useState<string | null>(null);
    const [paperDoi, setPaperDoi] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const hasCalledRef = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [isFallback, setIsFallback] = useState(false);
    const [componentType, setComponentType] = useState<string>("NarrativeCard");
    const [visualHints, setVisualHints] = useState<{
        keyStat: string | null;
        keyStatLabel: string | null;
        comparisonLeft: string | null;
        comparisonRight: string | null;
    }>({
        keyStat: null,
        keyStatLabel: null,
        comparisonLeft: null,
        comparisonRight: null,
    });
    // Generic (non-personalised) card toggle
    const [showGeneric, setShowGeneric] = useState(false);
    // Comprehension quiz
    type QuizQuestion = { question: string; options: string[]; correct: string; explanation: string };
    const [comprehensionQuiz, setComprehensionQuiz] = useState<QuizQuestion[] | null>(null);

    // Determine which paper content and card data to display
    const paper = PAPER_CONTENT[fieldGroup as keyof typeof PAPER_CONTENT]
        ?? PAPER_CONTENT.default;
    const activeCardType = cardType;
    const baseCard = paper[activeCardType];
    
    // Generic card constructed locally from the raw paper abstract
    const genericCard: CardContent | null = paperTitle && paperAbstract ? {
        maxLayer: 1,
        layers: [
            {
                label: "Original abstract",
                blocks: [
                    { type: "heading" as const, text: paperTitle, level: 2 as const },
                    { type: "paragraph" as const, text: paperAbstract.length > 400 ? paperAbstract.substring(0, 400) + "..." : paperAbstract },
                ],
            }
        ]
    } : null;

    // Use Gemini-generated card when available; swap to generic when toggled
    const rawPersonalisedCard = allGeneratedCards ? allGeneratedCards[activeCardType] : baseCard;

    // Auto-convert legacy layers (headline+body) to block format
    function ensureBlocks(c: CardContent): CardContent {
        return {
            ...c,
            layers: c.layers.map((layer) => {
                if (layer.blocks && layer.blocks.length > 0) return layer;
                // Legacy format: convert body+headline to blocks
                if (layer.body) {
                    const converted = legacyLayerToBlocks({
                        label: layer.label,
                        headline: layer.headline ?? null,
                        body: layer.body,
                    });
                    return { ...layer, blocks: converted.blocks };
                }
                return layer;
            }),
        };
    }

    const personalisedCard = ensureBlocks(rawPersonalisedCard as CardContent);
    const card = showGeneric && genericCard ? genericCard : personalisedCard;

    const generateCardContent = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const savedPersona = typeof window !== "undefined" ? localStorage.getItem("mtp-persona-override") : null;
            const savedContext = typeof window !== "undefined" ? localStorage.getItem("mtp-user-context") : null;
            const generatedPersona = `You appear to be a ${fieldGroup ?? "research"} professional who reads research for ${readingGoal?.toLowerCase() ?? "staying current"}.`;

            const res = await fetch("/api/generate-card", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cardType,
                    fieldGroup: fieldGroup ?? "General",
                    userProfile: {
                        field: fieldGroup ?? "not specified",
                        readingComfort: readingComfort ?? "not specified",
                        readingGoal: readingGoal ?? "not specified",
                        timeAvailable: timeAvailable ?? "not specified",
                        trustAnchor: mapTrustAnchor(trustAnchor),
                        researchInterest: researchInterest ?? "not specified",
                        confusionResponse: confusionResponse ?? "not specified",
                        userPersona: savedPersona ?? generatedPersona,
                        userContext: savedContext ?? "",
                    },
                    excludeTitles: excludeTitles ?? [],
                }),
            });
            if (!res.ok) {
                setAllGeneratedCards(DEFAULT_PAPER as typeof allGeneratedCards);
                setIsFallback(true);
                setPaperTitle("Nonlinear dynamics of multi-omics profiles during human aging");
                setPaperAbstract("108 adults aged 25-75 were tracked for up to 6.8 years. Of 11,305 molecular features analysed, only 6.6% changed linearly with age. 81% changed nonlinearly, in sudden bursts.");
                setIsLoading(false);
                return;
            }
            const data = await res.json();
            setAllGeneratedCards({ A: data.A, B: data.B, C: data.C });
            setPaperTitle(data.paperTitle ?? null);
            setPaperAbstract(data.paperAbstract ?? null);
            setPaperDoi(data.doi ?? null);
            if (data.componentType) setComponentType(data.componentType);
            if (data.visualHints) setVisualHints(data.visualHints);
            if (data.comprehension_quiz) setComprehensionQuiz(data.comprehension_quiz as QuizQuestion[]);
            logEvent({
                session_id: getSessionId(),
                event_type: "card_generated",
                component_type: data.componentType ?? "NarrativeCard",
                card_variant: cardType,
                paper_title: data.paperTitle ?? null,
                paper_field: fieldGroup ?? null,
                normalised_score: normalisedScore ?? null,
                metadata: {
                    confidence: data.confidence ?? null,
                    visualHints: data.visualHints ?? null,
                    readingGoal: readingGoal ?? null,
                    timeAvailable: timeAvailable ?? null,
                    confusionResponse: confusionResponse ?? null,
                    readingComfort: readingComfort ?? null,
                    trustAnchor: trustAnchor ?? null,
                    researchInterest: researchInterest ?? null,
                    fieldGroup: fieldGroup ?? null,
                },
            });
            logEvent({
                session_id: getSessionId(),
                event_type: "card_rendered",
                component_type: data.componentType ?? "NarrativeCard",
                card_variant: cardType,
                paper_title: data.paperTitle ?? null,
                paper_field: fieldGroup ?? null,
                normalised_score: normalisedScore ?? null,
            });
        } catch {
            setAllGeneratedCards(DEFAULT_PAPER as typeof allGeneratedCards);
            setIsFallback(true);
            setPaperTitle("Nonlinear dynamics of multi-omics profiles during human aging");
            setPaperAbstract("108 adults aged 25-75 were tracked for up to 6.8 years. Of 11,305 molecular features analysed, only 6.6% changed linearly with age. 81% changed nonlinearly, in sudden bursts.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch AI-generated card once on mount
    useEffect(() => {
        if (hasCalledRef.current) return;
        hasCalledRef.current = true;
        generateCardContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Suppress unused variables from deprecated error UI and new block architecture
    void error;
    void setError;
    void hasError;
    void setHasError;
    void componentType;
    void setComponentType;
    void visualHints;
    void setVisualHints;
    void showGeneric;
    void setShowGeneric;

    // Derive source label from fieldGroup
    const sourceLabel = (fieldGroup ?? "RESEARCH").toUpperCase();
    const sourceColors: Record<string, string> = {
        MEDICINE: "#c41c1c",
        ENGINEERING: "#1565c0",
        DESIGN: "#7b1fa2",
        BUSINESS: "#00695c",
        SCIENCES: "#e65100",
        "SOCIAL SCIENCES": "#4527a0",
    };
    const sourceColor = sourceColors[sourceLabel] ?? "#37474f";

    return (
        <>
        <div className="feed-cards-container">

            {isFallback && (
                <div className="bg-amber-50 text-amber-800 text-sm font-medium px-4 py-3 rounded-lg text-center mb-4 border border-amber-200 fade-in">
                    Showing a sample card — personalised version unavailable right now.
                </div>
            )}

            {/* Functional card — tapping opens full-screen reading view */}
            {(() => {
                // Extract title and description from the first layer's blocks
                const previewLayer = card.layers[0];
                let feedTitle = paperTitle ?? "Your personalised paper";
                let feedDesc: string | null = null;

                if (previewLayer?.blocks) {
                    const headingBlock = previewLayer.blocks.find((b: Block) => b.type === "heading");
                    const paragraphBlock = previewLayer.blocks.find((b: Block) => b.type === "paragraph");
                    if (headingBlock && headingBlock.type === "heading") feedTitle = headingBlock.text;
                    if (paragraphBlock && paragraphBlock.type === "paragraph") {
                        const t = paragraphBlock.text;
                        feedDesc = t.length > 160 ? t.slice(0, 160).trimEnd() + "…" : t;
                    }
                } else if (previewLayer?.headline) {
                    feedTitle = previewLayer.headline;
                    if (previewLayer.body) {
                        feedDesc = previewLayer.body.length > 160 ? previewLayer.body.slice(0, 160).trimEnd() + "…" : previewLayer.body;
                    }
                }

                return (
                    <FeedPaperCard
                        id="functional-card"
                        title={feedTitle}
                        description={feedDesc}
                        source={sourceLabel}
                        sourceColor={sourceColor}
                        date={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        readTime={activeCardType === "C" ? "15 min read" : activeCardType === "B" ? "10 min read" : "6 min read"}
                        gradientFrom="#0d1b2a"
                        gradientTo="#1b263b"
                        patternOpacity={0.2}
                        isLoading={isLoading && !allGeneratedCards}
                        isPlaceholder={false}
                        onTap={() => setIsExpanded(true)}
                    />
                );
            })()}

            {/* Placeholder cards */}
            {placeholderCards.map((pc) => (
                <FeedPaperCard
                    key={pc.id}
                    id={pc.id}
                    title={pc.title}
                    description={pc.description}
                    source={pc.source}
                    sourceColor={pc.sourceColor}
                    date={pc.date}
                    readTime={pc.readTime}
                    gradientFrom={pc.gradientFrom}
                    gradientTo={pc.gradientTo}
                    patternOpacity={pc.patternOpacity}
                    isPlaceholder={true}
                />
            ))}
        </div>

        {/* Full-screen reading view — slides in when card is tapped */}
        <ExpandedView
            isOpen={isExpanded}
            onClose={() => setIsExpanded(false)}
            paperTitle={paperTitle ?? ""}
            paperAbstract={paperAbstract ?? ""}
            paperDoi={paperDoi ?? null}
            cardVariant={activeCardType}
            normalisedScore={normalisedScore ?? 5}
            readingGoal={readingGoal ?? ""}
            timeAvailable={timeAvailable ?? ""}
            confusionResponse={confusionResponse ?? ""}
            trustAnchor={trustAnchor ?? ""}
            fieldGroup={fieldGroup ?? ""}
            comprehensionQuiz={comprehensionQuiz}
            isGenericCard={showGeneric}
            adjacentCards={allGeneratedCards ? {
                too_basic: activeCardType === 'A' ? null 
                    : allGeneratedCards[activeCardType === 'C' ? 'B' : 'A'].layers,
                too_advanced: activeCardType === 'C' ? null 
                    : allGeneratedCards[activeCardType === 'A' ? 'B' : 'C'].layers,
            } : null}
            onFeedbackSubmit={(suitability, calibration, openFeedback) => {
                onProceed(suitability, calibration, openFeedback, paperTitle ?? "");
            }}
        />
        </>
    );
}
