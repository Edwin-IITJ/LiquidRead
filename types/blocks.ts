// ─── Block-Based Generative UI Type System ────────────────────────────────────
// Each block is a typed content unit that the LLM composes into a sequence.
// The client renders each block using a dedicated React component.

// ── Text & Structure ─────────────────────────────────────────────────────────

export interface ParagraphBlock {
  type: "paragraph";
  text: string;
}

export interface HeadingBlock {
  type: "heading";
  text: string;
  level?: 2 | 3; // defaults to 3
}

export interface CalloutBlock {
  type: "callout";
  variant: "insight" | "warning" | "context";
  text: string;
}

export interface KeyPointsBlock {
  type: "key_points";
  heading?: string;
  items: string[];
}

// ── Data Visualisation ───────────────────────────────────────────────────────

export interface StatHighlightBlock {
  type: "stat_highlight";
  value: string;        // e.g. "81%", "1,795", "27%"
  label: string;        // e.g. "of molecules changed nonlinearly with age"
  context?: string;     // e.g. "Only 6.6% changed linearly"
}

export interface ComparisonPairBlock {
  type: "comparison_pair";
  left: { value: string; label: string };
  right: { value: string; label: string };
  delta?: string;       // e.g. "27% less decline"
}

export interface TwoColumnBlock {
  type: "two_column";
  left: { heading: string; items: string[] };
  right: { heading: string; items: string[] };
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export interface SourceBadgeBlock {
  type: "source_badge";
  journal: string;
  year: number;
  doi?: string | null;
}

// ── Union ────────────────────────────────────────────────────────────────────

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | CalloutBlock
  | KeyPointsBlock
  | StatHighlightBlock
  | ComparisonPairBlock
  | TwoColumnBlock
  | SourceBadgeBlock;

export type BlockType = Block["type"];

// ── Block-based layer (replaces the old { label, headline, body } format) ───

export interface BlockLayer {
  label: string;
  blocks: Block[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export const VALID_BLOCK_TYPES: readonly BlockType[] = [
  "paragraph",
  "heading",
  "callout",
  "key_points",
  "stat_highlight",
  "comparison_pair",
  "two_column",
  "source_badge",
] as const;

/** Type guard — validates a single block object from LLM output */
export function isValidBlock(b: unknown): b is Block {
  if (typeof b !== "object" || b === null) return false;
  const obj = b as Record<string, unknown>;
  if (!VALID_BLOCK_TYPES.includes(obj.type as BlockType)) return false;

  switch (obj.type) {
    case "paragraph":
      return typeof obj.text === "string" && obj.text.trim().length > 0;
    case "heading":
      return typeof obj.text === "string" && obj.text.trim().length > 0;
    case "callout":
      return (
        typeof obj.text === "string" &&
        obj.text.trim().length > 0 &&
        ["insight", "warning", "context"].includes(obj.variant as string)
      );
    case "key_points":
      return Array.isArray(obj.items) && (obj.items as unknown[]).length > 0;
    case "stat_highlight":
      return typeof obj.value === "string" && typeof obj.label === "string";
    case "comparison_pair": {
      const left = obj.left as Record<string, unknown> | undefined;
      const right = obj.right as Record<string, unknown> | undefined;
      return (
        !!left && typeof left.value === "string" && typeof left.label === "string" &&
        !!right && typeof right.value === "string" && typeof right.label === "string"
      );
    }
    case "two_column": {
      const l = obj.left as Record<string, unknown> | undefined;
      const r = obj.right as Record<string, unknown> | undefined;
      return (
        !!l && typeof l.heading === "string" && Array.isArray(l.items) &&
        !!r && typeof r.heading === "string" && Array.isArray(r.items)
      );
    }
    case "source_badge":
      return typeof obj.journal === "string" && typeof obj.year === "number";
    default:
      return false;
  }
}

/** Converts an old-format layer { label, headline, body } to block format */
export function legacyLayerToBlocks(layer: {
  label: string;
  headline: string | null;
  body: string;
}): BlockLayer {
  const blocks: Block[] = [];

  if (layer.headline) {
    blocks.push({ type: "heading", text: layer.headline, level: 2 });
  }

  // Split body by double-newlines into paragraphs
  const paragraphs = layer.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const p of paragraphs) {
    blocks.push({ type: "paragraph", text: p });
  }

  return { label: layer.label, blocks };
}
