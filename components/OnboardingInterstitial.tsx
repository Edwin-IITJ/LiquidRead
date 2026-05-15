"use client";

import ProgressBar from "./ProgressBar";

interface OnboardingInterstitialProps {
    currentStep: number;
    totalSteps: number;
    headline: string;
    body: string;
    ariLine: string;
    onBack: () => void;
    onContinue: () => void;
}

export default function OnboardingInterstitial({
    currentStep,
    totalSteps,
    headline,
    body,
    ariLine,
    onBack,
    onContinue,
}: OnboardingInterstitialProps) {
    return (
        <div className="flex flex-col fade-in">
            {/* Back + Progress */}
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="text-slate-400 text-sm hover:text-slate-600 transition-colors flex items-center gap-1 mb-4"
                >
                    ← Back
                </button>
                <ProgressBar current={currentStep} total={totalSteps} />
            </div>

            {/* Content */}
            <div className="py-4">
                <h2 className="text-xl font-semibold text-slate-900 leading-snug mb-4">
                    {headline}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                    {body}
                </p>

                {/* Ari line */}
                <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 text-[9px] font-bold leading-none">A</span>
                    </span>
                    <p className="text-sm text-slate-500 italic">{ariLine}</p>
                </div>
            </div>

            {/* Continue — always enabled */}
            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                <button
                    onClick={onContinue}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl px-8 py-3 text-sm font-medium transition-colors"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
