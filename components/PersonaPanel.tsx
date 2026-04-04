"use client";

import { useState, useEffect, useCallback } from "react";
import { CardType } from "@/types/quiz";

interface PersonaPanelProps {
    cardType: CardType;
    field: string;
    readingGoal?: string;
    timeAvailable?: string;
    confusionResponse?: string;
    normalisedScore?: number;
}

function generatePersonaText(profile: PersonaPanelProps): string {
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

const DEPTH_LEVELS: { label: string; card: CardType }[] = [
    { label: "Accessible", card: "A" },
    { label: "Balanced", card: "B" },
    { label: "Technical", card: "C" },
];

export default function PersonaPanel({ cardType, field, readingGoal, timeAvailable, confusionResponse, normalisedScore }: PersonaPanelProps) {
    const basePersona = generatePersonaText({ cardType, field, readingGoal, timeAvailable, confusionResponse, normalisedScore });

    const [personaText, setPersonaText] = useState(basePersona);
    const [isEditingPersona, setIsEditingPersona] = useState(false);
    const [personaDraft, setPersonaDraft] = useState(basePersona);
    const [userContext, setUserContext] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    useEffect(() => {
        const savedPersona = typeof window !== "undefined" ? localStorage.getItem("mtp-persona-override") : null;
        const savedContext = typeof window !== "undefined" ? localStorage.getItem("mtp-user-context") : null;
        if (savedPersona) {
            setPersonaText(savedPersona);
            setPersonaDraft(savedPersona);
        }
        if (savedContext) setUserContext(savedContext);
    }, []);

    const contextCharLimit = Math.max(0, 300 - personaText.length);

    const handlePersonaSave = useCallback(() => {
        const trimmed = personaDraft.slice(0, 200);
        setPersonaText(trimmed);
        setPersonaDraft(trimmed);
        setIsEditingPersona(false);
        if (typeof window !== "undefined") localStorage.setItem("mtp-persona-override", trimmed);
    }, [personaDraft]);

    const handleContextChange = useCallback((val: string) => {
        const trimmed = val.slice(0, contextCharLimit + userContext.length);
        setUserContext(trimmed);
        if (typeof window !== "undefined") localStorage.setItem("mtp-user-context", trimmed);
    }, [contextCharLimit, userContext.length]);

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-4 left-4 z-30 bg-white border border-slate-200 rounded-lg p-2 shadow-sm text-slate-500 hover:text-slate-800 transition-colors"
                aria-label="Open persona panel"
            >
                ☰
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed top-[56px] left-0 h-[calc(100vh-56px)] bg-white border-r border-slate-200 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-50 transition-all duration-300 flex flex-col ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 md:static md:h-full md:shadow-none shrink-0 ${
                    isCollapsed ? "w-[64px]" : "w-[320px]"
                }`}
            >
                {/* Header with toggle */}
                <div className={`flex items-center p-4 shrink-0 transition-all ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:flex text-slate-400 hover:text-slate-600 p-1"
                        aria-label="Toggle sidebar"
                        title="Toggle Sidebar"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                        </svg>
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="md:hidden text-slate-400 hover:text-slate-600 p-1"
                        aria-label="Close persona panel"
                    >
                        ✕
                    </button>
                </div>

                <div className={`flex-1 overflow-y-auto px-4 pb-6 scrollbar ${isCollapsed ? 'hidden md:opacity-0' : 'block md:opacity-100'} transition-opacity duration-300`}>
                    <div className="flex flex-col gap-6">

                        {/* ── Section A: How we see you ── */}
                        <section>
                            <h3 className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-3 px-1">How We See You</h3>
                            <div className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                                {!isEditingPersona ? (
                                    <>
                                        <p className="text-sm text-slate-600 leading-relaxed">{personaText}</p>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-xs text-indigo-600 italic">Editing this changes how your cards are personalised.</p>
                                        <textarea
                                            value={personaDraft}
                                            onChange={(e) => setPersonaDraft(e.target.value.slice(0, 200))}
                                            maxLength={200}
                                            rows={5}
                                            className="text-sm text-slate-700 border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
                                        />
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400">{personaDraft.length}/200</span>
                                            <button
                                                onClick={handlePersonaSave}
                                                className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ── Section B: Add more context ── */}
                        <section>
                            <h3 className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-3 px-1">Add More Context</h3>
                            <div className="bg-slate-50 rounded-xl border border-slate-200/70 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                                <textarea
                                    value={userContext}
                                    onChange={(e) => handleContextChange(e.target.value)}
                                    placeholder="Anything that helps — your current project, preferences, pet hates."
                                    className="w-full h-[100px] text-sm text-slate-700 border-none resize-none focus:outline-none p-3 bg-transparent placeholder:text-slate-400"
                                    disabled
                                />
                                <div className="px-3 pb-2 text-right">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {userContext.length}/{contextCharLimit + userContext.length} chars
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* ── Section C: Reading depth ── */}
                        <section>
                            <h3 className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-3 px-1">Reading Depth</h3>
                            <div className="flex bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60">
                                {DEPTH_LEVELS.map(({ label, card }) => {
                                    const isActive = card === cardType;
                                    return (
                                        <div 
                                            key={card} 
                                            className={`flex-1 text-center py-2.5 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-default ${
                                                isActive
                                                    ? "bg-indigo-600 text-white shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                            }`}
                                        >
                                            {label}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
