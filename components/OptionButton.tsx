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
                    ? "border-[#7C5C3E] bg-[#F5EEE4] text-[#2C2218]"
                    : "border-[#DDD5C8] bg-[#FDFAF5] text-[#6B5C4A] hover:border-[#C4B8A8] hover:bg-[#F5EEE4]"
                }`}
        >
            <span className="font-medium">{option.label}</span>
        </button>
    );
}
