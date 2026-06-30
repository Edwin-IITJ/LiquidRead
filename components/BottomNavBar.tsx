"use client";

interface BottomNavBarProps {
    activeTab?: "home" | "bookmarks" | "favorites";
}

export default function BottomNavBar({ activeTab = "home" }: BottomNavBarProps) {
    return (
        <nav className="bottom-nav">
            <button
                className={`bottom-nav-item ${activeTab === "home" ? "active" : ""}`}
                aria-label="Home"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === "home" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                    {activeTab === "home" && <path d="M9 21V12h6v9" fill="var(--feed-bg)" stroke="var(--feed-bg)" />}
                </svg>
            </button>
            <button
                className={`bottom-nav-item ${activeTab === "bookmarks" ? "active" : ""}`}
                aria-label="Bookmarks"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
            </button>
            <button
                className={`bottom-nav-item ${activeTab === "favorites" ? "active" : ""}`}
                aria-label="Favorites"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
            </button>
        </nav>
    );
}
