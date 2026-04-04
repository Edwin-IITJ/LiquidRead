interface SlopeStripData {
  beforeLabel: string;
  beforeValue: number;
  afterLabel: string;
  afterValue: number;
  unit: string;
  direction: "up" | "down";
  deltaLabel: string;
}

interface SlopeStripProps {
  data: SlopeStripData;
  caption?: string | null;
}

export default function SlopeStrip({ data, caption }: SlopeStripProps) {
  if (
    !data?.beforeLabel ||
    data?.beforeValue == null ||
    !data?.afterLabel ||
    data?.afterValue == null ||
    !data?.unit ||
    !data?.direction ||
    !data?.deltaLabel
  ) return null;

  const isDown = data.direction === "down";

  // SVG layout constants
  const W = 200;
  const H = 80;
  const leftX = 30;
  const rightX = 170;
  // If "down": left point is high (y=15), right is low (y=55)
  // If "up": left point is low (y=55), right is high (y=15)
  const leftY = isDown ? 20 : 55;
  const rightY = isDown ? 55 : 20;

  const strokeColor = isDown ? "#6366f1" : "#10b981"; // indigo-500 / emerald-500
  const fillColor = strokeColor;
  const textColor = isDown ? "text-indigo-600" : "text-emerald-600";

  return (
    <div className="py-3">
      {/* Period labels row */}
      <div className="flex justify-between px-0 mb-1">
        <span className="text-xs text-slate-500">{data.beforeLabel}</span>
        <span className="text-xs text-slate-500">{data.afterLabel}</span>
      </div>

      {/* SVG slope chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="overflow-visible"
        aria-hidden="true"
      >
        {/* Before value label */}
        <text
          x={leftX}
          y={leftY - 6}
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontWeight="600"
        >
          {data.beforeValue}
        </text>

        {/* After value label */}
        <text
          x={rightX}
          y={rightY - 6}
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontWeight="600"
        >
          {data.afterValue}
        </text>

        {/* Slope line */}
        <line
          x1={leftX}
          y1={leftY}
          x2={rightX}
          y2={rightY}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Left dot */}
        <circle cx={leftX} cy={leftY} r="4" fill={fillColor} />

        {/* Right dot */}
        <circle cx={rightX} cy={rightY} r="4" fill={fillColor} />

        {/* Delta label + unit below center */}
        <text
          x={W / 2}
          y={H - 12}
          textAnchor="middle"
          fontSize="10"
          fill={strokeColor}
          fontWeight="700"
        >
          {data.deltaLabel}
        </text>
        <text
          x={W / 2}
          y={H}
          textAnchor="middle"
          fontSize="9"
          fill="#94a3b8"
        >
          {data.unit}
        </text>
      </svg>

      {/* Caption */}
      {caption && (
        <p className={`text-xs italic mt-3 ${textColor.replace("600", "400").replace("text-indigo-400", "text-slate-400").replace("text-emerald-400", "text-slate-400")}`}>
          {caption}
        </p>
      )}
    </div>
  );
}
