"use client";

import { Question } from "@/types/quiz";
import OptionButton from "./OptionButton";
import TextInput from "./TextInput";
import SleepChartOption from "./SleepChartOption";

interface QuestionCardProps {
    question: Question;
    selectedOptionId: string | null;
    fieldValue: string;
    stepLabel: string;
    displayText: string;      // overrides question.text for display
    helperLine: string;
    ariResponse: string | null; // shown beneath options after selection
    onOptionSelect: (optionId: string, label: string, points: number) => void;
    onTextChange: (value: string) => void;
}

export default function QuestionCard({
    question,
    selectedOptionId,
    fieldValue,
    stepLabel,
    displayText,
    helperLine,
    ariResponse,
    onOptionSelect,
    onTextChange,
}: QuestionCardProps) {
    const isVisualCards = question.layout === "visual-cards";

    return (
        <div>
            {/* Step label */}
            <p className="text-xs font-medium uppercase tracking-widest text-[#9C8B78] mb-3">
                {stepLabel}
            </p>

            {/* Question text */}
            <h2 className="text-xl font-semibold text-[#2C2218] leading-snug mb-2">
                {displayText}
            </h2>

            {/* Helper line */}
            <p className="text-sm text-[#9C8B78] mb-7">{helperLine}</p>

            {/* Options or text input */}
            {question.type === "text" ? (
                <TextInput
                    value={fieldValue}
                    onChange={onTextChange}
                    placeholder="Type a topic or field"
                />
            ) : (
                <div
                    className={
                        isVisualCards
                            ? "grid grid-cols-1 sm:grid-cols-3 gap-3"
                            : "flex flex-col gap-3"
                    }
                >
                    {question.options?.map((option) => {
                        if (option.id === "C" && isVisualCards) {
                            return (
                                <SleepChartOption
                                    key={option.id}
                                    selected={selectedOptionId === option.id}
                                    onSelect={() =>
                                        onOptionSelect(option.id, option.label, option.points)
                                    }
                                />
                            );
                        }
                        return (
                            <OptionButton
                                key={option.id}
                                option={option}
                                selected={selectedOptionId === option.id}
                                onSelect={() =>
                                    onOptionSelect(option.id, option.label, option.points)
                                }
                                compact={isVisualCards}
                            />
                        );
                    })}
                </div>
            )}

            {/* Ari response line — appears after selection, no layout shift */}
            <div className="min-h-[28px] mt-5">
                {ariResponse && (
                    <div className="flex items-start gap-2 fade-in">
                        <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-[#EDE5D8] flex items-center justify-center">
                            <span className="text-[#7C5C3E] text-[9px] font-bold leading-none">A</span>
                        </span>
                        <p className="text-sm text-[#6B5C4A] italic">{ariResponse}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
