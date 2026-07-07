// GEMINI_API_KEY must be set in .env.local — never use NEXT_PUBLIC prefix

import { NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";

// Strip HTML tags that may be embedded in OpenAlex titles
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

// ─── Request body ─────────────────────────────────────────────────────────────

interface RecalibratedRequestBody {
  paperTitle: string;
  paperAbstract: string;
  cardVariant: "A" | "B" | "C";
  normalisedScore: number;
  readingGoal: string;
  timeAvailable: string;
  confusionResponse: string;
  trustAnchor: string;
  fieldGroup: string;
  calibrationSignal: "too_basic" | "too_advanced";
}

// ─── Output shape (identical to generate-expanded) ────────────────────────────

interface VisualSpec {
  visualType:
  | "StatCallout"
  | "ProportionStrip"
  | "DumbbellStrip"
  | "ComparisonTable"
  | "SlopeStrip"
  | "StepDiagram"
  | "RankStrip";
  data: Record<string, unknown>;
  caption: string | null;
}

interface SectionOutput {
  label: string;
  text: string;
  visual: VisualSpec | null;
  visualPosition: "above" | "below" | null;
}

interface ExpandedOutput {
  hook: string;
  sectionOrder: string[];
  sections: Record<string, SectionOutput>;
}

// ─── Validation (copied inline from generate-expanded) ────────────────────────

const VALID_VISUAL_TYPES = [
  "StatCallout",
  "ProportionStrip",
  "DumbbellStrip",
  "ComparisonTable",
  "SlopeStrip",
  "StepDiagram",
  "RankStrip",
] as const;

function validateVisualData(
  visualType: string,
  data: Record<string, unknown>
): boolean {
  switch (visualType) {
    case "StatCallout":
      return typeof data.value === "string" && typeof data.label === "string";
    case "ProportionStrip":
      return (
        typeof data.value === "number" &&
        typeof data.unit === "string" &&
        typeof data.label === "string" &&
        typeof data.comparisonLabel === "string"
      );
    case "DumbbellStrip":
      return (
        (typeof data.leftValue === "string" ||
          typeof data.leftValue === "number") &&
        typeof data.leftLabel === "string" &&
        (typeof data.rightValue === "string" ||
          typeof data.rightValue === "number") &&
        typeof data.rightLabel === "string" &&
        typeof data.delta === "string" &&
        typeof data.unit === "string"
      );
    case "ComparisonTable":
      return (
        typeof data.leftHeader === "string" &&
        typeof data.rightHeader === "string" &&
        Array.isArray(data.rows) &&
        (data.rows as unknown[]).length > 0
      );
    case "SlopeStrip":
      return (
        typeof data.beforeLabel === "string" &&
        typeof data.beforeValue === "number" &&
        typeof data.afterLabel === "string" &&
        typeof data.afterValue === "number" &&
        typeof data.unit === "string" &&
        (data.direction === "up" || data.direction === "down") &&
        typeof data.deltaLabel === "string"
      );
    case "StepDiagram":
      return Array.isArray(data.steps) && (data.steps as unknown[]).length > 0;
    case "RankStrip":
      return (
        typeof data.unit === "string" &&
        Array.isArray(data.items) &&
        (data.items as unknown[]).length > 0
      );
    default:
      return false;
  }
}

function validateExpandedOutput(raw: unknown): raw is ExpandedOutput {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;

  if (typeof r.hook !== "string" || r.hook.trim() === "") {
    console.warn("RECAL VALIDATION: missing or empty hook");
    return false;
  }

  if (!Array.isArray(r.sectionOrder) || r.sectionOrder.length === 0) {
    console.warn("RECAL VALIDATION: sectionOrder missing or empty");
    return false;
  }

  if (typeof r.sections !== "object" || r.sections === null) {
    console.warn("RECAL VALIDATION: sections is not an object");
    return false;
  }

  const sections = r.sections as Record<string, unknown>;
  const sectionOrder = r.sectionOrder as string[];

  const sectionKeys = Object.keys(sections);
  const orderSet = new Set(sectionOrder);
  const keysMatch =
    sectionOrder.length === sectionKeys.length &&
    sectionKeys.every((k) => orderSet.has(k));

  if (!keysMatch) {
    console.warn("RECAL VALIDATION: sectionOrder does not match section keys", {
      sectionOrder,
      sectionKeys,
    });
    return false;
  }

  let visualCount = 0;

  for (const [id, sec] of Object.entries(sections)) {
    const s = sec as Record<string, unknown>;

    if (typeof s.label !== "string" || s.label.trim() === "") {
      console.warn(`RECAL VALIDATION: section "${id}" missing label`);
      return false;
    }
    if (typeof s.text !== "string" || s.text.trim() === "") {
      console.warn(`RECAL VALIDATION: section "${id}" missing text`);
      return false;
    }
    if (
      s.visualPosition !== null &&
      s.visualPosition !== "above" &&
      s.visualPosition !== "below"
    ) {
      console.warn(`RECAL VALIDATION: section "${id}" invalid visualPosition`);
      return false;
    }

    if (s.visual !== null && s.visual !== undefined) {
      visualCount++;
      const v = s.visual as Record<string, unknown>;

      if (!VALID_VISUAL_TYPES.includes(v.visualType as (typeof VALID_VISUAL_TYPES)[number])) {
        console.warn(`RECAL VALIDATION: section "${id}" invalid visualType, nulling`);
        s.visual = null;
        s.visualPosition = null;
        visualCount--;
        continue;
      }

      if (
        typeof v.data !== "object" ||
        v.data === null ||
        !validateVisualData(v.visualType as string, v.data as Record<string, unknown>)
      ) {
        console.warn(`RECAL VALIDATION: section "${id}" visual data invalid, nulling`);
        s.visual = null;
        s.visualPosition = null;
        visualCount--;
      }
    }
  }

  if (visualCount > 1) {
    console.warn(`RECAL VALIDATION: ${visualCount} visuals — keeping only first`);
    let kept = 0;
    for (const sec of Object.values(sections)) {
      const s = sec as Record<string, unknown>;
      if (s.visual !== null && s.visual !== undefined) {
        if (kept === 0) kept++;
        else {
          s.visual = null;
          s.visualPosition = null;
        }
      }
    }
  }

  return true;
}

// ─── Card level labels ────────────────────────────────────────────────────────

const CARD_LEVEL_LABEL: Record<"A" | "B" | "C", string> = {
  A: "plain language (Card A)",
  B: "balanced (Card B)",
  C: "technical (Card C)",
};

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildRecalibratedPrompt(body: RecalibratedRequestBody): {
  systemInstructionText: string;
  dynamicPrompt: string;
} {
  const philosophy = `PHILOSOPHY:
You believe research belongs to everyone, not just specialists.
Your job is to meet the reader exactly where they are, not where experts assume they should be.
Card A readers are not less intelligent. They are differently equipped. Respect that.
Card C readers do not need handholding. Trust that.
Every statistic you include must be understandable to the person reading it. A number without meaning is noise.
Never write a sentence that earns nothing. Cut it.`;

  const rules = `RULES:
- Never drop statistics. Every number must be followed immediately by a plain-English explanation of what it means in real life.
- Never use em dashes. Use commas or full stops instead.
- Never use: delve, realm, crucial, importantly, groundbreaking, game-changer, navigate, landscape, robust.
- Never say "the researchers found" or "this study shows".
- Do not exaggerate time scales.
- Use contractions naturally: you'll, it's, don't, they've.
- Vary sentence length. Mix short punchy sentences with longer ones.
- Write like a sharp science journalist, not an AI assistant.
- Do not add claims not in the paper.`;

  const systemInstructionText = `You are a research translator. Generate personalised expanded views of academic papers for a specific reader.\n\n${philosophy}\n\n${rules}`;

  const cardLevel = CARD_LEVEL_LABEL[body.cardVariant];

  const howToAdjust = body.calibrationSignal === "too_basic"
    ? `HOW TO ADJUST (signal: too_basic):
This user knows more than you assumed. Do NOT just add jargon. Instead: increase information density, trust them with statistics without over-explaining each one, reduce analogies to at most one, and skip foundational context they clearly already have. Treat them as an intelligent peer, not a student.
What NOT to do: do not use phrases like "simply put" or "in other words" — these feel patronising to someone who already understands.`
    : `HOW TO ADJUST (signal: too_advanced):
This user was lost. Do NOT dumb down by removing findings or statistics. Instead: lead with WHY it matters before WHAT was found, define any technical term inline the first time it appears, and use ONE concrete real-world analogy before introducing the mechanism.
What NOT to do: do not remove the core finding or the key statistic — that IS the paper. Just frame it differently.`;

  const recalibrationNotice = `RECALIBRATION NOTICE:
The user just read a ${cardLevel} depth card for this paper.
Their signal: "${body.calibrationSignal}"

${howToAdjust}`;

  const readerContext = `READER CONTEXT:
Card variant: ${body.cardVariant}
Normalised score (familiarity, 1-10): ${body.normalisedScore}
Reading goal: ${body.readingGoal}
Time available: ${body.timeAvailable}
When confused: ${body.confusionResponse}
Trust anchor (what they want to know first): ${body.trustAnchor}
Field group: ${body.fieldGroup}`;

  const personalisationRules = `PERSONALISATION RULES:
- cardVariant A: plain language, short sentences, relatable analogies, avoid field terminology
- cardVariant B: clear language, some field terminology explained in-line, moderate length
- cardVariant C: full technical language, precise values, no analogies, assume domain fluency

SECTION ORDER RULES (apply in priority order):
- normalisedScore <= 4: hook first, method section last
- normalisedScore 4-7: hook first, finding second
- normalisedScore >= 7: method section before finding (sceptic-first ordering)
- timeAvailable contains "5 min": generate max 3 sections total
- trustAnchor contains "data": place the section with the visual immediately after the hook section
- confusionResponse contains "simpler": place a context/background section before the finding section`;

  const paperContext = `PAPER (same paper, same facts — do not change any finding or statistic):
Title: ${stripHtml(body.paperTitle)}
Abstract: ${body.paperAbstract}`;

  const taskSpec = `TASK:
Regenerate this card at the adjusted depth. The facts, findings, and statistics must be identical. Only the framing, vocabulary register, density, and analogy usage should change. Generate a new headline (hook) appropriate for the new depth level.

Follow these steps:

STEP 1 — STORY
What is the single most important, surprising, or counterintuitive thing about this paper?
Write it as one sentence, max 20 words. This becomes the hook.

STEP 2 — DATA
What is the single most important number, comparison, or statistic that proves the hook?
Extract the exact values from the abstract.

STEP 3 — VISUAL FORM
Based on STEP 2, select ONE visualType from:
- StatCallout: one dominant number IS the finding
- ProportionStrip: X% of something is the finding
- DumbbellStrip: comparing two groups or before/after
- ComparisonTable: two groups with multiple attributes
- SlopeStrip: change over time with clear direction
- StepDiagram: a process or mechanism with clear steps
- RankStrip: a ranked list of items

STEP 4 — SECTIONS
Generate 4-6 sections. Each section must have:
- sectionId: unique, lowercase_underscore, descriptive
- label: short display label, 2-4 words
- text: personalised body text adjusted for the recalibration signal
- visual: the visualSpec for ONE section only. Set visual: null for all other sections.
- visualPosition: "above" | "below" | null

STEP 5 — ORDERING
Order the sectionIds in sectionOrder following the personalisation rules above.`;

  const visualSpecRef = `VISUAL SPEC FORMAT (use exact field names):
StatCallout: { value: string, label: string, comparisonValue: string|null, comparisonLabel: string|null }
ProportionStrip: { value: number (0-100), unit: string, label: string, comparisonLabel: string }
DumbbellStrip: { leftValue: string|number, leftLabel: string, rightValue: string|number, rightLabel: string, delta: string, unit: string }
ComparisonTable: { leftHeader: string, rightHeader: string, rows: [{ label: string, leftValue: string, rightValue: string }] } (max 4 rows)
SlopeStrip: { beforeLabel: string, beforeValue: number, afterLabel: string, afterValue: number, unit: string, direction: "up"|"down", deltaLabel: string }
StepDiagram: { steps: string[] } (max 5 items, each max 8 words)
RankStrip: { unit: string, items: [{ label: string, value: number }] } (max 5 items)`;

  const outputSchema = `OUTPUT FORMAT — return valid JSON only, no markdown fences:
{
  "hook": "<one sentence, max 20 words>",
  "sectionOrder": ["<sectionId1>", "<sectionId2>", ...],
  "sections": {
    "<sectionId1>": {
      "label": "<2-4 word display label>",
      "text": "<personalised section body, adjusted for recalibration signal>",
      "visual": { "visualType": "<one of 7 types>", "data": { ... }, "caption": "<string or null>" } | null,
      "visualPosition": "above" | "below" | null
    }
  }
}

CONSTRAINTS:
- sectionOrder must contain exactly the same IDs as the keys in sections
- Only ONE section may have a non-null visual
- visualType must be one of the 7 defined types
- If the paper does not support a good visual, set all visuals to null
- Return only the JSON object — no explanation, no preamble`;

  const dynamicPrompt = [
    recalibrationNotice,
    readerContext,
    personalisationRules,
    paperContext,
    taskSpec,
    visualSpecRef,
    outputSchema,
  ].join("\n\n");

  console.log("RECAL PROMPT SECTION SIZES:", {
    systemInstruction: systemInstructionText.length,
    recalibrationNotice: recalibrationNotice.length,
    readerContext: readerContext.length,
    personalisationRules: personalisationRules.length,
    paperContext: paperContext.length,
    taskSpec: taskSpec.length,
    totalDynamicChars: dynamicPrompt.length,
    calibrationSignal: body.calibrationSignal,
    cardVariant: body.cardVariant,
  });

  return { systemInstructionText, dynamicPrompt };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: RecalibratedRequestBody = await request.json();

    const {
      paperTitle: rawTitle,
      paperAbstract,
      cardVariant,
      calibrationSignal,
    } = body;

    const paperTitle = stripHtml(rawTitle ?? "");

    // Validate calibration signal — just_right should never reach this route
    if (!["too_basic", "too_advanced"].includes(calibrationSignal)) {
      console.warn("RECAL: invalid or missing calibrationSignal:", calibrationSignal);
      return NextResponse.json({ error: "invalid_signal" }, { status: 400 });
    }

    if (
      !paperTitle.trim() ||
      !paperAbstract?.trim() ||
      !["A", "B", "C"].includes(cardVariant)
    ) {
      console.warn("RECAL: invalid request body", {
        paperTitle: !!paperTitle,
        paperAbstract: !!paperAbstract,
        cardVariant,
      });
      return NextResponse.json({ error: "generation_failed" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in .env.local");
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    console.log("RECAL: starting generation", {
      cardVariant,
      calibrationSignal,
      paperTitle: paperTitle.slice(0, 80),
    });

    const { systemInstructionText, dynamicPrompt } = buildRecalibratedPrompt(body);

    // ── Gemini API call ────────────────────────────────────────────────────────
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstructionText }] },
          contents: [{ role: "user", parts: [{ text: dynamicPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("RECAL: Gemini API error:", geminiResponse.status, errorBody);
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();

    // With thinking enabled, text part may be the second part
    const parts: Array<{ text?: string }> =
      geminiData?.candidates?.[0]?.content?.parts ?? [];
    const rawText: string | undefined = parts
      .filter((p) => p.text !== undefined)
      .map((p) => p.text!)
      .join("");

    console.log("RECAL GEMINI DIAGNOSTICS:", {
      httpStatus: geminiResponse.status,
      finishReason: geminiData?.candidates?.[0]?.finishReason,
      candidatesTokenCount: geminiData?.usageMetadata?.candidatesTokenCount,
      thoughtsTokenCount: geminiData?.usageMetadata?.thoughtsTokenCount,
      totalTokenCount: geminiData?.usageMetadata?.totalTokenCount,
      rawTextLength: rawText?.length,
      partsCount: parts.length,
    });

    if (!rawText) {
      console.error("RECAL: Gemini returned no text content");
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    // ── Parse JSON ─────────────────────────────────────────────────────────────
    let parsed: unknown;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      parsed = JSON.parse(jsonrepair(cleaned));
    } catch (e) {
      console.error("RECAL: Failed to parse Gemini JSON:", e);
      console.error("RECAL RAW OUTPUT (first 500 chars):", rawText?.slice(0, 500));
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    // ── Validate ───────────────────────────────────────────────────────────────
    if (!validateExpandedOutput(parsed)) {
      console.warn("RECAL: output failed validation");
      console.warn("RECAL RAW OUTPUT (first 500 chars):", rawText?.slice(0, 500));
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    console.log("RECAL: generation succeeded", {
      hook: (parsed as ExpandedOutput).hook,
      sectionCount: (parsed as ExpandedOutput).sectionOrder.length,
    });

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error("RECAL: unhandled error in route:", error);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
