"use client";

import { Question } from "@/types/quiz";
import OptionButton from "./OptionButton";
import TextInput from "./TextInput";
import SleepChartOption from "./SleepChartOption";

interface QuestionCardProps {
    question: Question;
    selectedOptionId: string | null;
    fieldValue: string;
    onOptionSelect: (optionId: string, label: string, points: number) => void;
    onTextChange: (value: string) => void;
}

export default function QuestionCard({
    question,
    selectedOptionId,
    fieldValue,
    onOptionSelect,
    onTextChange,
}: QuestionCardProps) {
    const isVisualCards = question.layout === "visual-cards";

    return (
        <div>
            <h2 className="text-xl font-semibold text-slate-900 leading-snug mb-6">
                {question.text}
            </h2>

            {question.type === "text" ? (
                <TextInput
                    value={fieldValue}
                    onChange={onTextChange}
                    placeholder="e.g. machine learning, urban planning..."
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
                                    onSelect={() => onOptionSelect(option.id, option.label, option.points)}
                                />
                            );
                        }
                        return (
                            <OptionButton
                                key={option.id}
                                option={option}
                                selected={selectedOptionId === option.id}
                                onSelect={() => onOptionSelect(option.id, option.label, option.points)}
                                compact={isVisualCards}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
