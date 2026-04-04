interface ProportionStripData {
  value: number;
  unit: string;
  label: string;
  comparisonLabel: string;
}

interface ProportionStripProps {
  data: ProportionStripData;
  caption?: string | null;
}

export default function ProportionStrip({ data, caption }: ProportionStripProps) {
  if (data?.value == null || !data?.unit || !data?.label || !data?.comparisonLabel) return null;

  const clamped = Math.min(100, Math.max(0, data.value));
  const remainder = 100 - clamped;

  return (
    <div className="py-3 space-y-2">
      {/* Row 1: value + label */}
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-slate-800">
          {data.value}{data.unit}
        </span>
        <span className="text-sm text-slate-600">{data.label}</span>
      </div>

      {/* Row 2: proportion bar */}
      <div className="w-full bg-slate-100 rounded h-3 overflow-hidden">
        <div
          className="h-full bg-slate-800 rounded"
          style={{ width: `${clamped}%` }}
        />
      </div>

      {/* Row 3: remainder label */}
      <p className="text-xs text-slate-400">
        {remainder}{data.unit} {data.comparisonLabel}
      </p>

      {/* Caption */}
      {caption && (
        <p className="text-xs text-slate-400 italic mt-3">{caption}</p>
      )}
    </div>
  );
}
