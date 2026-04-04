interface RankItem {
  label: string;
  value: number;
}

interface RankStripData {
  unit: string;
  items: RankItem[];
}

interface RankStripProps {
  data: RankStripData;
  caption?: string | null;
}

export default function RankStrip({ data, caption }: RankStripProps) {
  if (!data?.items?.length || !data?.unit) return null;

  const sorted = [...data.items]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const maxValue = sorted[0]?.value ?? 1;

  return (
    <div className="py-3 space-y-2">
      {sorted.map((item, i) => {
        const widthPct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

        return (
          <div key={i} className="flex items-center gap-3">
            {/* Label */}
            <span
              className="text-sm text-slate-700 flex-shrink-0 truncate"
              style={{ width: "7rem" }}
              title={item.label}
            >
              {item.label}
            </span>

            {/* Bar */}
            <div className="flex-1 bg-slate-200 rounded overflow-hidden h-3">
              <div
                className="h-full bg-slate-800 rounded"
                style={{ width: `${widthPct}%` }}
              />
            </div>

            {/* Value + unit */}
            <span className="text-xs text-slate-500 flex-shrink-0 w-16 text-right">
              {item.value}{data.unit}
            </span>
          </div>
        );
      })}

      {/* Caption */}
      {caption && (
        <p className="text-xs text-slate-400 italic mt-3">{caption}</p>
      )}
    </div>
  );
}
