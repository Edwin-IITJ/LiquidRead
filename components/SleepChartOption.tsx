"use client";

interface SleepChartOptionProps {
    selected: boolean;
    onSelect: () => void;
}

export default function SleepChartOption({ selected, onSelect }: SleepChartOptionProps) {
    return (
        <button
            onClick={onSelect}
            className={`w-full rounded-xl border px-4 py-4 transition-all duration-150 flex flex-col items-center gap-2
        ${selected
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
        >
            {/* Inline SVG: Hours of sleep vs Error rate */}
            <svg
                viewBox="0 0 180 110"
                width="100%"
                height="80"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Line chart: as hours of sleep increase, error rate decreases"
            >
                {/* Axes */}
                <line x1="28" y1="10" x2="28" y2="88" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="28" y1="88" x2="170" y2="88" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Y-axis label */}
                <text
                    x="6"
                    y="50"
                    fontSize="9"
                    fill="#94a3b8"
                    textAnchor="middle"
                    transform="rotate(-90, 6, 50)"
                >
                    Error rate
                </text>

                {/* X-axis label */}
                <text x="99" y="102" fontSize="9" fill="#94a3b8" textAnchor="middle">
                    Hours of sleep
                </text>

                {/* Downward-sloping line */}
                <polyline
                    points="40,18 70,32 100,52 130,68 160,80"
                    fill="none"
                    stroke={selected ? "#6366f1" : "#94a3b8"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {[[40, 18], [70, 32], [100, 52], [130, 68], [160, 80]].map(([cx, cy], i) => (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r="3"
                        fill={selected ? "#6366f1" : "#94a3b8"}
                    />
                ))}
            </svg>
            <span className="text-xs text-slate-500 font-medium">(Visual)</span>
        </button>
    );
}
