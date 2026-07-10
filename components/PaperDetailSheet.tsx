"use client";

import { useState, useEffect, useCallback } from "react";

interface PaperDetailSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    abstract: string;
    journal: string;
    year: number;
    citationCount: number;
    doi: string;
    /** Called when user taps "Personalise this paper" — parent handles the Gemini call */
    onPersonalise?: (paper: { title: string; abstract: string; journal: string; doi: string }) => void;
}

const MAX_PERSONALISE_USES = 2;
const STORAGE_KEY = "lr-personalise-uses";

function getPersonaliseUses(): number {
    if (typeof window === "undefined") return 0;
    return parseInt(sessionStorage.getItem(STORAGE_KEY) ?? "0", 10);
}

function incrementPersonaliseUses(): number {
    const current = getPersonaliseUses() + 1;
    sessionStorage.setItem(STORAGE_KEY, String(current));
    return current;
}

export default function PaperDetailSheet({
    isOpen,
    onClose,
    title,
    abstract,
    journal,
    year,
    citationCount,
    doi,
    onPersonalise,
}: PaperDetailSheetProps) {
    const [usesLeft, setUsesLeft] = useState(MAX_PERSONALISE_USES);
    const [doiCopied, setDoiCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setUsesLeft(MAX_PERSONALISE_USES - getPersonaliseUses());
            setDoiCopied(false);
        }
    }, [isOpen]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const handlePersonalise = useCallback(() => {
        if (usesLeft <= 0 || !onPersonalise) return;
        incrementPersonaliseUses();
        setUsesLeft((prev) => prev - 1);
        onPersonalise({ title, abstract, journal, doi });
    }, [usesLeft, onPersonalise, title, abstract, journal, doi]);

    const handleCopyDoi = useCallback(async () => {
        if (!doi) return;
        try {
            await navigator.clipboard.writeText(doi);
            setDoiCopied(true);
            setTimeout(() => setDoiCopied(false), 2000);
        } catch {
            // Fallback: select text
        }
    }, [doi]);

    const formatCitations = (count: number): string => {
        if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
        return String(count);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="detail-sheet-backdrop" onClick={onClose} />

            {/* Sheet */}
            <div className="detail-sheet">
                {/* Drag handle */}
                <div className="detail-sheet-handle">
                    <div className="detail-sheet-handle-bar" />
                </div>

                {/* Close button */}
                <button
                    className="detail-sheet-close"
                    onClick={onClose}
                    aria-label="Close detail sheet"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Content */}
                <div className="detail-sheet-content">
                    {/* Meta row */}
                    <div className="detail-sheet-meta">
                        <span className="detail-sheet-journal">{journal}</span>
                        <span className="detail-sheet-year">{year}</span>
                        {citationCount > 0 && (
                            <span className="detail-sheet-citations">
                                {formatCitations(citationCount)} citations
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h2 className="detail-sheet-title">{title}</h2>

                    {/* Abstract */}
                    <div className="detail-sheet-abstract">
                        <h3 className="detail-sheet-abstract-label">Abstract</h3>
                        <p className="detail-sheet-abstract-text">{abstract}</p>
                    </div>

                    {/* DOI */}
                    {doi && (
                        <div className="detail-sheet-doi-row">
                            <a
                                href={doi}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="detail-sheet-doi-link"
                            >
                                View original paper ↗
                            </a>
                            <button
                                className="detail-sheet-doi-copy"
                                onClick={handleCopyDoi}
                                aria-label="Copy DOI"
                                title="Copy DOI link"
                            >
                                {doiCopied ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Personalise CTA */}
                    {onPersonalise && (
                        <div className="detail-sheet-personalise-section">
                            <button
                                className={`detail-sheet-personalise-btn ${usesLeft <= 0 ? "detail-sheet-personalise-btn--disabled" : ""}`}
                                onClick={handlePersonalise}
                                disabled={usesLeft <= 0}
                            >
                                <span className="detail-sheet-personalise-icon">✨</span>
                                {usesLeft > 0
                                    ? "See this paper personalised for you"
                                    : "Personalisation limit reached"
                                }
                            </button>
                            {usesLeft > 0 && usesLeft < MAX_PERSONALISE_USES && (
                                <p className="detail-sheet-personalise-remaining">
                                    {usesLeft} personalisation{usesLeft !== 1 ? "s" : ""} remaining this session
                                </p>
                            )}
                            {usesLeft <= 0 && (
                                <p className="detail-sheet-personalise-remaining">
                                    Switch to the &quot;For You&quot; tab to see epistemically personalised papers
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
