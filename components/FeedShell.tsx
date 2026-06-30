"use client";

import { useState } from "react";
import { CardType } from "@/types/quiz";
import TopBar from "./TopBar";
import BottomNavBar from "./BottomNavBar";
import PersonaPanel from "./PersonaPanel";
import CardDisplay from "./CardDisplay";

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
}: FeedShellProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("For You");

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
            <main className="feed-content">
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
                />
            </main>

            {/* ── Bottom Nav ── */}
            <BottomNavBar activeTab="home" />

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
