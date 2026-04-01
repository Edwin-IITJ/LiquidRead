// GEMINI_API_KEY must be set in .env.local — never use NEXT_PUBLIC prefix, this key must stay server-side only

import { NextResponse } from "next/server";
import { jsonrepair } from 'jsonrepair';
import { fieldMap, FieldGroup } from "@/utils/fieldMap";
import { reconstructAbstract } from "@/utils/reconstructAbstract";
import allSubfields from "@/utils/subfieldMap";

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

async function selectSubfield(fieldId: string | null, researchInterest: string | undefined, apiKey: string): Promise<string | null> {
    if (!researchInterest) return null;

    if (!allSubfields || allSubfields.length === 0) return null;

    const subfieldList = allSubfields.map((s: { id: string; name: string }) => `${s.id}: ${s.name}`).join("\n");
    const prompt = `You are a research librarian. The user has selected a broad field, but we need to narrow it down to the most relevant OpenAlex subfield based on their specific research interest.

User's specific research interest: "${researchInterest}"

Available OpenAlex subfields:
${subfieldList}

Select the SINGLE most relevant subfield ID from the list above. Return ONLY the subfield ID (e.g., "1208"). If no subfield is a good match, return "NONE". Do not include any other text.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 10,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Gemini Flash error:', response.status, errorBody);
            return null;
        }

        const data = await response.json();
        const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            console.log("!rawTex")
            return null;
        }
        console.log('Gemini subfield raw response:', rawText);
        const selectedId = rawText.trim();
        if (selectedId === "NONE") return null;

        // verify it's a valid ID from our list
        if (allSubfields.some((s: { id: string; name: string }) => s.id === selectedId)) {
            return selectedId;
        }
        return null;
    } catch (error) {
        console.error('selectSubfield() FAILED:', error);

        return null;
    }
}

interface Paper {
    title: string;
    abstract: string;
    journal: string;
    year: number;
    authors: string;
}

interface OpenAlexWork {
    title?: string;
    abstract_inverted_index?: Record<string, number[]>;
    publication_year?: number;
    cited_by_count?: number;
    doi?: string;
    primary_location?: {
        source?: { display_name?: string };
        landing_page_url?: string;
        pdf_url?: string;
    };
    authorships?: Array<{
        author?: { display_name?: string };
    }>;
}

async function fetchPaperFromOpenAlex(fieldGroup: string, subfieldId?: string | null): Promise<Paper> {
    const fieldId = fieldMap[fieldGroup as FieldGroup];

    let filterString: string;
    let sortString: string;
    if (fieldId !== null && fieldId !== undefined) {
        if (subfieldId) {
            filterString = `${BASE_FILTERS},topics.subfield.id:${subfieldId}`;
        } else {
            filterString = `${BASE_FILTERS},topics.field.id:${fieldId}`;
            // Apply Engineering exclusion if subfieldId isn't specifically used
            if (fieldId === "22") {
                filterString += ",topics.subfield.id:!2204";
            }
        }
        sortString = "&sort=cited_by_count:desc";
    } else {
        filterString = BASE_FILTERS;
        sortString = "&sort=relevance_score:desc";
    }

    const openAlexUrl =
        `https://api.openalex.org/works` +
        `?filter=${filterString}` +
        (fieldId === null ? `&search=${encodeURIComponent(fieldGroup)}` : "") +
        sortString +
        `&select=title,abstract_inverted_index,publication_year,cited_by_count,doi,primary_location,authorships` +
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

    const work: OpenAlexWork = validResults[Math.floor(Math.random() * validResults.length)];

    const authorNames = (work.authorships ?? [])
        .slice(0, 3)
        .map((a) => a.author?.display_name ?? "")
        .filter(Boolean);
    const authors =
        authorNames.length > 0
            ? authorNames.join(", ") + (work.authorships && work.authorships.length > 3 ? " et al." : "")
            : "Unknown Authors";

    return {
        title: work.title ?? "Unknown Title",
        abstract: reconstructAbstract(work.abstract_inverted_index ?? {}),
        year: work.publication_year ?? 0,
        journal: work.primary_location?.source?.display_name ?? "Unknown Journal",
        authors,
    };
}

