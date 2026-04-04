interface DumbbellStripData {
  leftValue: string | number;
  leftLabel: string;
  rightValue: string | number;
  rightLabel: string;
  delta: string;
  unit: string;
}

interface DumbbellStripProps {
  data: DumbbellStripData;
  caption?: string | null;
}

export default function DumbbellStrip({ data, caption }: DumbbellStripProps) {
  if (
    data?.leftValue == null ||
    !data?.leftLabel ||
    data?.rightValue == null ||
    !data?.rightLabel ||
    !data?.delta ||
    !data?.unit
  ) return null;

  return (
    <div className="py-3">
      {/* Desktop layout */}
      <div className="hidden sm:block">
        <div className="relative flex items-center justify-between">
          {/* Left endpoint */}
          <div className="flex flex-col items-start z-10">
            <span className="text-xs text-slate-500 uppercase tracking-widest mb-1">
              {data.leftLabel}
            </span>
            <span className="text-xl font-bold text-slate-800">
              {data.leftValue}
            </span>
          </div>

          {/* Connecting line with dots */}
          <div className="absolute left-0 right-0 top-[52%] flex items-center px-0">
            <div className="w-2 h-2 rounded-full bg-slate-800 flex-shrink-0" />
            <div className="flex-1 border-t border-slate-300" />
            <div className="w-2 h-2 rounded-full bg-slate-800 flex-shrink-0" />
          </div>

          {/* Right endpoint */}
          <div className="flex flex-col items-end z-10">
            <span className="text-xs text-slate-500 uppercase tracking-widest mb-1 text-right">
              {data.rightLabel}
            </span>
            <span className="text-xl font-bold text-slate-800">
              {data.rightValue}
            </span>
          </div>
        </div>

        {/* Delta below center */}
        <div className="flex flex-col items-center mt-2">
          <span className="text-xs font-semibold text-indigo-600">{data.delta}</span>
          <span className="text-xs text-slate-400">{data.unit}</span>
        </div>
      </div>

      {/* Mobile layout: stacked */}
      <div className="sm:hidden flex flex-col items-center gap-2">
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-500 uppercase tracking-widest">
            {data.leftLabel}
          </span>
          <span className="text-xl font-bold text-slate-800">{data.leftValue}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-indigo-600">{data.delta}</span>
          <span className="text-xs text-slate-400">{data.unit}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-500 uppercase tracking-widest">
            {data.rightLabel}
          </span>
          <span className="text-xl font-bold text-slate-800">{data.rightValue}</span>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-xs text-slate-400 italic mt-3">{caption}</p>
      )}
    </div>
  );
}
