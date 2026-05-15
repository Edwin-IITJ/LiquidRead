"use client";

import { useState, useEffect } from "react";
import { logEvent } from "@/utils/logEvent";
import { getSessionId } from "@/utils/sessionId";
import { QuizState } from "@/types/quiz";
import { questions } from "@/data/questions";
import { calculateScore } from "@/lib/scoring";
import { submitToSheet } from "@/lib/submitData";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import CardDisplay from "./CardDisplay";
import PersonaPanel from "./PersonaPanel";
import DemographicsScreen, { DemographicsAnswers } from "./DemographicsScreen";
import OnboardingInterstitial from "./OnboardingInterstitial";
import ThankYou from "./ThankYou";
import IntroScreen from "./IntroScreen";

const STORAGE_KEY = "mtp-survey-progress";
const TOTAL_STEPS = 15; // steps 1–15 are counted; 0 = welcome, 16 = final

// Old app states that may exist in persisted localStorage — redirect them
const STALE_STATES = ["intro", "demographics", "questions"];

const initialState: QuizState = {
    appState: "onboarding",
    onboardingStep: 0,
    progressIndex: 0, // kept for downstream compat, not used for routing
    answers: {},
    field: "",
    fieldGroup: "",
    researchExperience: "",
    readingFrequency: "",
    priorInterviewName: "",
    rawScore: 0,
    normalisedScore: 0,
    cardShown: "A",
    calibrationResponse: null,
    suitability: 0,
    openFeedback: "",
    paperTitle: "",
    generatedCardText: "",
};

// ── Ari response map: keyed by questionId → optionId ──────────────────────────
const ARI_RESPONSES: Record<string, Record<string, string>> = {
    q1: {
        A: "You don't mind productive friction. That changes how much I can leave implicit.",
        B: "Makes sense. You'll usually tolerate complexity if it rewards patience.",
        C: "You're looking for the shape before the details. That's useful.",
        D: "Fair. If the paper loses you too early, it's the paper's fault too.",
    },
    q2: {
        A: "So the right paper matters more than a long list of average ones.",
        B: "You like range before commitment. That changes what should surface first.",
    },
    q3: {
        A: "You're intentional. Relevance matters more than surprise.",
        B: "Your research world is partly curated by trust. That's useful context.",
        C: "That's probably the most realistic answer here.",
        D: "Then the signal needs to be clearer when it does reach you.",
    },
    q4: {
        A: "So the value is in staying oriented, not diving all the way down every time.",
        B: "That usually means less fluff, more signal.",
        C: "Curiosity is a perfectly good reading strategy, despite what productivity culture says.",
        D: "Then usefulness beats elegance. The paper needs to help fast.",
    },
    q5: {
        A: "You want the point to land before the terminology does.",
        B: "You don't need the edges sanded down.",
        C: "You want the structure to show itself before the text explains it.",
    },
    q6: {
        A: "Then the first layer needs to prove itself almost immediately.",
        B: "Enough time for substance, not enough time for wandering.",
        C: "Good. That gives me room to unfold things properly.",
    },
    q7: {
        A: "Fair. Bad recommendations burn trust quickly.",
        B: "You leave room for serendipity. That's rare and useful.",
        C: "Reasonable. Surprise is good until it becomes noise.",
    },
    q9: {
        A: "You trust the foundation before the framing.",
        B: "You want the claim before the commentary.",
        C: "You care about consequence first, then detail.",
        D: "You read by connecting, not just collecting.",
    },
};

