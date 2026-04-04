interface StepDiagramData {
  steps: string[];
}

interface StepDiagramProps {
  data: StepDiagramData;
  caption?: string | null;
}

export default function StepDiagram({ data, caption }: StepDiagramProps) {
  if (!data?.steps?.length) return null;

  const steps = data.steps.slice(0, 5);

  return (
    <div className="py-3">
      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={i} className="flex gap-3">
              {/* Left: number circle + connecting line */}
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold leading-none">{i + 1}</span>
                </div>
                {!isLast && (
                  <div className="flex-1 border-l-2 border-slate-200 mt-1 mb-1 min-h-4" />
                )}
              </div>

              {/* Right: step text */}
              <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                <p className="text-sm text-slate-700 pt-0.5">{step}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Caption */}
      {caption && (
        <p className="text-xs text-slate-400 italic mt-3">{caption}</p>
      )}
    </div>
  );
}
