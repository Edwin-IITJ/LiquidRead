"use client";

import ProgressBar from "./ProgressBar";

export interface DemographicsAnswers {
    fieldGroup: string;
    researchExperience: string;
    readingFrequency: string;
    priorInterviewName: string;
}

interface DemographicsScreenProps {
    step: "field" | "comfort" | "frequency" | "priorName";
    currentStep: number;
    totalSteps: number;
    initialValues: DemographicsAnswers;
    onUpdate: (updates: Partial<DemographicsAnswers>) => void;
    onBack: () => void;
    onContinue: () => void;
}

// ── Field options ──────────────────────────────────────────────────────────────
const FIELD_OPTIONS = [
    "Design",
    "Engineering",
    "Sciences",
    "Social Sciences",
    "Humanities",
    "Medicine",
    "Business",
];

// ── Comfort options with stable local ids ──────────────────────────────────────
const COMFORT_OPTIONS = [
    { id: "A", label: "I find it difficult and usually give up" },
    { id: "B", label: "I manage, but it takes effort" },
    { id: "C", label: "I'm fairly comfortable with most papers" },
    { id: "D", label: "I read research regularly without difficulty" },
] as const;

const COMFORT_ARI: Record<string, string> = {
    A: "That helps. I'll avoid dropping you into the deep end.",
    B: "Good to know. Enough depth to be useful, not enough to be punishing.",
    C: "Nice. I can assume some fluency without overexplaining everything.",
    D: "Got it. I won't dilute the interesting parts.",
};

// ── Frequency options with stable local ids ────────────────────────────────────
const FREQUENCY_OPTIONS = [
    { id: "A", label: "Daily" },
    { id: "B", label: "A few times a week" },
    { id: "C", label: "A few times a month" },
    { id: "D", label: "Rarely" },
] as const;

const FREQUENCY_ARI: Record<string, string> = {
    A: "Research is already part of your rhythm.",
    B: "Frequent enough to build momentum, not so frequent it becomes wallpaper.",
    C: "That's a good cadence for staying sharp without drowning in papers.",
    D: "Good to know. The first read should earn your attention quickly.",
};

// ── Shared layout atoms ────────────────────────────────────────────────────────

