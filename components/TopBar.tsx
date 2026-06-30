"use client";

interface TopBarProps {
    onMenuOpen: () => void;
}

export default function TopBar({ onMenuOpen }: TopBarProps) {
    return (
        <header className="topbar">
            <button
                onClick={onMenuOpen}
                className="topbar-icon-btn"
                aria-label="Open menu"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
                </svg>
            </button>

            <span className="topbar-brand">LiquidRead</span>

            <button
                className="topbar-icon-btn topbar-profile"
                aria-label="Profile"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
            </button>
        </header>
    );
}
