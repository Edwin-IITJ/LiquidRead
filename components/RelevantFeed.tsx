"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

interface RelevantFeedProps {
    fieldGroup: string;
    /** Pre-filled from onboarding step 15 — user's free-text research interest */
    initialSearch: string;
    /** Called when user taps "Personalise this paper" in the detail sheet */
    onPersonalisePaper?: (paper: { title: string; abstract: string; journal: string; doi: string }) => void;
}

export default function RelevantFeed({ fieldGroup, initialSearch, onPersonalisePaper }: RelevantFeedProps) {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [searchValue, setSearchValue] = useState(initialSearch);
    const [activeSearch, setActiveSearch] = useState("");
    const hasFetchedRef = useRef(false);

    const fetchPapers = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setActiveSearch(query.trim());
        try {
            const res = await fetch(
                `/api/fetch-papers?fieldGroup=${encodeURIComponent(fieldGroup)}&search=${encodeURIComponent(query.trim())}&perPage=8`
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
    }, [fieldGroup]);

    // Auto-fetch on mount with the initial search term
    useEffect(() => {
        if (hasFetchedRef.current) return;
        if (!initialSearch.trim()) return;
        hasFetchedRef.current = true;
        fetchPapers(initialSearch);
    }, [initialSearch, fetchPapers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchValue.trim()) {
            fetchPapers(searchValue);
        }
    };

    // Card gradient palette for Relevant tab — warm stone tones
    const gradients = [
        { from: "#292524", to: "#44403c" },
        { from: "#27241f", to: "#3f3b36" },
        { from: "#2b2622", to: "#47423c" },
        { from: "#2a2520", to: "#443f38" },
        { from: "#282320", to: "#413c37" },
        { from: "#2c2723", to: "#48433d" },
        { from: "#26211e", to: "#3e3934" },
        { from: "#2d2824", to: "#49443e" },
    ];

    return (
        <>
            <div className="feed-cards-container">
                {/* Search bar */}
                <form className="relevant-search-form" onSubmit={handleSearch}>
                    <div className="relevant-search-wrapper">
                        <svg className="relevant-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            className="relevant-search-input"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search for a research topic..."
                            aria-label="Research topic search"
                        />
                        {searchValue !== initialSearch && searchValue.trim() && (
                            <button
                                type="submit"
                                className="relevant-search-submit"
                                aria-label="Search"
                            >
                                Search
                            </button>
                        )}
                    </div>
                </form>

                {/* Active search label */}
                {activeSearch && !isLoading && (
                    <div className="feed-tab-header">
                        <span className="feed-tab-header-icon">🔍</span>
                        <span className="feed-tab-header-text">
                            Matching &ldquo;{activeSearch}&rdquo;
                        </span>
                    </div>
                )}

                {isLoading && (
                    <>
                        {[1, 2, 3].map((i) => (
                            <FeedPaperCard
                                key={`skeleton-${i}`}
                                id={`skeleton-${i}`}
                                title=""
                                description={null}
                                source=""
                                sourceColor="#78716c"
                                date=""
                                readTime=""
                                gradientFrom="#292524"
                                gradientTo="#44403c"
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
                            key={paper.doi || `relevant-${index}`}
                            id={`relevant-${index}`}
                            title={paper.title}
                            description={truncatedAbstract || null}
                            source={paper.journal.toUpperCase()}
                            sourceColor="#78716c"
                            date={String(paper.year)}
                            readTime={paper.citationCount > 0 ? `${paper.citationCount} cited` : "Recent"}
                            gradientFrom={gradient.from}
                            gradientTo={gradient.to}
                            patternOpacity={0.1}
                            isPlaceholder={false}
                            onTap={() => setSelectedPaper(paper)}
                        />
                    );
                })}

                {!isLoading && !error && papers.length === 0 && activeSearch && (
                    <div className="feed-empty">
                        <p>No papers found matching &ldquo;{activeSearch}&rdquo;. Try a different search term.</p>
                    </div>
                )}

                {!activeSearch && !isLoading && (
                    <div className="feed-empty">
                        <p>Enter a research topic to find relevant papers.</p>
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
