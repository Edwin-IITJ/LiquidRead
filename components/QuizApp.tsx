"use client";

import { useState, useEffect } from "react";
import { AppState, Answer, CardType, CalibrationResponse, QuizState } from "@/types/quiz";
import { questions } from "@/data/questions";
import { calculateScore } from "@/lib/scoring";
import { submitToSheet } from "@/lib/submitData";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import CardDisplay from "./CardDisplay";
import PersonaPanel from "./PersonaPanel";
import ReflectionScreen, { ReflectionAnswers } from "./ReflectionScreen";
import DemographicsScreen, { DemographicsAnswers } from "./DemographicsScreen";
import ThankYou from "./ThankYou";
import IntroScreen from "./IntroScreen";
 
const STORAGE_KEY = "mtp-survey-progress";

const initialState: QuizState = {
    appState: "intro",
    progressIndex: 0,
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
    alternateCardShown: null,
    alternateCardRating: "",
    paperTitle: "",
    generatedCardText: "",
};

// Helper to wrap non-card screens in the centered box styling
function QuizWrapper({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen flex items-start justify-center px-4 py-8 bg-[#F8F7F4]">
            <div className="w-full max-w-2xl bg-white border border-[#E8E4DD] rounded-2xl p-6 sm:p-10 shadow-none">
                {children}
            </div>
        </main>
    );
}

export default function QuizApp() {
    const [state, setState] = useState<QuizState>(initialState);

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (localStorage.getItem("mtp-survey-done") === "true") {
                setState((s) => ({ ...s, appState: "thankyou" }));
            } else {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        setState(parsed);
                    } catch (e) {
                        console.error("Failed to parse saved survey state", e);
                    }
                }
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && state.appState !== "thankyou" && state.appState !== "intro") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state]);

    const currentQuestion = questions[state.progressIndex];

    // ── Handlers ──────────────────────────────────────────────────────────────

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

    function handleNext() {
        // If not the last question, advance
        if (state.progressIndex < questions.length - 1) {
            setState((s) => ({
                ...s,
                progressIndex: s.progressIndex + 1,
            }));
        } else {
            // Last question done → go to scoring
            goToScoring();
        }
    }

    function handleBack() {
        if (state.progressIndex > 0) {
            setState((s) => ({
                ...s,
                progressIndex: s.progressIndex - 1,
            }));
        }
    }

    function goToScoring() {
        const { rawScore, normalisedScore, cardShown } = calculateScore(state.answers);
        setState((s) => ({
            ...s,
            appState: "scoring",
            rawScore,
            normalisedScore,
            cardShown,
        }));
        // Immediately transition to card display
        setTimeout(() => {
            setState((s) => ({ ...s, appState: "card" }));
        }, 0);
    }

    function handleCardProceed(response: CalibrationResponse, alternateShown: CardType | null, alternateRating: string, paperTitle: string, generatedCardText: string) {
        setState((s) => ({
            ...s,
            appState: "reflection",
            calibrationResponse: response,
            alternateCardShown: alternateShown,
            alternateCardRating: alternateRating,
            paperTitle,
            generatedCardText,
        }));
    }

    async function handleReflectionSubmit(answers: ReflectionAnswers) {
        // We capture the reflection answers, update state, and submit all data
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
            suitability: answers.suitability,
            openFeedback: answers.openFeedback,
            rawScore: state.rawScore,
            normalisedScore: state.normalisedScore,
            cardShown: state.cardShown,
            calibrationResponse: state.calibrationResponse ?? "",
            alternateCardShown: state.alternateCardShown ?? "",
            alternateCardRating: state.alternateCardRating,
            paperTitle: state.paperTitle,
            generatedCardText: state.generatedCardText,
        };

        setState(s => ({ ...s, suitability: answers.suitability, openFeedback: answers.openFeedback }));

        await submitToSheet(payload);
        if (typeof window !== "undefined") {
            localStorage.setItem("mtp-survey-done", "true");
            localStorage.removeItem(STORAGE_KEY);
        }
        setState((s) => ({ ...s, appState: "thankyou" }));
    }

    // ── Derived state ──────────────────────────────────────────────────────────

    const isQ8 = currentQuestion?.type === "text";
    const currentAnswer = currentQuestion ? state.answers[currentQuestion.id] : undefined;
    const canProceed =
        isQ8 ? state.field.trim().length > 0 : !!currentAnswer;

    // ── Render ─────────────────────────────────────────────────────────────────

    if (state.appState === "scoring") {
        // Invisible transition state
        return null;
    }

    if (state.appState === "card") {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-[#F8F7F4] text-slate-900 font-sans">
                {/* ── TOP BAR ── */}
                <header className="h-[56px] px-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                            <span className="text-white text-xs font-bold leading-none">Lr</span>
                        </div>
                        <span className="font-semibold text-lg tracking-tight">LiquidRead</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Settings">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-end justify-center">
                            <svg className="w-6 h-6 text-slate-400 mb-[-2px]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
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
                    <main className="flex-1 min-w-0 overflow-y-auto bg-[#F8F7F4] flex flex-col">
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

    if (state.appState === "thankyou") {
        return <QuizWrapper><ThankYou /></QuizWrapper>;
    }

    if (state.appState === "reflection") {
        return <QuizWrapper><ReflectionScreen onSubmit={handleReflectionSubmit} /></QuizWrapper>;
    }

    if (state.appState === "demographics") {
        return (
            <QuizWrapper>
                <DemographicsScreen
                    initialValues={{
                        fieldGroup: state.fieldGroup,
                        researchExperience: state.researchExperience,
                        readingFrequency: state.readingFrequency,
                        priorInterviewName: state.priorInterviewName,
                    }}
                    onUpdate={(updates) => setState((s) => ({ ...s, ...updates }))}
                    onSubmit={() => setState((s) => ({ ...s, appState: "questions" }))}
                />
            </QuizWrapper>
        );
    }

    if (state.appState === "intro") {
        return <QuizWrapper><IntroScreen onStart={() => setState(s => ({ ...s, appState: "demographics" }))} /></QuizWrapper>;
    }

    // Default: questions state
    return (
        <QuizWrapper>
            <div>
                <div className="h-6 mb-2">
                    {state.progressIndex > 0 && (
                        <button
                            onClick={handleBack}
                            className="text-slate-400 text-sm hover:text-slate-600 transition-colors flex items-center gap-1"
                        >
                            &larr; Back
                        </button>
                    )}
                </div>
                <ProgressBar current={state.progressIndex + 1} total={questions.length} />
                <p className="text-xs text-slate-400 italic mt-1 mb-4 fade-in font-serif">
                    Answer honestly, your responses shape what you see at the end.
                </p>
                <div className="mt-8 fade-in" key={state.progressIndex}>
                    <QuestionCard
                        question={currentQuestion}
                        selectedOptionId={currentAnswer?.optionId ?? null}
                        fieldValue={state.field}
                        onOptionSelect={handleOptionSelect}
                        onTextChange={handleTextChange}
                    />
                </div>
                {canProceed && (
                    <div className="mt-6 flex justify-end fade-in">
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
                        >
                            {state.progressIndex === questions.length - 1 ? "Finish" : "Next"}
                        </button>
                    </div>
                )}
            </div>
        </QuizWrapper>
    );
}
