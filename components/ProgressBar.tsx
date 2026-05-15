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
                <span className="text-xs font-medium text-[#9C8B78] tracking-wide uppercase">
                    {label || `Step ${current} of ${total}`}
                </span>
            </div>
            <div className="w-full h-1 bg-[#E8E0D5] rounded-full overflow-hidden">
                <div
                    className="h-full bg-[#7C5C3E] rounded-full transition-all duration-400 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