function buildPromptParts(
    userProfile: UserProfile,
    paper: Paper
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

    const paperText = `PAPER:
Title: ${paper.title}
Journal: ${paper.journal}, ${paper.year}
Authors: ${paper.authors}
Abstract: ${paper.abstract}`;

    const taskAndSchema = `Gen 3 cards. body≥20chars.
A:0,Preview(hook+teaser) 1,The story(plain+stat) 2,How they found it(method+link)
B:0,Preview(hook+teaser) 1,The finding(stats+VISUAL+trustAnchor) 2,How they found it(method) 3,So what(implic+link)
C:0,Preview(technical) 1,Key findings(quant+p-vals) 2,Methodology and limitations(pipeline+limits)
JSON only:
{"A":{"maxLayer":2,"layers":[{"label":"Preview","headline":"<str>","body":"<str>"},{"label":"The story","headline":null,"body":"<str>"},{"label":"How they found it","headline":null,"body":"<str>"}]},"B":{"maxLayer":3,"layers":[{"label":"Preview","headline":"<str>","body":"<str>"},{"label":"The finding","headline":null,"body":"<str>"},{"label":"How they found it","headline":null,"body":"<str>"},{"label":"So what","headline":null,"body":"<str>"}]},"C":{"maxLayer":2,"layers":[{"label":"Preview","headline":"<str>","body":"<str>"},{"label":"Key findings","headline":null,"body":"<str>"},{"label":"Methodology and limitations","headline":null,"body":"<str>"}]}}

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
- confidence: float 0.0 to 1.0`;

    const dynamicPrompt = `${userProfileText}\n\n${personalisationInstructions}\n\n${paperText}\n\n${taskAndSchema}`;

    console.log('PROMPT SECTION SIZES:', {
        systemInstruction: systemInstructionText.length,
        userProfile: userProfileText.length,
        personalisationInstructions: personalisationInstructions.length,
        paper: paperText.length,
        taskAndSchema: taskAndSchema.length,
        totalDynamicChars: dynamicPrompt.length,
        totalChars: systemInstructionText.length + dynamicPrompt.length
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

        // Check layer count matches maxLayer + 1
        if (!Array.isArray(layers)) return false;
        if (typeof maxLayer !== "number") return false;
        if (layers.length < 2) {
            console.warn(`Card ${key}: expected ${maxLayer + 1} layers, got ${layers.length}`);
            return false;
        }

        // Check each layer has label and body
        for (const layer of layers) {
            const l = layer as Record<string, unknown>;
            if (typeof l.label !== "string" || l.label.trim() === "") {
                console.warn(`Card ${key} layer missing or empty label`);
                return false;
            }
            if (typeof l.body !== "string" || l.body.trim().length < 20) {
                console.warn(`Card ${key} layer "${l.label}": body too short or missing`);
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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            fieldGroup,
            userProfile,
        }: { fieldGroup: string; userProfile: UserProfile } = body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set in .env.local");
            return NextResponse.json({ error: "generation_failed" }, { status: 500 });
        }

        // Step 1 — Select subfield if applicable
        const fieldId = fieldMap[fieldGroup as FieldGroup];
        let subfieldId = null;
        if (fieldId && userProfile.researchInterest) {
            subfieldId = await selectSubfield(fieldId, userProfile.researchInterest, apiKey);
            console.log(`Selected subfield for "${userProfile.researchInterest}":`, subfieldId);
        }

        // Step 2 — Fetch a real paper from OpenAlex
        let paper: Paper;
        try {
            paper = await fetchPaperFromOpenAlex(fieldGroup, subfieldId);
        } catch {
            console.warn("OpenAlex fetch failed, using FALLBACK_PAPER");
            paper = FALLBACK_PAPER;
        }

        // Step 3 — Call Gemini API (single call for all three card types)

        const { systemInstructionText, dynamicPrompt } = buildPromptParts(userProfile, paper);

        console.log('PAPER SENT TO GEMINI:', {
            title: paper.title,
            journal: paper.journal,
            year: paper.year,
            abstract: paper.abstract?.slice(0, 100)
        });

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
            console.error("Failed to parse Gemini JSON response:", e, rawText);
            return NextResponse.json({ error: "generation_failed" }, { status: 500 });
        }

        if (!validateCards(cards)) {
            console.warn("Gemini output failed validation — logging raw output for debugging:");
            console.warn("RAW GEMINI OUTPUT:", rawText?.slice(0, 500));
            return NextResponse.json({ error: "generation_failed" }, { status: 500 });
        }

        return NextResponse.json({ ...(cards as Record<string, unknown>), paperTitle: paper.title }, { status: 200 });

    } catch (error) {
        console.error("Error in generate-card route:", error);
        return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }
}
