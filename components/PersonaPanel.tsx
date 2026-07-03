"use client";

import { useState, useEffect, useCallback } from "react";
import { CardType } from "@/types/quiz";

interface PersonaPanelProps {
    isOpen: boolean;
    onClose: () => void;
    cardType: CardType;
    field: string;
    readingGoal?: string;
    timeAvailable?: string;
    confusionResponse?: string;
    normalisedScore?: number;
}

function generatePersonaText(profile: Omit<PersonaPanelProps, "isOpen" | "onClose">): string {
    const depth =
        (profile.normalisedScore ?? 0) >= 6.5
            ? "technical depth"
            : (profile.normalisedScore ?? 0) >= 3.75
            ? "balanced detail"
            : "accessible overviews";

    const cleanedGoal = (profile.readingGoal ?? "staying current")
        .replace(/\bin my\b/gi, "in their")
        .replace(/\bI'm\b/gi, "they're")
        .replace(/\bI\b/g, "they")
        .replace(/\bmy\b/gi, "their")
        .toLowerCase();

    const cleanedconfusion = (profile.confusionResponse ?? "re-read until it clicks")
        .replace(/\bin my\b/gi, "in their")
        .replace(/\bI'm\b/gi, "they're")
        .replace(/\bI\b/g, "they")
        .replace(/\bmy\b/gi, "their")
        .toLowerCase();

    const fieldFirstChar = profile.field.charAt(0).toLowerCase();
    const article = ['a', 'e', 'i', 'o', 'u'].includes(fieldFirstChar) ? 'an' : 'a';

    return `You appear to be ${article} ${profile.field} researcher or professional who reads research for ${cleanedGoal}. You prefer ${profile.timeAvailable?.toLowerCase() ?? "moderate"} reading sessions and gravitate towards ${depth}. When something's unclear, you tend to ${cleanedconfusion}.`;
}

const DEPTH_LEVELS: { label: string; card: CardType; description: string }[] = [
    { label: "Simple", card: "A", description: "Easy-to-follow summaries" },
    { label: "Balanced", card: "B", description: "Detail with context" },
    { label: "Technical", card: "C", description: "Full academic depth" },
];

export default function PersonaPanel({
    isOpen,
    onClose,
    cardType,
    field,
    readingGoal,
    timeAvailable,
    confusionResponse,
    normalisedScore,
}: PersonaPanelProps) {
    const basePersona = generatePersonaText({ cardType, field, readingGoal, timeAvailable, confusionResponse, normalisedScore });

    const [personaDraft, setPersonaDraft] = useState(basePersona);
    const [userContext, setUserContext] = useState("");

    useEffect(() => {
        const savedPersona = typeof window !== "undefined" ? localStorage.getItem("mtp-persona-override") : null;
        const savedContext = typeof window !== "undefined" ? localStorage.getItem("mtp-user-context") : null;
        if (savedPersona) {
            setPersonaDraft(savedPersona);
        }
        if (savedContext) setUserContext(savedContext);
    }, []);

    const handlePersonaChange = useCallback((val: string) => {
        const trimmed = val.slice(0, 200);
        setPersonaDraft(trimmed);
        if (typeof window !== "undefined") localStorage.setItem("mtp-persona-override", trimmed);
    }, []);

    const handleContextChange = useCallback((val: string) => {
        const trimmed = val.slice(0, 200);
        setUserContext(trimmed);
        if (typeof window !== "undefined") localStorage.setItem("mtp-user-context", trimmed);
    }, []);

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`persona-backdrop ${isOpen ? "persona-backdrop--visible" : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer panel */}
            <aside
                className={`persona-drawer ${isOpen ? "persona-drawer--open" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label="Personalisation Menu"
            >
                {/* Header */}
                <div className="persona-header">
                    <h2 className="persona-title">Personalisation Menu</h2>
                    <button
                        onClick={onClose}
                        className="persona-close-btn"
                        aria-label="Close menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="persona-content">
                    {/* User Persona */}
                    <section className="persona-section">
                        <div className="persona-section-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <h3 className="persona-section-label">User Persona</h3>
                        </div>
                        <div className="persona-textarea-wrapper">
                            <textarea
                                value={personaDraft}
                                onChange={(e) => handlePersonaChange(e.target.value)}
                                placeholder="Focus on macro-economic trends in Southeast Asia..."
                                maxLength={200}
                                rows={4}
                                className="persona-textarea"
                            />
                            <span className="persona-char-count">
                                {personaDraft.length}/200
                            </span>
                        </div>
                    </section>

                    {/* Add more context */}
                    <section className="persona-section">
                        <div className="persona-section-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            <h3 className="persona-section-label">Add more context</h3>
                        </div>
                        <div className="persona-textarea-wrapper">
                            <textarea
                                value={userContext}
                                onChange={(e) => handleContextChange(e.target.value)}
                                placeholder="Focus on macro-economic trends in Southeast Asia..."
                                maxLength={200}
                                rows={4}
                                className="persona-textarea"
                            />
                            <span className="persona-char-count">
                                {userContext.length}/200
                            </span>
                        </div>
                    </section>

                    {/* Reading Depth */}
                    <section className="persona-section">
                        <div className="persona-section-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20V10M18 20V4M6 20v-4" />
                            </svg>
                            <h3 className="persona-section-label">Reading Depth</h3>
                        </div>
                        <div className="persona-depth-list">
                            {DEPTH_LEVELS.map(({ label, card }) => {
                                const isActive = card === cardType;
                                return (
                                    <label
                                        key={card}
                                        className={`persona-depth-item ${isActive ? "persona-depth-item--active" : ""}`}
                                    >
                                        <span className="persona-depth-label">{label}</span>
                                        <span className={`persona-depth-radio ${isActive ? "persona-depth-radio--checked" : ""}`}>
                                            {isActive && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                                </svg>
                                            )}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </aside>
        </>
    );
}