function ScreenShell({
    currentStep,
    totalSteps,
    stepLabel,
    question,
    helperLine,
    canContinue,
    ariResponse,
    onBack,
    onContinue,
    children,
}: {
    currentStep: number;
    totalSteps: number;
    stepLabel: string;
    question: string;
    helperLine: string;
    canContinue: boolean;
    ariResponse: string | null;
    onBack: () => void;
    onContinue: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-0 fade-in">
            {/* Back + Progress */}
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="text-[#9C8B78] text-sm hover:text-[#6B5C4A] transition-colors flex items-center gap-1 mb-4"
                >
                    ← Back
                </button>
                <ProgressBar current={currentStep} total={totalSteps} />
            </div>

            {/* Step label */}
            <p className="text-xs font-medium uppercase tracking-widest text-[#9C8B78] mb-3">
                {stepLabel}
            </p>

            {/* Question */}
            <h2 className="text-xl font-semibold text-[#2C2218] leading-snug mb-2">
                {question}
            </h2>

            {/* Helper line */}
            <p className="text-sm text-[#9C8B78] mb-7">{helperLine}</p>

            {/* Options slot */}
            {children}

            {/* Ari response line */}
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

            {/* Continue button — always visible, disabled until valid */}
            <div className="mt-6 flex justify-end border-t border-[#E8E0D5] pt-6">
                <button
                    onClick={onContinue}
                    disabled={!canContinue}
                    className={`w-full sm:w-auto rounded-xl px-8 py-3 text-sm font-medium transition-colors
                        ${canContinue
                            ? "bg-[#7C5C3E] hover:bg-[#6A4E34] active:bg-[#5A4028] text-white cursor-pointer"
                            : "bg-[#EDE5D8] text-[#9C8B78] cursor-not-allowed"
                        }`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

function OptionPill({
    label,
    selected,
    onSelect,
}: {
    label: string;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={`w-full text-left rounded-xl border px-5 py-4 text-sm font-medium transition-all duration-150
                ${selected
                    ? "border-[#7C5C3E] bg-[#F5EEE4] text-[#2C2218]"
                    : "border-[#DDD5C8] bg-[#FDFAF5] text-[#6B5C4A] hover:border-[#C4B8A8] hover:bg-[#F5EEE4]"
                }`}
        >
            {label}
        </button>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DemographicsScreen({
    step,
    currentStep,
    totalSteps,
    initialValues,
    onUpdate,
    onBack,
    onContinue,
}: DemographicsScreenProps) {
    const { fieldGroup, researchExperience, readingFrequency, priorInterviewName } = initialValues;

    // ── Field ──────────────────────────────────────────────────────────────────
    if (step === "field") {
        return (
            <ScreenShell
                currentStep={currentStep}
                totalSteps={totalSteps}
                stepLabel="About you"
                question="What field do you work or study in most?"
                helperLine="This helps me start in the right neighborhood."
                canContinue={fieldGroup !== ""}
                ariResponse={null}
                onBack={onBack}
                onContinue={onContinue}
            >
                <div className="flex flex-col gap-2">
                    {FIELD_OPTIONS.map((opt) => (
                        <OptionPill
                            key={opt}
                            label={opt}
                            selected={fieldGroup === opt}
                            onSelect={() => onUpdate({ fieldGroup: opt })}
                        />
                    ))}
                    {!fieldGroup && (
                        <p className="text-xs text-[#9C8B78] mt-1">Pick one to continue.</p>
                    )}
                </div>
            </ScreenShell>
        );
    }

    // ── Research comfort ───────────────────────────────────────────────────────
    if (step === "comfort") {
        const selected = COMFORT_OPTIONS.find((o) => o.label === researchExperience);
        return (
            <ScreenShell
                currentStep={currentStep}
                totalSteps={totalSteps}
                stepLabel="About you"
                question="How comfortable are you with academic papers right now?"
                helperLine="No right answer here. This just helps me choose the right depth."
                canContinue={researchExperience !== ""}
                ariResponse={selected ? COMFORT_ARI[selected.id] : null}
                onBack={onBack}
                onContinue={onContinue}
            >
                <div className="flex flex-col gap-2">
                    {COMFORT_OPTIONS.map((opt) => (
                        <OptionPill
                            key={opt.id}
                            label={opt.label}
                            selected={researchExperience === opt.label}
                            onSelect={() => onUpdate({ researchExperience: opt.label })}
                        />
                    ))}
                    {!researchExperience && (
                        <p className="text-xs text-[#9C8B78] mt-1">Pick one to continue.</p>
                    )}
                </div>
            </ScreenShell>
        );
    }

    // ── Reading frequency ──────────────────────────────────────────────────────
    if (step === "frequency") {
        const selected = FREQUENCY_OPTIONS.find((o) => o.label === readingFrequency);
        return (
            <ScreenShell
                currentStep={currentStep}
                totalSteps={totalSteps}
                stepLabel="About you"
                question="How often do you usually read research?"
                helperLine="This helps me gauge how familiar this world already feels."
                canContinue={readingFrequency !== ""}
                ariResponse={selected ? FREQUENCY_ARI[selected.id] : null}
                onBack={onBack}
                onContinue={onContinue}
            >
                <div className="flex flex-col gap-2">
                    {FREQUENCY_OPTIONS.map((opt) => (
                        <OptionPill
                            key={opt.id}
                            label={opt.label}
                            selected={readingFrequency === opt.label}
                            onSelect={() => onUpdate({ readingFrequency: opt.label })}
                        />
                    ))}
                    {!readingFrequency && (
                        <p className="text-xs text-[#9C8B78] mt-1">Pick one to continue.</p>
                    )}
                </div>
            </ScreenShell>
        );
    }

    // ── Prior interview name (optional) ────────────────────────────────────────
    return (
        <ScreenShell
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepLabel="About you"
            question="Have you tested LiquidRead before?"
            helperLine="Optional. If yes, enter the same name you used earlier."
            canContinue={true}
            ariResponse={null}
            onBack={onBack}
            onContinue={onContinue}
        >
            <input
                type="text"
                value={priorInterviewName}
                onChange={(e) => onUpdate({ priorInterviewName: e.target.value })}
                placeholder="Type your name"
                className="w-full rounded-xl border border-[#DDD5C8] bg-[#FDFAF5] px-5 py-4 text-[#2C2218] placeholder-[#9C8B78] focus:outline-none focus:border-[#7C5C3E] focus:ring-2 focus:ring-[#EDE5D8] transition-all text-sm"
            />
        </ScreenShell>
    );
}
