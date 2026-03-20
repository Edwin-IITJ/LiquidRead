"use client";

import { useState, useEffect } from "react";
import { AppState, Answer, CardType, CalibrationResponse, QuizState } from "@/types/quiz";
import { questions } from "@/data/questions";
import { calculateScore } from "@/lib/scoring";
import { submitToSheet } from "@/lib/submitData";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import CardDisplay from "./CardDisplay";
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
};

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

    function handleCardProceed(response: CalibrationResponse, alternateShown: CardType | null, alternateRating: string) {
        setState((s) => ({
            ...s,
            appState: "reflection",
            calibrationResponse: response,
            alternateCardShown: alternateShown,
            alternateCardRating: alternateRating,
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
            <CardDisplay
                cardType={state.cardShown}
                fieldGroup={state.fieldGroup || "default"}
                onProceed={handleCardProceed}
            />
        );
    }

    if (state.appState === "thankyou") {
        return <ThankYou />;
    }

    if (state.appState === "reflection") {
        return <ReflectionScreen onSubmit={handleReflectionSubmit} />;
    }

    if (state.appState === "demographics") {
        return (
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
        );
    }

    if (state.appState === "intro") {
        return <IntroScreen onStart={() => setState(s => ({ ...s, appState: "demographics" }))} />;
    }

    // Default: questions state
    return (
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
    );
}
