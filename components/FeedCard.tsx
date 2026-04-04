"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedCardProps {
  paperTitle: string;
  /** Hook sentence from generate-expanded. null = not yet generated. */
  hook: string | null;
  /** First 100 chars of the preview layer body, shown when hook is null. */
  previewText: string | null;
  componentType: string;
  cardVariant: "A" | "B" | "C";
  fieldGroup: string;
  isLoading: boolean;
  onExpand: () => void;
  visualHints: {
    keyStat: string | null;
    keyStatLabel: string | null;
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 py-1">
      {/* Tag row */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 rounded-full bg-slate-200" />
        <div className="h-4 w-16 rounded bg-slate-100" />
      </div>
      {/* Title */}
      <div className="space-y-1.5">
        <div className="h-3.5 w-full rounded bg-slate-200" />
        <div className="h-3.5 w-3/4 rounded bg-slate-200" />
      </div>
      {/* Teaser */}
      <div className="space-y-1">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      {/* Stat */}
      <div className="space-y-1 pt-1">
        <div className="h-7 w-24 rounded bg-slate-200" />
        <div className="h-3 w-32 rounded bg-slate-100" />
      </div>
      {/* CTA */}
      <div className="h-3 w-16 rounded bg-slate-100" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedCard({
  paperTitle,
  hook,
  previewText,
  componentType,
  cardVariant,
  fieldGroup,
  isLoading,
  onExpand,
  visualHints,
}: FeedCardProps) {
  // Teaser text: prefer generated hook, fall back to first 100 chars of preview
  const teaserText =
    hook ?? (previewText ? previewText.slice(0, 100).trimEnd() + (previewText.length > 100 ? "…" : "") : null);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Read more about ${paperTitle}`}
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand();
        }
      }}
      className="
        w-full max-w-[480px] rounded-xl border border-slate-200/60
        bg-white shadow-sm p-4 cursor-pointer
        hover:shadow-md transition-shadow focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2
      "
    >
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-0">
          {/* Row 1 — field tag + component badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {fieldGroup}
            </span>
            <span className="text-xs text-slate-400">{componentType}</span>
          </div>

          {/* Row 2 — paper title */}
          <p className="text-sm font-semibold text-slate-800 leading-snug mt-2 line-clamp-2">
            {paperTitle}
          </p>

          {/* Row 3 — hook / preview teaser */}
          {teaserText && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {teaserText}
            </p>
          )}

          {/* Row 4 — mini stat callout (only when keyStat is available) */}
          {visualHints.keyStat && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-2xl font-black text-slate-900 leading-none">
                {visualHints.keyStat}
              </p>
              {visualHints.keyStatLabel && (
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                  {visualHints.keyStatLabel}
                </p>
              )}
            </div>
          )}

          {/* Row 5 — CTA */}
          <p className="text-xs text-indigo-600 font-medium mt-3">
            Read more →
          </p>
        </div>
      )}
    </div>
  );
}
