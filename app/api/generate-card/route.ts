// GEMINI_API_KEY must be set in .env.local — never use NEXT_PUBLIC prefix, this key must stay server-side only

import { NextResponse } from "next/server";
import { jsonrepair } from 'jsonrepair';
import { fieldMap, FieldGroup } from "@/utils/fieldMap";
import { reconstructAbstract } from "@/utils/reconstructAbstract";
import { isValidBlock } from "@/types/blocks";
// import allSubfields from "@/utils/subfieldMap"; // Commented out — subfield selection bypassed in favour of OpenAlex search=

// Strip HTML tags that OpenAlex occasionally embeds in titles/abstracts
function stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, "");
}

const MAILTO = "edwinmeleth@gmail.com";
const BASE_FILTERS = [
    "has_abstract:true",
    "has_doi:true",
    "open_access.is_oa:true",
    "type:article",
    "from_publication_date:2021-01-01",
].join(",");

const FALLBACK_PAPER = {
    title: "Nonlinear dynamics of multi-omics profiles during human aging",
    abstract:
        "108 adults aged 25-75 were tracked for up to 6.8 years. Of 11,305 molecular features analysed, only 6.6% changed linearly with age. 81% changed nonlinearly, in sudden bursts. Two burst windows: around age 44 (lipid metabolism, alcohol processing, cardiovascular markers, skin and muscle tissue) and around age 60 (immune function decline, kidney function, blood sugar regulation, Type 2 diabetes risk). Both crests appeared in men and women independently. Methods: fuzzy c-means trajectory clustering and modified DE-SWAN algorithm across transcriptomics, proteomics, metabolomics, cytokines, lipidomics, and four microbiome types.",
    journal: "Nature Aging",
    year: 2024,
    authors: "Shen X., Wang C., Snyder M.P. et al.",
};

interface UserProfile {
    field: string;
    readingComfort: string;
    readingGoal: string;
    timeAvailable: string;
    trustAnchor?: string;
    researchInterest?: string;
    confusionResponse?: string;
    userPersona?: string;
    userContext?: string;
}

// ─── Subfield selection via Gemini (COMMENTED OUT) ─────────────────────────────
// Bypassed in favour of OpenAlex's native search= parameter, which handles
// topic matching directly without an extra LLM call.  Kept for potential
// future use.
//
// async function selectSubfield(fieldId: string | null, researchInterest: string | undefined, apiKey: string): Promise<string | null> {
//     if (!researchInterest) return null;
//     if (!allSubfields || allSubfields.length === 0) return null;
//     const subfieldList = allSubfields.map((s: { id: string; name: string }) => `${s.id}: ${s.name}`).join("\n");
//     const prompt = `You are a research librarian. The user has selected a broad field, but we need to narrow it down to the most relevant OpenAlex subfield based on their specific research interest.\n\nUser's specific research interest: "${researchInterest}"\n\nAvailable OpenAlex subfields:\n${subfieldList}\n\nSelect the SINGLE most relevant subfield ID from the list above. Return ONLY the subfield ID (e.g., "1208"). If no subfield is a good match, return "NONE". Do not include any other text.`;
//     try {
//         const response = await fetch(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
//             { method: "POST", headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 10 } }) }
//         );
//         if (!response.ok) { console.error('Gemini Flash error:', response.status, await response.text()); return null; }
//         const data = await response.json();
//         const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//         if (!rawText) return null;
//         const selectedId = rawText.trim();
//         if (selectedId === "NONE") return null;
//         if (allSubfields.some((s: { id: string; name: string }) => s.id === selectedId)) return selectedId;
//         return null;
//     } catch (error) { console.error('selectSubfield() FAILED:', error); return null; }
// }

interface Paper {
    title: string;
    abstract: string;
    journal: string;
    year: number;
    authors: string;
    pmcid?: string | null;
    doi?: string | null;
}

interface OpenAlexWork {
    title?: string;
    abstract_inverted_index?: Record<string, number[]>;
    publication_year?: number;
    cited_by_count?: number;
    doi?: string;
    ids?: { pmcid?: string; pmid?: string };
    primary_location?: {
        source?: { display_name?: string };
        landing_page_url?: string;
        pdf_url?: string;
    };
    authorships?: Array<{
        author?: { display_name?: string };
    }>;
}

