"use client";

interface ProgressBarProps {
    current: number; // 1-based
    total: number;
    label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
    const percentage = (current / total) * 100;

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
                    {label || `Step ${current} of ${total}`}
                </span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-400 rounded-full transition-all duration-400 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
