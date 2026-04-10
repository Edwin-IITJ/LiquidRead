"use client";

import { useState } from "react";

export interface DemographicsAnswers {
    fieldGroup: string;
    researchExperience: string;
    readingFrequency: string;
    priorInterviewName: string;
}

interface DemographicsScreenProps {
    initialValues: DemographicsAnswers;
    onUpdate: (updates: Partial<DemographicsAnswers>) => void;
    onSubmit: () => void;
}

const FIELD_OPTIONS = [
    "",
    "Design",
    "Engineering",
    "Sciences",
    "Social Sciences",
    "Humanities",
    "Medicine",
    "Business",
];

const EXPERIENCE_OPTIONS = [
    "I find it difficult and usually give up",
    "I manage, but it takes effort",
    "I'm fairly comfortable with most papers",
    "I read research regularly without difficulty"
];

const FREQUENCY_OPTIONS = ["Daily", "A few times a week", "A few times a month", "Rarely"];

export default function DemographicsScreen({ initialValues, onUpdate, onSubmit }: DemographicsScreenProps) {
    const { fieldGroup, researchExperience, readingFrequency, priorInterviewName } = initialValues;
    const [error, setError] = useState(false);

    function handleSubmit() {
        if (!fieldGroup || !researchExperience || !readingFrequency) {
            setError(true);
            return;
        }
        onSubmit();
    }

    return (
        <div className="fade-in">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-6">
                A bit about you
            </p>

            <div className="space-y-8">
                {/* Q-D1 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        What is your primary field of study or work?
                    </label>
                    <select
                        value={fieldGroup}
                        onChange={(e) => {
                            onUpdate({ fieldGroup: e.target.value });
                            setError(false);
                        }}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm appearance-none"
                    >
                        <option value="" disabled>Select a field...</option>
                        {FIELD_OPTIONS.filter((o) => o).map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Q-D2 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        How comfortable are you reading academic research?
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {EXPERIENCE_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onUpdate({ researchExperience: option });
                                    setError(false);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${researchExperience === option
                                    ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Q-D3 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        How often do you typically read research papers?
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {FREQUENCY_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onUpdate({ readingFrequency: option });
                                    setError(false);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${readingFrequency === option
                                    ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Q-D4 Optional Interview Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Have you been interviewed as part of this research before? If yes, enter the name you used.
                    </label>
                    <p className="text-xs text-slate-400 mb-3">
                        Optional - only if applicable.
                    </p>
                    <input
                        type="text"
                        value={priorInterviewName}
                        onChange={(e) => onUpdate({ priorInterviewName: e.target.value })}
                        placeholder="Your name"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                    />
                </div>
            </div>

            {error && (
                <p className="mt-6 text-sm text-red-500 font-medium fade-in">
                    Please answer all questions before proceeding.
                </p>
            )}

            <div className="mt-8 flex md:justify-end border-t border-slate-100 pt-6">
                <button
                    onClick={handleSubmit}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-3 text-sm font-medium transition-colors"
                >
                    Continue &rarr;
                </button>
            </div>
        </div>
    );
}
