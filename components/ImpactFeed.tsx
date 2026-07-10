"use client";

import { useState, useEffect, useRef } from "react";
import FeedPaperCard from "./FeedPaperCard";
import PaperDetailSheet from "./PaperDetailSheet";

interface Paper {
    title: string;
    abstract: string;
    year: number;
    citationCount: number;
    doi: string;
    journal: string;
    openAccessUrl: string;
}

interface ImpactFeedProps {
    fieldGroup: string;
    /** Called when user taps "Personalise this paper" in the detail sheet */
    onPersonalisePaper?: (paper: { title: string; abstract: string; journal: string; doi: string }) => void;
}

function formatCitations(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return String(count);
}

export default function ImpactFeed({ fieldGroup, onPersonalisePaper }: ImpactFeedProps) {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        async function fetchPapers() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/fetch-papers?fieldGroup=${encodeURIComponent(fieldGroup)}&perPage=8`
                );
                if (!res.ok) {
                    setError("Could not load papers. Try again later.");
                    return;
                }
                const data: Paper[] = await res.json();
                setPapers(data);
            } catch {
                setError("Could not load papers. Check your connection.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchPapers();
    }, [fieldGroup]);

    // Card gradient palette for Impact tab — muted, slate-toned
    const gradients = [
        { from: "#1e293b", to: "#334155" },
        { from: "#1a2332", to: "#2d3748" },
        { from: "#1c2a3a", to: "#374151" },
        { from: "#1e2a3f", to: "#364152" },
        { from: "#1a2638", to: "#2e3d4f" },
        { from: "#1d2b3d", to: "#354354" },
        { from: "#1b2736", to: "#303f4d" },
        { from: "#1f2d41", to: "#384656" },
    ];

    return (
        <>
            <div className="feed-cards-container">
                {/* Section header */}
                <div className="feed-tab-header">
                    <span className="feed-tab-header-icon">📊</span>
                    <span className="feed-tab-header-text">
                        Highest impact in {fieldGroup}
                    </span>
                </div>

                {isLoading && (
                    <>
                        {[1, 2, 3].map((i) => (
                            <FeedPaperCard
                                key={`skeleton-${i}`}
                                id={`skeleton-${i}`}
                                title=""
                                description={null}
                                source=""
                                sourceColor="#64748b"
                                date=""
                                readTime=""
                                gradientFrom="#1e293b"
                                gradientTo="#334155"
                                isLoading={true}
                            />
                        ))}
                    </>
                )}

                {error && (
                    <div className="feed-error">
                        <p>{error}</p>
                    </div>
                )}

                {!isLoading && !error && papers.map((paper, index) => {
                    const gradient = gradients[index % gradients.length];
                    const truncatedAbstract = paper.abstract.length > 160
                        ? paper.abstract.slice(0, 160).trimEnd() + "…"
                        : paper.abstract;

                    return (
                        <FeedPaperCard
                            key={paper.doi || `impact-${index}`}
                            id={`impact-${index}`}
                            title={paper.title}
                            description={truncatedAbstract || null}
                            source={paper.journal.toUpperCase()}
                            sourceColor="#64748b"
                            date={String(paper.year)}
                            readTime={`${formatCitations(paper.citationCount)} cited`}
                            gradientFrom={gradient.from}
                            gradientTo={gradient.to}
                            patternOpacity={0.1}
                            isPlaceholder={false}
                            heroStat={formatCitations(paper.citationCount)}
                            heroStatLabel="citations"
                            onTap={() => setSelectedPaper(paper)}
                        />
                    );
                })}

                {!isLoading && !error && papers.length === 0 && (
                    <div className="feed-empty">
                        <p>No high-impact papers found for {fieldGroup}.</p>
                    </div>
                )}
            </div>

            {/* Detail sheet */}
            <PaperDetailSheet
                isOpen={!!selectedPaper}
                onClose={() => setSelectedPaper(null)}
                title={selectedPaper?.title ?? ""}
                abstract={selectedPaper?.abstract ?? ""}
                journal={selectedPaper?.journal ?? ""}
                year={selectedPaper?.year ?? 0}
                citationCount={selectedPaper?.citationCount ?? 0}
                doi={selectedPaper?.doi ?? ""}
                onPersonalise={onPersonalisePaper}
            />
        </>
    );
}