async function fetchPaperFromOpenAlex(fieldGroup: string, researchInterest?: string | null, excludeTitles?: string[]): Promise<Paper> {
    const fieldValue = fieldMap[fieldGroup as FieldGroup];

    // Determine the search term: prefer researchInterest; for "Other" fall back to fieldGroup text
    const searchTerm = researchInterest?.trim() || (fieldValue === null || fieldValue === undefined ? fieldGroup : null);

    // Build filter using the helper function
    const fieldFilter = buildFieldFilter(fieldValue);
    const filterString = fieldFilter ? `${BASE_FILTERS},${fieldFilter}` : BASE_FILTERS;

    // Sort by relevance when we have a search term, otherwise by citation count
    const sortString = searchTerm ? "&sort=relevance_score:desc" : "&sort=cited_by_count:desc";

    const openAlexUrl =
        `https://api.openalex.org/works` +
        `?filter=${filterString}` +
        (searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "") +
        sortString +
        `&select=title,abstract_inverted_index,publication_year,cited_by_count,doi,ids,primary_location,authorships` +
        `&per_page=10` +
        `&mailto=${MAILTO}`;

    console.log('OPENALEX URL:', openAlexUrl);

    const response = await fetch(openAlexUrl);
    if (!response.ok) {
        throw new Error(`OpenAlex error: ${response.status}`);
    }

    const data = await response.json();

    const validResults = (data.results || []).filter((w: OpenAlexWork) => {
        if (!w.title || typeof w.title !== "string" || w.title.trim() === "") return false;
        if (!w.abstract_inverted_index) return false;

        const lowerTitle = w.title.toLowerCase();
        if (
            lowerTitle.includes("guidelines") ||
            lowerTitle.includes("conference series") ||
            lowerTitle.includes("proceedings")
        ) {
            return false;
        }

        return true;
    });

    if (validResults.length === 0) {
        return FALLBACK_PAPER;
    }

    // Filter out previously-seen papers (case-insensitive title match)
    const excludeSet = new Set((excludeTitles ?? []).map((t: string) => t.toLowerCase().trim()));
    const unseenResults = validResults.filter((w: OpenAlexWork) => !excludeSet.has((w.title ?? "").toLowerCase().trim()));

    // Pick the top unseen result; fall back to top overall if all have been seen
    const work: OpenAlexWork = unseenResults.length > 0 ? unseenResults[0] : validResults[0];

    const authorNames = (work.authorships ?? [])
        .slice(0, 3)
        .map((a) => a.author?.display_name ?? "")
        .filter(Boolean);
    const authors =
        authorNames.length > 0
            ? authorNames.join(", ") + (work.authorships && work.authorships.length > 3 ? " et al." : "")
            : "Unknown Authors";

    return {
        title: stripHtml(work.title ?? "Unknown Title"),
        abstract: reconstructAbstract(work.abstract_inverted_index ?? {}),
        year: work.publication_year ?? 0,
        journal: work.primary_location?.source?.display_name ?? "Unknown Journal",
        authors,
        pmcid: work.ids?.pmcid ?? null,
        doi: work.doi ?? null,
    };
}

// ─── Semantic Scholar fallback ─────────────────────────────────────────────────
// Used when OpenAlex returns the fallback paper (no relevant results).
// Semantic Scholar has superior ML-powered semantic search that handles
// vague or natural-language queries better than OpenAlex keyword search.

interface SemanticScholarPaper {
    paperId: string;
    title: string;
    abstract: string | null;
    year: number | null;
    citationCount: number | null;
    externalIds?: { DOI?: string; PubMedCentral?: string } | null;
    journal?: { name?: string } | null;
    authors?: Array<{ name?: string }> | null;
}

