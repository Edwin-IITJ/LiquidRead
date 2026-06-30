"use client";

export interface FeedPaperCardProps {
    /** Unique identifier */
    id: string;
    /** Paper title (or "Research Paper Title" for placeholders) */
    title: string;
    /** Short description/hook */
    description: string | null;
    /** Source journal/publisher (e.g. "NATURE") */
    source: string;
    /** Color for the source badge */
    sourceColor: string;
    /** Date string */
    date: string;
    /** e.g. "12 min read" */
    readTime: string;
    /** Gradient colors for the card header area */
    gradientFrom: string;
    gradientTo: string;
    /** Pattern overlay opacity */
    patternOpacity?: number;
    /** Whether this card is loading */
    isLoading?: boolean;
    /** Whether this is a placeholder (non-interactive) card */
    isPlaceholder?: boolean;
    /** Called when user taps to read */
    onTap?: () => void;
}

function CardSkeleton() {
    return (
        <div className="feed-card">
            <div className="feed-card-image" style={{ background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)" }}>
                <div className="feed-card-skeleton-pulse" />
            </div>
            <div className="feed-card-body">
                <div className="feed-card-skeleton-line w-24" />
                <div className="feed-card-skeleton-line w-full mt-3" />
                <div className="feed-card-skeleton-line w-3/4 mt-1" />
                <div className="feed-card-skeleton-line w-full mt-3 h-3" />
                <div className="feed-card-skeleton-line w-5/6 mt-1 h-3" />
                <div className="feed-card-skeleton-line w-32 mt-4 h-3" />
            </div>
        </div>
    );
}

export default function FeedPaperCard({
    title,
    description,
    source,
    sourceColor,
    date,
    readTime,
    gradientFrom,
    gradientTo,
    patternOpacity = 0.15,
    isLoading = false,
    isPlaceholder = false,
    onTap,
}: FeedPaperCardProps) {
    if (isLoading) return <CardSkeleton />;

    return (
        <article
            className={`feed-card ${isPlaceholder ? "feed-card--placeholder" : "feed-card--active"}`}
            onClick={!isPlaceholder ? onTap : undefined}
            role={!isPlaceholder ? "button" : undefined}
            tabIndex={!isPlaceholder ? 0 : undefined}
            onKeyDown={!isPlaceholder ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTap?.();
                }
            } : undefined}
        >
            {/* Gradient image area */}
            <div
                className="feed-card-image"
                style={{
                    background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                }}
            >
                {/* Abstract pattern overlay */}
                <svg
                    className="feed-card-pattern"
                    style={{ opacity: patternOpacity }}
                    viewBox="0 0 400 200"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <defs>
                        <radialGradient id={`rg-${gradientFrom.replace('#','')}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    {/* Neural network / constellation pattern */}
                    <circle cx="80" cy="60" r="3" fill="rgba(255,255,255,0.6)" />
                    <circle cx="150" cy="40" r="2" fill="rgba(255,255,255,0.4)" />
                    <circle cx="220" cy="80" r="4" fill="rgba(255,255,255,0.5)" />
                    <circle cx="300" cy="50" r="2.5" fill="rgba(255,255,255,0.4)" />
                    <circle cx="120" cy="120" r="3" fill="rgba(255,255,255,0.3)" />
                    <circle cx="260" cy="140" r="3.5" fill="rgba(255,255,255,0.5)" />
                    <circle cx="340" cy="120" r="2" fill="rgba(255,255,255,0.3)" />
                    <circle cx="50" cy="150" r="2.5" fill="rgba(255,255,255,0.4)" />
                    <circle cx="180" cy="160" r="3" fill="rgba(255,255,255,0.3)" />
                    <line x1="80" y1="60" x2="150" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <line x1="150" y1="40" x2="220" y2="80" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <line x1="220" y1="80" x2="300" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1="80" y1="60" x2="120" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <line x1="220" y1="80" x2="260" y2="140" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <line x1="300" y1="50" x2="340" y2="120" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1="120" y1="120" x2="180" y2="160" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <line x1="260" y1="140" x2="340" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <line x1="50" y1="150" x2="120" y2="120" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <circle cx="80" cy="60" r="12" fill="url(#rg-${gradientFrom.replace('#','')})" />
                    <circle cx="220" cy="80" r="16" fill="url(#rg-${gradientFrom.replace('#','')})" />
                    <circle cx="260" cy="140" r="14" fill="url(#rg-${gradientFrom.replace('#','')})" />
                </svg>
            </div>

            {/* Card body */}
            <div className="feed-card-body">
                {/* Source + overflow menu */}
                <div className="feed-card-source-row">
                    <span
                        className="feed-card-source"
                        style={{ color: sourceColor }}
                    >
                        {source}
                    </span>
                    <button
                        className="feed-card-menu"
                        aria-label="More options"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                        </svg>
                    </button>
                </div>

                {/* Title */}
                <h3 className="feed-card-title">
                    {title}
                </h3>

                {/* Description */}
                {description && (
                    <p className="feed-card-description">
                        {description}
                    </p>
                )}

                {/* Footer: date + read time */}
                <p className="feed-card-footer">
                    {date} • {readTime}
                </p>
            </div>
        </article>
    );
}
