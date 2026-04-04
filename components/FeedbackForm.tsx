"use client";

import { useState } from "react";
import { CalibrationResponse } from "@/types/quiz";

interface FeedbackFormProps {
    onSubmit: (calibration: CalibrationResponse, optionalFeedback: string) => Promise<void>;
}

const CALIBRATION_OPTIONS: { value: CalibrationResponse; label: string }[] = [
    { value: "too_basic",    label: "Too basic" },
    { value: "just_right",   label: "About right" },
    { value: "too_advanced", label: "Too advanced" },
];

export default function FeedbackForm({ onSubmit }: FeedbackFormProps) {
    const [calibration, setCalibration] = useState<CalibrationResponse | null>(null);
    const [optionalFeedback, setOptionalFeedback] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!calibration) return;
        setLoading(true);
        await onSubmit(calibration, optionalFeedback);
        setLoading(false);
    }

    return (
        <div className="py-4 fade-in">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
                Did this card feel…
            </h2>
            <p className="text-sm text-slate-400 mb-6">
                Required — pick one
            </p>

            <div className="flex flex-col gap-3 mb-8">
                {CALIBRATION_OPTIONS.map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => setCalibration(value)}
                        className={`w-full py-4 px-5 text-left rounded-xl border font-medium transition-all duration-150
              ${calibration === value
                                ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    What would make this card more useful to you personally?{" "}
                    <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                    value={optionalFeedback}
                    onChange={(e) => setOptionalFeedback(e.target.value)}
                    rows={4}
                    placeholder="Anything helps…"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none text-sm"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={!calibration || loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
                {loading && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loading ? "Submitting…" : "Submit"}
            </button>
        </div>
    );
}