async function fetchPaperFromSemanticScholar(query: string, fieldGroup?: string, excludeTitles?: string[]): Promise<Paper | null> {
    try {
        // Map fieldGroup to Semantic Scholar's fieldsOfStudy values
        // Semantic Scholar supports a comma-separated list of fields.
        const fieldOfStudyMap: Record<string, string> = {
            Design: "Computer Science",
            Engineering: "Engineering",
            Sciences: "Physics,Chemistry,Biology,Mathematics,Environmental Science,Materials Science",
            "Social Sciences": "Sociology",
            Humanities: "Philosophy",
            Medicine: "Medicine",
            Business: "Business",
        };
        const fieldOfStudy = fieldGroup ? fieldOfStudyMap[fieldGroup] : null;

        const params = new URLSearchParams({
            query,
            limit: "5",
            fields: "title,abstract,year,citationCount,externalIds,journal,authors",
            // Only return papers from 2021 onwards
            year: "2021-",
        });
        if (fieldOfStudy) {
            params.set("fieldsOfStudy", fieldOfStudy);
        }

        const url = `https://api.semanticscholar.org/graph/v1/paper/search?${params.toString()}`;
        console.log('SEMANTIC SCHOLAR URL:', url);

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const response = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);

        if (!response.ok) {
            console.warn('Semantic Scholar error:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        const results: SemanticScholarPaper[] = data.data || [];

        // Find the first result with a usable abstract, skipping previously-seen papers
        const excludeSet = new Set((excludeTitles ?? []).map(t => t.toLowerCase().trim()));
        const validPaper = results.find(p => 
            p.title && p.abstract && p.abstract.length >= 50 && !excludeSet.has(p.title.toLowerCase().trim())
        ) ?? results.find(p => p.title && p.abstract && p.abstract.length >= 50);
        if (!validPaper) return null;

        const authorNames = (validPaper.authors ?? [])
            .slice(0, 3)
            .map(a => a.name ?? "")
            .filter(Boolean);
        const authors = authorNames.length > 0
            ? authorNames.join(", ") + ((validPaper.authors?.length ?? 0) > 3 ? " et al." : "")
            : "Unknown Authors";

        return {
            title: stripHtml(validPaper.title),
            abstract: stripHtml(validPaper.abstract!),
            year: validPaper.year ?? 0,
            journal: validPaper.journal?.name ?? "Unknown Journal",
            authors,
            pmcid: validPaper.externalIds?.PubMedCentral ? `PMC${validPaper.externalIds.PubMedCentral}` : null,
            doi: validPaper.externalIds?.DOI ? `https://doi.org/${validPaper.externalIds.DOI}` : null,
        };
    } catch (error) {
        console.warn('Semantic Scholar fetch failed:', error);
        return null;
    }
}

// ─── Full text fetch (PMC → Europe PMC fallback) ──────────────────────────────

type FullText = { methods: string | null; results: string | null; discussion: string | null };

async function fetchFullText(pmcid: string): Promise<FullText | null> {
    try {
        // Extract numeric ID — input may be a URL or bare "PMC1234567"
        const match = pmcid.match(/PMC(\d+)/i);
        if (!match) {
            console.warn('fetchFullText: could not extract PMC ID from', pmcid);
            return null;
        }
        const pmcToken = `PMC${match[1]}`;
        console.log('fetchFullText: raw pmcid received:', pmcid, '| extracted token:', pmcToken);

        let xml: string | null = null;

        // --- Attempt 1: NIH Entrez eFetch ---
        console.log('fetchFullText: attempting NIH eFetch for', pmcToken);
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 6000);
            const res = await fetch(
                `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcToken}&rettype=full&retmode=xml&tool=liquidread&email=${MAILTO}`,
                { signal: ctrl.signal }
            );
            clearTimeout(timer);
            if (res.ok) {
                const text = await res.text();
                // Treat as failure if the XML contains an error element
                if (!text.slice(0, 500).includes('<error>')) {
                    xml = text;
                }
            }
        } catch (e) {
            console.warn('fetchFullText: NIH eFetch failed, trying Europe PMC:', (e as Error).message);
        }

        // --- Attempt 2: Europe PMC fallback ---
        if (!xml) {
            console.log('fetchFullText: NIH eFetch did not yield XML, attempting Europe PMC for', pmcToken);
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 6000);
                const res = await fetch(
                    `https://www.ebi.ac.uk/europepmc/webservices/rest/${pmcToken}/fullTextXML`,
                    { signal: ctrl.signal }
                );
                clearTimeout(timer);
                if (res.ok) {
                    xml = await res.text();
                }
            } catch (e) {
                console.warn('fetchFullText: Europe PMC also failed:', (e as Error).message);
            }
        }

        if (!xml) return null;

        // --- Section extraction helpers ---
        function extractSection(xml: string, ...patterns: RegExp[]): string | null {
            for (const pattern of patterns) {
                const m = xml.match(pattern);
                if (m && m[1]) {
                    const raw = m[1]
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .slice(0, 1500);
                    if (raw.length >= 50) return raw;
                }
            }
            return null;
        }

        // sec-type attribute match OR title keyword match
        // We capture everything from the opening <sec> tag to the pairing </sec>
        // (greedy-safe: match to the FIRST </sec> that closes our sec, approximated by a
        //  non-greedy .+? capped — good enough for 1500-char truncation use case)
        const methods = extractSection(
            xml,
            /<sec[^>]*sec-type=["'][^"']*method[^"']*["'][^>]*>([\s\S]*?)<\/sec>/i,
            /<sec[^>]*>\s*<title[^>]*>[^<]*method[^<]*<\/title>([\s\S]*?)<\/sec>/i
        );

        const results = extractSection(
            xml,
            /<sec[^>]*sec-type=["'][^"']*result[^"']*["'][^>]*>([\s\S]*?)<\/sec>/i,
            /<sec[^>]*>\s*<title[^>]*>[^<]*result[^<]*<\/title>([\s\S]*?)<\/sec>/i
        );

        // Discussion: may match multiple sec types — concatenate up to combined 1500 chars
        const discussionPatterns = [
            /<sec[^>]*sec-type=["'][^"']*(discussion|conclusions?|limitations?)[^"']*["'][^>]*>([\s\S]*?)<\/sec>/gi,
            /<sec[^>]*>\s*<title[^>]*>[^<]*(discussion|limitation|conclusion)[^<]*<\/title>([\s\S]*?)<\/sec>/gi,
        ];
        let discussionRaw = '';
        for (const pat of discussionPatterns) {
            let m;
            while ((m = pat.exec(xml)) !== null && discussionRaw.length < 1500) {
                const chunk = (m[2] ?? m[1] ?? '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (chunk) discussionRaw += (discussionRaw ? ' ' : '') + chunk;
            }
        }
        const discussion = discussionRaw.length >= 50
            ? discussionRaw.slice(0, 1500)
            : null;

        if (!methods && !results && !discussion) return null;

        return { methods, results, discussion };
    } catch (err) {
        console.error('fetchFullText: unexpected error:', err);
        return null;
    }
}

function buildPromptParts(
    userProfile: UserProfile,
    paper: Paper,
    fullText?: FullText | null
): { systemInstructionText: string; dynamicPrompt: string } {
    const philosophy = `PHILOSOPHY:
You believe research belongs to everyone, not just specialists.
Your job is to meet the reader exactly where they are, not where experts assume they should be.
Card A readers are not less intelligent. They are differently equipped. Respect that.
Card C readers do not need handholding. Trust that.
Every statistic you include must be understandable to the person reading it. A number without meaning is noise.
Never write a sentence that earns nothing. Cut it.`;

    const rules = `RULES:
- Never drop statistics. Every number must be followed immediately by a plain-English explanation of what it means in real life.
- After the first block of statistics in Card B Layer 1 and Card C Layer 1, add exactly one inline credibility note in this format: [All figures from the original peer-reviewed paper, {journal}, {year}]. Do not repeat this note elsewhere in the card.
- Never use em dashes. Use commas or full stops instead.
- Never use: delve, realm, crucial, importantly, groundbreaking, game-changer, navigate, landscape, robust.
- Never say "the researchers found" or "this study shows".
- Do not exaggerate time scales. Do not say "overnight" if the paper describes changes over months or years.
- Assume the user does NOT know the vocabulary of this paper's field, even if educated in a different field.
- Use contractions naturally: you'll, it's, don't, they've.
- Vary sentence length. Mix short punchy sentences with longer ones.
- Write like a sharp science journalist, not an AI assistant.
- Do not add claims not in the paper.`;

    const systemInstructionText = `You are a research translator. Generate personalised research cards that present academic papers to specific readers.\n\n${philosophy}\n\n${rules}`;

    const userProfileText = `USER PROFILE:
  Field of work: ${userProfile.field}
  Specific research interest: ${userProfile.researchInterest ?? "not specified"}
  Reading comfort with research: ${userProfile.readingComfort}
  Reading goal: ${userProfile.readingGoal}
  Time available today: ${userProfile.timeAvailable}
  When confused by something: ${userProfile.confusionResponse ?? "re-reads slowly"}
  Trust anchor (wants to know first): ${userProfile.trustAnchor ?? "the finding itself"}
  ${userProfile.userPersona ? `\nUser self-description: ${userProfile.userPersona}` : ""}
  ${userProfile.userContext ? `\nAdditional user context: ${userProfile.userContext}` : ""}`;

    const personalisationInstructions = `PERSONALISATION:
time→words: ≤5m=≤120w, 10-15m=150-200w,  30m=250-300w
jargon: Access=plain+analogies, Bal=some explained, Tech=precise+stats
trustAnchor: "Where..."→open B/C L1 with journal/authors; "Why..."→open all with implications
confusionResponse: "simpler"→explain all terms; "Re-read"→moderate ok
userContext overrides all.
userPersona calibrates tone.
A=accessible, C=technical.`;

    let paperText = `PAPER:
Title: ${stripHtml(paper.title)}
Journal: ${paper.journal}, ${paper.year}
Authors: ${paper.authors}
Abstract: ${stripHtml(paper.abstract)}`;

    if (fullText?.results) {
        paperText += `\nResults (from full paper):\n${fullText.results}`;
    }
    if (fullText?.methods) {
        paperText += `\nMethods (from full paper):\n${fullText.methods}`;
    }
    if (fullText?.discussion) {
        paperText += `\nDiscussion/Limitations (from full paper):\n${fullText.discussion}`;
    }

    const fullTextRules = fullText
        ? `\n\nFULL TEXT USAGE RULES:
- Card A: Use abstract only. Ignore any full text sections below.
- Card B: If Results section is provided, use it to add one specific quantitative detail to "The finding" layer. Keep the writing accessible. Do not paste raw numbers without explaining them in plain English.
- Card C: Use Methods, Results, and Discussion sections where provided. Card C readers want precision — include specific numbers, named techniques, and stated limitations. Still write clearly; do not copy-paste raw XML artefacts.`
        : '';

    const blockSpec = `BLOCK TYPES — compose each layer from these typed blocks:
paragraph: { "type": "paragraph", "text": "<body text>" }
heading: { "type": "heading", "text": "<heading text>", "level": 2|3 }
stat_highlight: { "type": "stat_highlight", "value": "<number>", "label": "<what it means>", "context": "<optional comparison>" }
callout: { "type": "callout", "variant": "insight"|"warning"|"context", "text": "<text>" }
comparison_pair: { "type": "comparison_pair", "left": { "value": "<str>", "label": "<str>" }, "right": { "value": "<str>", "label": "<str>" }, "delta": "<optional str>" }
key_points: { "type": "key_points", "heading": "<optional str>", "items": ["<point 1>", "<point 2>", ...] }
two_column: { "type": "two_column", "left": { "heading": "<str>", "items": ["<item>", ...] }, "right": { "heading": "<str>", "items": ["<item>", ...] } }
source_badge: { "type": "source_badge", "journal": "<str>", "year": <number>, "doi": "<str or null>" }

Rules:
- Each layer MUST have "blocks": an array of typed block objects.
- Use 1-4 blocks per layer. Do NOT put everything in one paragraph block.
- Preview layers (layer 0): use 1-2 blocks (heading + paragraph, or stat_highlight + paragraph).
- Content layers: VARY block types. At least one layer must contain a non-paragraph block.
- Card A: prefer paragraph, callout, key_points. Use stat_highlight only for the hero stat.
- Card B: use full variety. Include comparison_pair or two_column when the paper compares groups.
- Card C: lead with data blocks (stat_highlight, comparison_pair). Use paragraph for methodology.`;

    const taskAndSchema = `Gen 3 cards using block-based layers.
A:0,Preview(hook+teaser) 1,The story(plain+stat) 2,How they found it(method+link)
B:0,Preview(hook+teaser) 1,The finding(stats+VISUAL+trustAnchor) 2,How they found it(method) 3,So what(implic+link)
C:0,Preview(technical) 1,Key findings(quant+p-vals) 2,Methodology and limitations(pipeline+limits)
JSON only:
{"A":{"maxLayer":2,"layers":[{"label":"Preview","blocks":[{"type":"heading","text":"<str>","level":2},{"type":"paragraph","text":"<str>"}]},{"label":"The story","blocks":[{"type":"paragraph","text":"<str>"},{"type":"stat_highlight","value":"<str>","label":"<str>"}]},{"label":"How they found it","blocks":[{"type":"paragraph","text":"<str>"}]}]},"B":{"maxLayer":3,"layers":[{"label":"Preview","blocks":[{"type":"heading","text":"<str>","level":2},{"type":"paragraph","text":"<str>"}]},{"label":"The finding","blocks":[{"type":"stat_highlight","value":"<str>","label":"<str>"},{"type":"paragraph","text":"<str>"}]},{"label":"How they found it","blocks":[{"type":"paragraph","text":"<str>"}]},{"label":"So what","blocks":[{"type":"paragraph","text":"<str>"}]}]},"C":{"maxLayer":2,"layers":[{"label":"Preview","blocks":[{"type":"heading","text":"<str>","level":2},{"type":"paragraph","text":"<str>"}]},{"label":"Key findings","blocks":[{"type":"stat_highlight","value":"<str>","label":"<str>"},{"type":"paragraph","text":"<str>"}]},{"label":"Methodology and limitations","blocks":[{"type":"paragraph","text":"<str>"}]}]}}

${blockSpec}

---
COMPONENT CLASSIFICATION:
Analyse the paper content and classify it with ONE componentType:
- "NarrativeCard": behavioural science, social science, qualitative research, human-interest findings, lifestyle studies, psychology
- "StatsCard": RCTs, meta-analyses, quantitative-heavy papers where a single statistic IS the core finding (e.g. "27% slower decline", "81% of molecules")
- "ComparisonCard": two-condition studies, A vs B designs, method comparisons, papers with two clearly named groups or approaches

Add these fields to the ROOT level of the JSON response (not inside A, B, or C — at the same level as them):
"componentType": "StatsCard",
"confidence": 0.91,
"visualHints": {
  "keyStat": "81%",
  "keyStatLabel": "of molecules change nonlinearly with age",
  "comparisonLeft": null,
  "comparisonRight": null
}

Rules for visualHints:
- keyStat: short number or percentage string only (e.g. "27%", "1,795", "44"). null if no single dominant stat exists.
- keyStatLabel: plain English label for keyStat, max 8 words. null if keyStat is null.
- comparisonLeft + comparisonRight: short column label strings for ComparisonCard only (e.g. "Lecanemab group", "Placebo group"). null for all other component types.
- confidence: float 0.0 to 1.0

---
COMPREHENSION QUIZ:
Also add a "comprehension_quiz" field at the root JSON level. Generate exactly 2 multiple-choice questions that test understanding of the paper's single most important finding. Both questions must be answerable from the card content alone — no outside knowledge required. Each question must have exactly 4 options: one clearly correct answer and three plausible distractors. Keep questions concise (max 20 words each).
"comprehension_quiz":[{"question":"<str>","options":["<option A text>","<option B text>","<option C text>","<option D text>"],"correct":"<A|B|C|D>","explanation":"<1 sentence explaining why the correct answer is right>"},{"question":"<str>","options":["<option A text>","<option B text>","<option C text>","<option D text>"],"correct":"<A|B|C|D>","explanation":"<1 sentence>"}]${fullTextRules}`;

    const dynamicPrompt = `${userProfileText}\n\n${personalisationInstructions}\n\n${paperText}\n\n${taskAndSchema}`;

    console.log('PROMPT SECTION SIZES:', {
        systemInstruction: systemInstructionText.length,
        userProfile: userProfileText.length,
        personalisationInstructions: personalisationInstructions.length,
        paper: paperText.length,
        taskAndSchema: taskAndSchema.length,
        totalDynamicChars: dynamicPrompt.length,
        totalChars: systemInstructionText.length + dynamicPrompt.length,
        fullTextSections: { methods: !!fullText?.methods, results: !!fullText?.results, discussion: !!fullText?.discussion },
    });

    return { systemInstructionText, dynamicPrompt };
}

function validateCards(cards: unknown): boolean {
    if (typeof cards !== "object" || cards === null) return false;
    const c = cards as Record<string, unknown>;

    for (const key of ["A", "B", "C"]) {
        const card = c[key] as Record<string, unknown> | undefined;
        if (!card) return false;

        const layers = card.layers as unknown[] | undefined;
        const maxLayer = card.maxLayer as number | undefined;

        if (!Array.isArray(layers)) return false;
        if (typeof maxLayer !== "number") return false;
        if (layers.length < 2) {
            console.warn(`Card ${key}: expected ${maxLayer + 1} layers, got ${layers.length}`);
            return false;
        }

        // Check each layer — supports both block-based and legacy format
        for (const layer of layers) {
            const l = layer as Record<string, unknown>;
            if (typeof l.label !== "string" || l.label.trim() === "") {
                console.warn(`Card ${key} layer missing or empty label`);
                return false;
            }

            // Block-based format: has "blocks" array
            if (Array.isArray(l.blocks)) {
                const validBlocks = (l.blocks as unknown[]).filter(isValidBlock);
                if (validBlocks.length === 0) {
                    console.warn(`Card ${key} layer "${l.label}": no valid blocks`);
                    return false;
                }
                l.blocks = validBlocks;
            }
            // Legacy format: has "body" string — convert to blocks
            else if (typeof l.body === "string" && l.body.trim().length >= 20) {
                const blocks = [];
                if (l.headline && typeof l.headline === "string") {
                    blocks.push({ type: "heading", text: l.headline, level: 2 });
                }
                const paragraphs = (l.body as string)
                    .split(/\n{2,}/)
                    .map((p: string) => p.trim())
                    .filter(Boolean);
                for (const p of paragraphs) {
                    blocks.push({ type: "paragraph", text: p });
                }
                l.blocks = blocks;
                // Keep body for backward compat in case CardDisplay still reads it
            }
            else {
                console.warn(`Card ${key} layer "${l.label}": no blocks and no valid body`);
                return false;
            }
        }
    }

    const validTypes = ["NarrativeCard", "StatsCard", "ComparisonCard"];
    const ct = (cards as Record<string, unknown>).componentType;
    if (!ct || !validTypes.includes(ct as string)) {
        console.warn("Invalid or missing componentType — defaulting to NarrativeCard");
        (cards as Record<string, unknown>).componentType = "NarrativeCard";
    }
    if (!(cards as Record<string, unknown>).visualHints) {
        (cards as Record<string, unknown>).visualHints = {
            keyStat: null,
            keyStatLabel: null,
            comparisonLeft: null,
            comparisonRight: null
        };
    }

    console.log('VALIDATION RESULT:', true);
    return true;
}

async function fetchGeminiWithRetry(url: string, options: RequestInit): Promise<Response> {
    let res: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        res = await fetch(url, options);
        if (res.ok) return res;

        if (res.status === 503 || res.status === 429) {
            if (attempt < 3) {
                const waitMs = attempt === 1 ? 2000 : 4000;
                console.log(`Gemini ${res.status} on attempt ${attempt} — retrying in ${waitMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
                continue;
            }
        }
        break;
    }

    // Fallback: if 3.5-flash failed after all retries, try 2.5-flash
    if (res && !res.ok && (res.status === 503 || res.status === 429)) {
        const fallbackUrl = url.replace('gemini-3.5-flash', 'gemini-2.5-flash');
        if (fallbackUrl !== url) {
            console.log('Gemini 3.5-flash unavailable after 3 retries — falling back to 2.5-flash');
            const fallbackRes = await fetch(fallbackUrl, options);
            if (fallbackRes.ok) return fallbackRes;
            console.error(`Gemini 2.5-flash fallback also failed: ${fallbackRes.status}`);
            return fallbackRes;
        }
    }

    return res!;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            fieldGroup,
            userProfile,
            excludeTitles,
        }: { fieldGroup: string; userProfile: UserProfile; excludeTitles?: string[] } = body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set in .env.local");
            return NextResponse.json({ error: "generation_failed" }, { status: 500 });
        }

        // Step 1 — Fetch a relevant paper from OpenAlex (using search= with the user's research interest)
        let paper: Paper;
        try {
            paper = await fetchPaperFromOpenAlex(fieldGroup, userProfile.researchInterest, excludeTitles);
        } catch {
            console.warn("OpenAlex fetch failed, using FALLBACK_PAPER");
            paper = FALLBACK_PAPER;
        }

        // Step 1b — If OpenAlex returned the fallback paper, try Semantic Scholar as a fallback
        const searchQuery = userProfile.researchInterest?.trim() || fieldGroup;
        if (paper === FALLBACK_PAPER && searchQuery) {
            console.log('OpenAlex returned no results, trying Semantic Scholar fallback...');
            const ssPaper = await fetchPaperFromSemanticScholar(searchQuery, fieldGroup, excludeTitles);
            if (ssPaper) {
                console.log('Semantic Scholar fallback succeeded:', ssPaper.title);
                paper = ssPaper;
            } else {
                console.warn('Semantic Scholar fallback also returned no results, using FALLBACK_PAPER');
            }
        }

        // Step 2b — Attempt full-text fetch from PMC
        let fullText: FullText | null = null;
        if (paper.pmcid) {
            fullText = await fetchFullText(paper.pmcid);
            console.log('FULL TEXT STATUS:', {
                pmcid: paper.pmcid,
                methods: !!fullText?.methods,
                results: !!fullText?.results,
                discussion: !!fullText?.discussion,
            });
        }

        // Step 3 — Call Gemini API (single call for all three card types)

        const { systemInstructionText, dynamicPrompt } = buildPromptParts(userProfile, paper, fullText);

        console.log('PAPER SENT TO GEMINI:', {
            title: paper.title,
            journal: paper.journal,
            year: paper.year,
            abstract: paper.abstract?.slice(0, 100)
        });

        const geminiResponse = await fetchGeminiWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemInstructionText }] },
                    contents: [{ role: "user", parts: [{ text: dynamicPrompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8200,
                        thinkingConfig: {
                            thinkingBudget: 0
                        }
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            console.error("Gemini API error:", geminiResponse.status, geminiResponse.statusText);
            return NextResponse.json({ error: "generation_failed" }, { status: 500 });
        }

        const geminiData = await geminiResponse.json();

        // Extract text from Gemini response
        const rawText: string | undefined =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("GEMINI DIAGNOSTICS:", {
            httpStatus: geminiResponse.status,
            finishReason: geminiData?.candidates?.[0]?.finishReason,
            candidatesTokenCount: geminiData?.usageMetadata?.candidatesTokenCount,
            totalTokenCount: geminiData?.usageMetadata?.totalTokenCount,
            rawTextLength: rawText?.length
        });

        if (!rawText) {
            console.error("Gemini returned no text content");
            return NextResponse.json({ error: "generation_failed" }, { status: 500 });
        }

        // Parse the JSON containing all three cards
        let cards: unknown;
        try {
            // Strip any accidental markdown fences if present
            const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
            cards = JSON.parse(jsonrepair(cleaned));
        } catch (e) {
            console.log("RAW TEXT AROUND 1667:", rawText?.slice(1580, 1760));
            console.error("Failed to parse Gemini JSON response:", e, rawText);
            return NextResponse.json({ error: "generation_failed" }, { status: 500 });
        }

        if (!validateCards(cards)) {
            console.warn("Gemini output failed validation — logging raw output for debugging:");
            console.warn("RAW GEMINI OUTPUT:", rawText?.slice(0, 500));
            return NextResponse.json({ error: "generation_failed" }, { status: 500 });
        }

        return NextResponse.json({ ...(cards as Record<string, unknown>), paperTitle: stripHtml(paper.title), paperAbstract: stripHtml(paper.abstract), doi: paper.doi ?? null }, { status: 200 });

    } catch (error) {
        console.error("Error in generate-card route:", error);
        return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }
}
