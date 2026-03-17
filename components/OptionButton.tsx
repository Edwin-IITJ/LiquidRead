"use client";

import { Option } from "@/types/quiz";

interface OptionButtonProps {
    option: Option;
    selected: boolean;
    onSelect: () => void;
    compact?: boolean;
}

export default function OptionButton({
    option,
    selected,
    onSelect,
    compact = false,
}: OptionButtonProps) {
    return (
        <button
            onClick={onSelect}
            className={`w-full text-left rounded-xl border px-5 transition-all duration-150 
        ${compact ? "py-4 text-sm" : "py-4"}
        ${selected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                }`}
        >
            <span className="font-medium">{option.label}</span>
        </button>
    );
}
