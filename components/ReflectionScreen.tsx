"use client";

import { useState } from "react";
import ProgressBar from "./ProgressBar";

export interface ReflectionAnswers {
    suitability: number;
    openFeedback: string;
}

interface ReflectionScreenProps {
    onSubmit: (answers: ReflectionAnswers) => Promise<void>;
}

const SCALE_OPTIONS = [1, 2, 3, 4, 5];

export default function ReflectionScreen({ onSubmit }: ReflectionScreenProps) {
    const [suitability, setSuitability] = useState<number>(0);
    const [openFeedback, setOpenFeedback] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (suitability === 0) {
            setError(true);
            return;
        }
        setLoading(true);
        await onSubmit({ suitability, openFeedback });
        // Let the parent component unmount or transition us, 
        // no need to set loading false here because the component unmounts.
    }

    return (
        <div>
            <ProgressBar current={1} total={1} label="Complete" />
            <div className="mt-8 fade-in">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                    Two quick follow-up questions
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                    Your honest reaction is the most useful thing you can give us.
                </p>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        How well did the presentation feel matched to you personally?
                    </label>
                    <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-2 relative">
                        {/* Connecting line for scale */}
                        <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-200 -translate-y-1/2 z-0 hidden sm:block"></div>

                        {SCALE_OPTIONS.map((num) => (
                            <button
                                key={num}
                                onClick={() => {
                                    setSuitability(num);
                                    setError(false);
                                }}
                                className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${suitability === num
                                        ? "bg-indigo-600 outline outline-2 outline-offset-2 outline-indigo-500 text-white shadow-md shadow-indigo-200"
                                        : "bg-white border hover:bg-slate-100 hover:border-slate-300 shadow-sm border-slate-200 text-slate-700"
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    {/* Scale labels */}
                    <div className="flex justify-between text-xs text-slate-500 mt-3 px-1">
                        <span className="w-20 sm:w-24 text-center leading-snug">
                            1 &rarr; &quot;Felt completely generic&quot;
                        </span>
                        <span className="w-20 sm:w-24 text-center leading-snug hidden sm:block">
                            3 &rarr; &quot;Somewhat suited to me&quot;
                        </span>
                        <span className="w-20 sm:w-24 text-center leading-snug">
                            5 &rarr; &quot;Felt made specifically for me&quot;
                        </span>
                    </div>

                    {error && suitability === 0 && (
                        <p className="mt-3 text-sm text-red-500 font-medium fade-in">
                            Please select a number on the scale.
                        </p>
                    )}
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-700 mt-6 mb-2">
                        What, if anything, would you have changed about how this was presented to you?
                    </label>
                    <p className="text-xs text-slate-400 mb-3">
                        Optional, skip if nothing comes to mind.
                    </p>
                    <textarea
                        value={openFeedback}
                        onChange={(e) => setOpenFeedback(e.target.value)}
                        rows={3}
                        placeholder="e.g. more visuals, less jargon, different structure..."
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none text-sm"
                    />
                </div>

                <div className="mt-8 flex md:justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-3 text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {loading ? "Submitting..." : "Submit \u2192"}
                    </button>
                </div>
            </div>
        </div>
    );
}
