"use client";

import { useState, useRef } from "react";
import { CardType } from "@/types/quiz";
import TopBar from "./TopBar";
import BottomNavBar from "./BottomNavBar";
import PersonaPanel from "./PersonaPanel";
import CardDisplay from "./CardDisplay";
import ImpactFeed from "./ImpactFeed";
import RelevantFeed from "./RelevantFeed";

interface FeedShellProps {
    cardType: CardType;
    fieldGroup: string;
    readingComfort?: string;
    readingGoal?: string;
    timeAvailable?: string;
    trustAnchor?: string;
    researchInterest?: string;
    confusionResponse?: string;
    normalisedScore?: number;
    onProceed: (
        suitability: number,
        calibration: "too_basic" | "just_right" | "too_advanced",
        openFeedback: string,
        paperTitle: string
    ) => void;
    excludeTitles?: string[];
}

const TABS = ["For You", "Impact", "Relevant"] as const;

export default function FeedShell({
    cardType,
    fieldGroup,
    readingComfort,
    readingGoal,
    timeAvailable,
    trustAnchor,
    researchInterest,
    confusionResponse,
    normalisedScore,
    onProceed,
    excludeTitles,
}: FeedShellProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("For You");
    const feedContentRef = useRef<HTMLElement>(null);

    const handleScrollToTop = () => {
        feedContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Handler for "Personalise this paper" from Impact/Relevant tabs
    // TODO: In a future iteration, this could switch to For You tab and trigger
    // a Gemini generation for the selected paper. For now, it switches tabs.
    const handlePersonalisePaper = () => {
        setActiveTab("For You");
    };

    return (
        <div className="feed-shell">
            {/* ── Top Bar ── */}
            <TopBar onMenuOpen={() => setDrawerOpen(true)} />

            {/* ── Tab Bar ── */}
            <div className="feed-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        className={`feed-tab ${activeTab === tab ? "feed-tab--active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── Feed Content ── */}
            <main className="feed-content" ref={feedContentRef}>
                {activeTab === "For You" && (
                    <>
                        <h2 className="feed-section-title">Top Papers</h2>
                        <CardDisplay
                            cardType={cardType}
                            fieldGroup={fieldGroup}
                            readingComfort={readingComfort}
                            readingGoal={readingGoal}
                            timeAvailable={timeAvailable}
                            trustAnchor={trustAnchor}
                            researchInterest={researchInterest}
                            confusionResponse={confusionResponse}
                            normalisedScore={normalisedScore}
                            onProceed={onProceed}
                            excludeTitles={excludeTitles}
                        />
                    </>
                )}

                {activeTab === "Impact" && (
                    <ImpactFeed
                        fieldGroup={fieldGroup}
                        onPersonalisePaper={handlePersonalisePaper}
                    />
                )}

                {activeTab === "Relevant" && (
                    <RelevantFeed
                        fieldGroup={fieldGroup}
                        initialSearch={researchInterest ?? ""}
                        onPersonalisePaper={handlePersonalisePaper}
                    />
                )}
            </main>

            {/* ── Bottom Nav ── */}
            <BottomNavBar
                activeTab="home"
                onHomeTap={handleScrollToTop}
                onProfileTap={() => setDrawerOpen(true)}
            />

            {/* ── PersonaPanel Drawer ── */}
            <PersonaPanel
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                cardType={cardType}
                field={fieldGroup || "default"}
                readingGoal={readingGoal}
                timeAvailable={timeAvailable}
                confusionResponse={confusionResponse}
                normalisedScore={normalisedScore}
            />
        </div>
    );
}
