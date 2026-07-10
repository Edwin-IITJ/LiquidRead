"use client";

import { useState } from "react";

interface BottomNavBarProps {
    activeTab?: "home" | "profile" | "bookmarks";
    onHomeTap?: () => void;
    onProfileTap?: () => void;
}

export default function BottomNavBar({
    activeTab = "home",
    onHomeTap,
    onProfileTap,
}: BottomNavBarProps) {
    const [showComingSoon, setShowComingSoon] = useState(false);

    return (
        <nav className="bottom-nav">
            {/* Left: Profile / PersonaPanel */}
            <button
                className={`bottom-nav-item ${activeTab === "profile" ? "active" : ""}`}
                aria-label="Profile"
                onClick={onProfileTap}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            </button>

            {/* Center: Home */}
            <button
                className={`bottom-nav-item ${activeTab === "home" ? "active" : ""}`}
                aria-label="Home"
                onClick={onHomeTap}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === "home" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                    {activeTab === "home" && <path d="M9 21V12h6v9" fill="var(--feed-bg)" stroke="var(--feed-bg)" />}
                </svg>
            </button>

            {/* Right: Bookmark (disabled — coming soon) */}
            <div className="bottom-nav-item-wrapper">
                <button
                    className="bottom-nav-item bottom-nav-item--disabled"
                    aria-label="Bookmarks (coming soon)"
                    onClick={() => {
                        setShowComingSoon(true);
                        setTimeout(() => setShowComingSoon(false), 2000);
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                </button>
                {showComingSoon && (
                    <span className="bottom-nav-coming-soon">Coming soon</span>
                )}
            </div>
        </nav>
    );
}
