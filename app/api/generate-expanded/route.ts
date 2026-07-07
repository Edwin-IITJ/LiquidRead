// GEMINI_API_KEY must be set in .env.local — never use NEXT_PUBLIC prefix
// Uses gemini-2.5-flash — block-based generative UI output

import { NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";
import { type Block, VALID_BLOCK_TYPES, isValidBlock } from "@/types/blocks";

// Strip HTML tags that may be embedded in OpenAlex titles
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

// ─── Request body ────────────────────────────────────────────────────────────

interface ExpandedRequestBody {
  paperTitle: string;
  paperAbstract: string;
  cardVariant: "A" | "B" | "C";
  normalisedScore: number;
  readingGoal: string;
  timeAvailable: string;
  confusionResponse: string;
  trustAnchor: string;
  fieldGroup: string;
}

// ─── Output shape (block-based) ──────────────────────────────────────────────

interface ExpandedOutput {
  hook: string;
  sectionOrder: string[];
  sections: Record<string, {
    label: string;
    blocks: Block[];
  }>;
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validateExpandedOutput(raw: unknown): raw is ExpandedOutput {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;

  if (typeof r.hook !== "string" || r.hook.trim() === "") {
    console.warn("EXPANDED VALIDATION: missing or empty hook");
    return false;
  }

  if (!Array.isArray(r.sectionOrder) || r.sectionOrder.length === 0) {
    console.warn("EXPANDED VALIDATION: sectionOrder missing or empty");
    return false;
  }

  if (typeof r.sections !== "object" || r.sections === null) {
    console.warn("EXPANDED VALIDATION: sections is not an object");
    return false;
  }

  const sections = r.sections as Record<string, unknown>;
  const sectionOrder = r.sectionOrder as string[];

  // sectionOrder must match sections keys
  const sectionKeys = Object.keys(sections);
  const orderSet = new Set(sectionOrder);
  const keysMatch =
    sectionOrder.length === sectionKeys.length &&
    sectionKeys.every((k) => orderSet.has(k));

  if (!keysMatch) {
    console.warn("EXPANDED VALIDATION: sectionOrder does not match section keys", {
      sectionOrder,
      sectionKeys,
    });
    return false;
  }

  // Validate each section's blocks
  for (const [id, sec] of Object.entries(sections)) {
    const s = sec as Record<string, unknown>;

    if (typeof s.label !== "string" || s.label.trim() === "") {
      console.warn(`EXPANDED VALIDATION: section "${id}" missing label`);
      return false;
    }

    if (!Array.isArray(s.blocks) || (s.blocks as unknown[]).length === 0) {
      console.warn(`EXPANDED VALIDATION: section "${id}" missing or empty blocks array`);
      return false;
    }

    // Filter out invalid blocks instead of failing entirely
    const validBlocks: Block[] = [];
    for (const block of s.blocks as unknown[]) {
      if (isValidBlock(block)) {
        validBlocks.push(block);
      } else {
        console.warn(`EXPANDED VALIDATION: section "${id}" has invalid block:`, JSON.stringify(block).slice(0, 200));
      }
    }

    if (validBlocks.length === 0) {
      console.warn(`EXPANDED VALIDATION: section "${id}" has no valid blocks after filtering`);
      return false;
    }

    // Replace blocks with only valid ones
    s.blocks = validBlocks;
  }

  return true;
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildExpandedPrompt(body: ExpandedRequestBody): {
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

  const systemInstructionText = `You are a research translator. Generate personalised expanded views of academic papers using a block-based content system.\n\n${philosophy}\n\n${rules}`;

  const personalisationRules = `PERSONALISATION RULES:
- cardVariant A: plain language, short sentences, relatable analogies, avoid field terminology. Prefer paragraph, callout, and key_points blocks. Use stat_highlight only for the single most important number.
- cardVariant B: clear language, some field terminology explained in-line, moderate length. Use a mix of all block types. Include comparison_pair or two_column when the paper compares groups.
- cardVariant C: full technical language, precise values, no analogies, assume domain fluency. Lead with data-heavy blocks (stat_highlight, comparison_pair). Use paragraph blocks for methodology and limitations.

SECTION ORDER RULES (apply in priority order):
- normalisedScore <= 4: hook first, method section last
- normalisedScore 4-7: hook first, finding second
- normalisedScore >= 7: method section before finding (sceptic-first ordering)
- timeAvailable contains "5 min": generate max 3 sections total
- trustAnchor contains "data": place the section with data visualisation blocks immediately after the hook
- confusionResponse contains "simpler": place a context/background section before the finding section`;

  const blockSpec = `BLOCK TYPES — compose each section from these typed blocks:

paragraph: { "type": "paragraph", "text": "<body text>" }
  Use for: exposition, explanation, narrative flow.

heading: { "type": "heading", "text": "<heading text>", "level": 2|3 }
  Use for: sub-headings within a section. level 2 = major, level 3 = minor. Optional, use sparingly.

stat_highlight: { "type": "stat_highlight", "value": "<number>", "label": "<what it means>", "context": "<optional comparison>" }
  Use for: when a single number IS the finding. value must be short (e.g. "81%", "27%", "1,795"). label max 10 words.

callout: { "type": "callout", "variant": "insight"|"warning"|"context", "text": "<text>" }
  Use for: key takeaways (insight), caveats/limitations (warning), background context (context).

comparison_pair: { "type": "comparison_pair", "left": { "value": "<str>", "label": "<str>" }, "right": { "value": "<str>", "label": "<str>" }, "delta": "<optional str>" }
  Use for: treatment vs control, before vs after, group A vs group B.

key_points: { "type": "key_points", "heading": "<optional str>", "items": ["<point 1>", "<point 2>", ...] }
  Use for: summarising multiple findings, listing implications, methodology steps.

two_column: { "type": "two_column", "left": { "heading": "<str>", "items": ["<item>", ...] }, "right": { "heading": "<str>", "items": ["<item>", ...] } }
  Use for: comparing two categories, contrasting two time periods, listing attributes of two groups.

source_badge: { "type": "source_badge", "journal": "<str>", "year": <number>, "doi": "<str or null>" }
  Use for: citation at the end of a section. Include in the last section only.

BLOCK COMPOSITION RULES:
- Each section MUST have at least one paragraph block.
- Use 2-6 blocks per section. Do NOT put everything in one paragraph.
- VARY the block types across sections. Do not use only paragraph blocks.
- At least ONE section must contain a non-paragraph block (stat_highlight, comparison_pair, two_column, key_points, or callout).
- Use callout blocks for the most important insight and for any major caveat.
- Use source_badge in the final section only.`;

  const taskSpec = `TASK:
Generate a personalised expanded view of the following paper for a specific reader.
Think through these steps:

STEP 1 — What is the single most important, surprising, or counterintuitive thing about this paper? Write it as one sentence, max 20 words. This becomes the hook.

STEP 2 — What is the core data? Extract the key numbers, comparisons, or statistics from the abstract.

STEP 3 — Generate 4-6 sections. Each section has:
- sectionId: unique, lowercase_underscore, descriptive
- label: short display label, 2-4 words
- blocks: an array of typed blocks from the palette above

STEP 4 — Order the sectionIds in sectionOrder following the personalisation rules above.`;

  const outputSchema = `OUTPUT FORMAT — return valid JSON only, no markdown fences:
{
  "hook": "<one sentence, max 20 words>",
  "sectionOrder": ["<sectionId1>", "<sectionId2>", ...],
  "sections": {
    "<sectionId1>": {
      "label": "<2-4 word display label>",
      "blocks": [
        { "type": "<block_type>", ... },
        { "type": "<block_type>", ... }
      ]
    }
  }
}

CONSTRAINTS:
- sectionOrder must contain exactly the same IDs as the keys in sections
- Each block must have a "type" field matching one of: ${VALID_BLOCK_TYPES.join(", ")}
- Return only the JSON object — no explanation, no preamble`;

  const readerContext = `READER CONTEXT:
Card variant: ${body.cardVariant}
Normalised score (familiarity, 1-10): ${body.normalisedScore}
Reading goal: ${body.readingGoal}
Time available: ${body.timeAvailable}
When confused: ${body.confusionResponse}
Trust anchor (what they want to know first): ${body.trustAnchor}
Field group: ${body.fieldGroup}`;

  const paperContext = `PAPER:
Title: ${body.paperTitle}
Abstract: ${body.paperAbstract}`;

  const dynamicPrompt = [
    readerContext,
    personalisationRules,
    paperContext,
    taskSpec,
    blockSpec,
    outputSchema,
  ].join("\n\n");

  console.log("EXPANDED PROMPT SECTION SIZES:", {
    systemInstruction: systemInstructionText.length,
    readerContext: readerContext.length,
    personalisationRules: personalisationRules.length,
    paperContext: paperContext.length,
    taskSpec: taskSpec.length,
    blockSpec: blockSpec.length,
    outputSchema: outputSchema.length,
    totalDynamicChars: dynamicPrompt.length,
    totalChars: systemInstructionText.length + dynamicPrompt.length,
  });

  return { systemInstructionText, dynamicPrompt };
}

// ─── Streaming helpers ───────────────────────────────────────────────────────

/** Accumulate Gemini streaming chunks and return the complete text */
async function streamGeminiToText(
  apiKey: string,
  systemInstructionText: string,
  dynamicPrompt: string
): Promise<{ text: string; tokenInfo: Record<string, unknown> }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstructionText }] },
      contents: [{ role: "user", parts: [{ text: dynamicPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errorBody.slice(0, 300)}`);
  }

  // Read SSE stream and accumulate text
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from Gemini streaming");

  const decoder = new TextDecoder();
  let accumulated = "";
  let tokenInfo: Record<string, unknown> = {};
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE events
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? ""; // Keep incomplete event in buffer

    for (const event of events) {
      const lines = event.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const chunk = JSON.parse(jsonStr);
            const parts = chunk?.candidates?.[0]?.content?.parts ?? [];
            for (const part of parts) {
              if (part.text) accumulated += part.text;
            }
            // Capture token info from final chunk
            if (chunk?.usageMetadata) {
              tokenInfo = chunk.usageMetadata;
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }
    }
  }

  return { text: accumulated, tokenInfo };
}

// ─── Non-streaming fallback ──────────────────────────────────────────────────

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
    return res;
  }
  return res!;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: ExpandedRequestBody = await request.json();

    const {
      paperTitle: rawTitle,
      paperAbstract,
      cardVariant,
      normalisedScore,
      readingGoal,
      timeAvailable,
      confusionResponse,
      trustAnchor,
      fieldGroup,
    } = body;

    const paperTitle = stripHtml(rawTitle ?? "");

    // Basic input validation
    if (
      !paperTitle.trim() ||
      !paperAbstract?.trim() ||
      !["A", "B", "C"].includes(cardVariant)
    ) {
      console.warn("EXPANDED: invalid request body", {
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

    console.log("EXPANDED: starting generation", {
      cardVariant,
      normalisedScore,
      readingGoal,
      timeAvailable,
      trustAnchor,
      fieldGroup,
      paperTitle: paperTitle.slice(0, 80),
    });

    const { systemInstructionText, dynamicPrompt } = buildExpandedPrompt({
      paperTitle,
      paperAbstract,
      cardVariant,
      normalisedScore,
      readingGoal,
      timeAvailable,
      confusionResponse,
      trustAnchor,
      fieldGroup,
    });

    // ── Call Gemini (non-streaming) ──────────────────────────────────────────────
    let rawText: string;
    let diagnosticInfo: Record<string, unknown> = {};

    const geminiResponse = await fetchGeminiWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstructionText }] },
          contents: [{ role: "user", parts: [{ text: dynamicPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("EXPANDED: Gemini API error:", geminiResponse.status, errorBody);
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    const parts: Array<{ text?: string }> =
      geminiData?.candidates?.[0]?.content?.parts ?? [];
    rawText = parts
      .filter((p) => p.text !== undefined)
      .map((p) => p.text!)
      .join("");
    diagnosticInfo = geminiData?.usageMetadata ?? {};

    console.log("EXPANDED GEMINI DIAGNOSTICS:", {
      rawTextLength: rawText?.length,
      ...diagnosticInfo,
    });

    if (!rawText) {
      console.error("EXPANDED: Gemini returned no text content");
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
      console.error("EXPANDED: Failed to parse Gemini JSON:", e);
      console.error("EXPANDED RAW OUTPUT (first 500 chars):", rawText?.slice(0, 500));
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    // ── Validate ───────────────────────────────────────────────────────────────
    if (!validateExpandedOutput(parsed)) {
      console.warn("EXPANDED: output failed validation");
      console.warn("EXPANDED RAW OUTPUT (first 500 chars):", rawText?.slice(0, 500));
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    console.log("EXPANDED: generation succeeded", {
      hook: (parsed as ExpandedOutput).hook,
      sectionCount: (parsed as ExpandedOutput).sectionOrder.length,
      sectionOrder: (parsed as ExpandedOutput).sectionOrder,
    });

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error("EXPANDED: unhandled error in route:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