// ── Per-step metadata for question screens ─────────────────────────────────────
// onboardingStep → { stepLabel, displayText, helperLine }
const QUESTION_STEP_META: Record<number, { stepLabel: string; displayText: string; helperLine: string }> = {
    6: {
        stepLabel: "How you read",
        displayText: "You open a paper on a topic you don't know well. Two paragraphs in, it gets complicated. What do you usually do?",
        helperLine: "This tells me how much scaffolding to give you.",
    },
    7: {
        stepLabel: "How you read",
        displayText: "You've got 20 minutes for research. What feels more satisfying?",
        helperLine: "Breadth and depth lead to very different reading experiences.",
    },
    8: {
        stepLabel: "How you read",
        displayText: "How does important research usually reach you?",
        helperLine: "Some people hunt for it. Some stumble into it. Most do both.",
    },
    9: {
        stepLabel: "How you read",
        displayText: "Right now, what's research mostly doing for you?",
        helperLine: "This helps me understand your reading mode today.",
    },
    11: {
        stepLabel: "How it should show up",
        displayText: "Which of these would make you most likely to keep reading?",
        helperLine: "This tells me what kind of opening pulls you in.",
    },
    12: {
        stepLabel: "How it should show up",
        displayText: "When you open something to read, how much time do you usually have?",
        helperLine: "This affects how much should appear upfront.",
    },
    13: {
        stepLabel: "How it should show up",
        displayText: "If a recommended paper turns out to be irrelevant, how do you react?",
        helperLine: "This helps me understand how much discovery feels welcome.",
    },
    14: {
        stepLabel: "How it should show up",
        displayText: "When you hear an interesting research claim, what do you want to know first?",
        helperLine: "Different readers trust different entry points.",
    },
    15: {
        stepLabel: "What you're curious about",
        displayText: "What's one topic you'd genuinely like to explore right now?",
        helperLine: "Be specific if you can. That helps me pick better.",
    },
};

// ── Map: onboarding step → questions[] array index ────────────────────────────
const STEP_TO_Q_INDEX: Record<number, number> = {
    6: 0, 7: 1, 8: 2, 9: 3,
    11: 4, 12: 5, 13: 6, 14: 7, 15: 8,
};

const DEMO_STEPS: Record<number, "field" | "comfort" | "frequency" | "priorName"> = {
    1: "field",
    2: "comfort",
    3: "frequency",
    4: "priorName",
};

