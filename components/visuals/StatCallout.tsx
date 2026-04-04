interface StatCalloutData {
  value: string;
  label: string;
  comparisonValue?: string | null;
  comparisonLabel?: string | null;
}

interface StatCalloutProps {
  data: StatCalloutData;
  caption?: string | null;
}

export default function StatCallout({ data, caption }: StatCalloutProps) {
  if (!data?.value || !data?.label) return null;

  return (
    <div className="py-3">
      {/* Primary stat */}
      <div>
        <p className="text-5xl font-black text-slate-900 leading-none">{data.value}</p>
        <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">{data.label}</p>
      </div>

      {/* Optional comparison row */}
      {data.comparisonValue && (
        <>
          <div className="border-t border-slate-200 mt-3 pt-3">
            <p className="text-sm text-slate-400">
              {data.comparisonValue}
              {data.comparisonLabel && (
                <span className="ml-1">{data.comparisonLabel}</span>
              )}
            </p>
          </div>
        </>
      )}

      {/* Caption */}
      {caption && (
        <p className="text-xs text-slate-400 italic mt-3">{caption}</p>
      )}
    </div>
  );
}