// ── Helper wrapper ─────────────────────────────────────────────────────────────
function QuizWrapper({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen flex items-start justify-center px-4 py-8 bg-[#F2EDE4]">
            <div className="w-full max-w-2xl bg-[#FDFAF5] border border-[#DDD5C8] rounded-2xl p-6 sm:p-10 shadow-none">
                {children}
            </div>
        </main>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function QuizApp() {
    const [state, setState] = useState<QuizState>(initialState);

    // Restore persisted state; redirect any stale old-style sessions to fresh onboarding
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (localStorage.getItem("mtp-survey-done") === "true") {
            setState((s) => ({ ...s, appState: "thankyou" }));
            return;
        }
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (STALE_STATES.includes(parsed.appState)) {
                    // Old session — restart cleanly
                    localStorage.removeItem(STORAGE_KEY);
                } else {
                    setState(parsed);
                }
            } catch (e) {
                console.error("Failed to parse saved survey state", e);
            }
        }
    }, []);

    // Persist state (skip welcome screen and thankyou to avoid premature saves)
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (state.appState === "thankyou") return;
        if (state.appState === "onboarding" && state.onboardingStep === 0) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // ── Helpers ──────────────────────────────────────────────────────────────

    function advance() {
        setState((s) => ({ ...s, onboardingStep: s.onboardingStep + 1 }));
    }

    function retreat() {
        setState((s) => ({ ...s, onboardingStep: Math.max(0, s.onboardingStep - 1) }));
    }

    function goToScoring() {
        const { rawScore, normalisedScore, cardShown } = calculateScore(state.answers);
        setState((s) => ({ ...s, appState: "scoring", rawScore, normalisedScore, cardShown }));
        setTimeout(() => {
            setState((s) => ({ ...s, appState: "card" }));
        }, 0);
        logEvent({
            session_id: getSessionId(),
            event_type: "session_start",
            component_type: null,
            card_variant: cardShown,
            paper_title: null,
            paper_field: state.fieldGroup ?? null,
            normalised_score: normalisedScore,
            participant: state.priorInterviewName ?? null,
            metadata: {
                rawScore,
                fieldGroup: state.fieldGroup,
                researchExperience: state.researchExperience,
                readingFrequency: state.readingFrequency,
                priorInterviewName: state.priorInterviewName,
                q1: state.answers.q1?.label ?? null,
                q2: state.answers.q2?.label ?? null,
                q3: state.answers.q3?.label ?? null,
                q4: state.answers.q4?.label ?? null,
                q5: state.answers.q5?.label ?? null,
                q6: state.answers.q6?.label ?? null,
                q7: state.answers.q7?.label ?? null,
                q9: state.answers.q9?.label ?? null,
            },
        });
    }

    async function handleCardProceed(
        suitability: number,
        calibration: "too_basic" | "just_right" | "too_advanced",
        openFeedback: string,
        paperTitle: string
    ) {
        logEvent({
            session_id: getSessionId(),
            event_type: "card_rated",
            component_type: null,
            card_variant: state.cardShown,
            paper_title: paperTitle,
            paper_field: state.fieldGroup ?? null,
            normalised_score: state.normalisedScore,
            calibration_signal: calibration,
            suitability_rating: suitability,
            metadata: {
                suitabilityRating: suitability,
                calibrationSignal: calibration,
                openFeedback: openFeedback ?? null,
            },
        });

        const payload = {
            timestamp: new Date().toISOString(),
            fieldGroup: state.fieldGroup,
            researchExperience: state.researchExperience,
            readingFrequency: state.readingFrequency,
            priorInterviewName: state.priorInterviewName,
            q1: state.answers.q1?.label ?? "",
            q2: state.answers.q2?.label ?? "",
            q3: state.answers.q3?.label ?? "",
            q4: state.answers.q4?.label ?? "",
            q5: state.answers.q5?.label ?? "",
            q6: state.answers.q6?.label ?? "",
            q7: state.answers.q7?.label ?? "",
            q9: state.answers.q9?.label ?? "",
            field: state.field,
            suitability,
            openFeedback,
            rawScore: state.rawScore,
            normalisedScore: state.normalisedScore,
            cardShown: state.cardShown,
            calibrationResponse: calibration,
            paperTitle,
            generatedCardText: state.generatedCardText,
        };

        await submitToSheet(payload);
        if (typeof window !== "undefined") {
            localStorage.setItem("mtp-survey-done", "true");
            localStorage.removeItem(STORAGE_KEY);
        }
        setState((s) => ({ ...s, appState: "thankyou" }));
    }

    // ── Render: post-onboarding states (UNTOUCHED) ────────────────────────────

    if (state.appState === "scoring") return null;

    if (state.appState === "thankyou") {
        return <QuizWrapper><ThankYou /></QuizWrapper>;
    }

    if (state.appState === "card") {
        return (
                <div className="flex flex-col h-screen overflow-hidden bg-[#F2EDE4] text-[#2C2218] font-sans">
                {/* ── TOP BAR ── */}
                <header className="h-[56px] px-6 flex items-center justify-between border-b border-[#DDD5C8] bg-[#FDFAF5] shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#7C5C3E] rounded-md flex items-center justify-center">
                            <span className="text-white text-xs font-bold leading-none">Lr</span>
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-[#2C2218]">LiquidRead</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-[#9C8B78] hover:text-[#6B5C4A] transition-colors" aria-label="Settings">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-[#E8E0D5] border border-[#DDD5C8] overflow-hidden flex items-end justify-center">
                            <svg className="w-6 h-6 text-[#9C8B78] mb-[-2px]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                    </div>
                </header>

                {/* ── 2-COLUMN MAIN LAYOUT ── */}
                <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
                    <PersonaPanel
                        cardType={state.cardShown}
                        field={state.fieldGroup || "default"}
                        readingGoal={state.answers.q4?.label}
                        timeAvailable={state.answers.q6?.label}
                        confusionResponse={state.answers.q1?.label}
                        normalisedScore={state.normalisedScore}
                    />
            <main className="flex-1 min-w-0 overflow-y-auto bg-[#F2EDE4] flex flex-col">
                        <CardDisplay
                            cardType={state.cardShown}
                            fieldGroup={state.fieldGroup || "default"}
                            readingComfort={state.answers.q1?.label}
                            readingGoal={state.answers.q4?.label}
                            timeAvailable={state.answers.q6?.label}
                            trustAnchor={state.answers.q9?.label}
                            researchInterest={state.field}
                            confusionResponse={state.answers.q1?.label}
                            normalisedScore={state.normalisedScore}
                            onProceed={handleCardProceed}
                        />
                    </main>
                </div>
            </div>
        );
    }

    // ── Render: onboarding ────────────────────────────────────────────────────
    const step = state.onboardingStep;

    // ── Step 0: Welcome ───────────────────────────────────────────────────────
    if (step === 0) {
        return (
            <QuizWrapper>
                <IntroScreen onStart={advance} />
            </QuizWrapper>
        );
    }

    // ── Steps 1–4: Demographics ───────────────────────────────────────────────
    if (step >= 1 && step <= 4) {
        return (
            <QuizWrapper>
                <DemographicsScreen
                    step={DEMO_STEPS[step]}
                    currentStep={step}
                    totalSteps={TOTAL_STEPS}
                    initialValues={{
                        fieldGroup: state.fieldGroup,
                        researchExperience: state.researchExperience,
                        readingFrequency: state.readingFrequency,
                        priorInterviewName: state.priorInterviewName,
                    }}
                    onUpdate={(updates) => setState((s) => ({ ...s, ...updates }))}
                    onBack={retreat}
                    onContinue={advance}
                />
            </QuizWrapper>
        );
    }

    // ── Step 5: Interstitial 1 ────────────────────────────────────────────────
    if (step === 5) {
        return (
            <QuizWrapper>
                <OnboardingInterstitial
                    currentStep={5}
                    totalSteps={TOTAL_STEPS}
                    headline="LiquidRead doesn't just pick a paper. It changes how the paper opens for you."
                    body="Some people want context first. Others want the finding, the source, or the bigger picture. I'm learning which version will feel natural to you."
                    ariLine="A few more steps and I can shape the first read properly."
                    onBack={retreat}
                    onContinue={advance}
                />
            </QuizWrapper>
        );
    }

    // ── Steps 6–9 and 11–15: Questions ───────────────────────────────────────
    const qIndex = STEP_TO_Q_INDEX[step];
    if (qIndex !== undefined) {
        const currentQuestion = questions[qIndex];
        const meta = QUESTION_STEP_META[step];
        const currentAnswer = state.answers[currentQuestion.id];
        const isTextQ = currentQuestion.type === "text";

        const canContinue = isTextQ
            ? state.field.trim().length > 0
            : !!currentAnswer;

        const ariResponse: string | null = isTextQ
            ? (state.field.trim().length > 0
                ? "Perfect. Specific curiosity usually leads to better first picks."
                : null)
            : (currentAnswer
                ? (ARI_RESPONSES[currentQuestion.id]?.[currentAnswer.optionId] ?? null)
                : null);

        function handleOptionSelect(optionId: string, label: string, points: number) {
            setState((s) => ({
                ...s,
                answers: {
                    ...s.answers,
                    [currentQuestion.id]: { optionId, label, points },
                },
            }));
        }

        function handleTextChange(value: string) {
            setState((s) => ({ ...s, field: value }));
        }

        return (
            <QuizWrapper>
                <div key={step} className="flex flex-col gap-0 fade-in">
                    {/* Back + Progress */}
                    <div className="mb-6">
                        <button
                            onClick={retreat}
                            className="text-[#9C8B78] text-sm hover:text-[#6B5C4A] transition-colors flex items-center gap-1 mb-4"
                        >
                            ← Back
                        </button>
                        <ProgressBar current={step} total={TOTAL_STEPS} />
                    </div>

                    {/* Question */}
                    <QuestionCard
                        question={currentQuestion}
                        selectedOptionId={currentAnswer?.optionId ?? null}
                        fieldValue={state.field}
                        stepLabel={meta.stepLabel}
                        displayText={meta.displayText}
                        helperLine={meta.helperLine}
                        ariResponse={ariResponse}
                        onOptionSelect={handleOptionSelect}
                        onTextChange={handleTextChange}
                    />

                    {/* Continue — always visible, disabled until valid */}
                    <div className="border-t border-[#E8E0D5] pt-6">
                        <button
                            onClick={advance}
                            disabled={!canContinue}
                            className={`w-full sm:w-auto rounded-xl px-8 py-3 text-sm font-medium transition-colors
                                ${canContinue
                                    ? "bg-[#7C5C3E] hover:bg-[#6A4E34] active:bg-[#5A4028] text-white cursor-pointer"
                                    : "bg-[#EDE5D8] text-[#9C8B78] cursor-not-allowed"
                                }`}
                        >
                            {isTextQ && !canContinue ? "Add a topic to continue." : "Continue"}
                        </button>
                    </div>
                </div>
            </QuizWrapper>
        );
    }

    // ── Step 10: Interstitial 2 ───────────────────────────────────────────────
    if (step === 10) {
        return (
            <QuizWrapper>
                <OnboardingInterstitial
                    currentStep={10}
                    totalSteps={TOTAL_STEPS}
                    headline="The same paper can feel totally different depending on how it's introduced."
                    body="That's what we're tuning here: what gets explained first, what gets emphasized, and how much complexity feels useful instead of exhausting."
                    ariLine="Now let's get a little more specific."
                    onBack={retreat}
                    onContinue={advance}
                />
            </QuizWrapper>
        );
    }

    // ── Step 16: Final transition ─────────────────────────────────────────────
    if (step === 16) {
        return (
            <QuizWrapper>
                <div className="flex flex-col fade-in">
                    {/* Back button — no progress bar */}
                    <button
                        onClick={retreat}
                        className="text-[#9C8B78] text-sm hover:text-[#6B5C4A] transition-colors flex items-center gap-1 mb-10"
                    >
                        ← Back
                    </button>

                    <div className="py-4">
                        <h2 className="text-2xl font-semibold text-[#2C2218] leading-snug mb-4">
                            Got it. I'm shaping your first read.
                        </h2>
                        <p className="text-sm text-[#6B5C4A] leading-relaxed mb-8">
                            I'm using your answers to tune what shows up first, what gets explained,
                            and how much depth feels useful.
                        </p>

                        {/* Ari line */}
                        <div className="flex items-start gap-2.5">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#EDE5D8] flex items-center justify-center">
                                <span className="text-[#7C5C3E] text-[9px] font-bold leading-none">A</span>
                            </span>
                            <p className="text-[#6B5C4A] text-sm italic">
                                This should only take a moment.
                            </p>
                        </div>
                    </div>

                    {/* CTA — triggers scoring */}
                    <div className="mt-10 flex justify-end border-t border-[#E8E0D5] pt-6">
                        <button
                            id="prepare-first-read-btn"
                            onClick={goToScoring}
                            className="bg-[#7C5C3E] hover:bg-[#6A4E34] active:bg-[#5A4028] text-white rounded-xl px-8 py-3.5 text-sm font-medium transition-colors"
                        >
                            Prepare my first read
                        </button>
                    </div>
                </div>
            </QuizWrapper>
        );
    }

    return null;
}
