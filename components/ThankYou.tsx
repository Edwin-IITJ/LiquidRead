"use client";
import Image from "next/image";

interface ThankYouProps {
    paperCount?: number;
    onExploreMore?: () => void;
    onChangeTopic?: () => void;
}

export default function ThankYou({ paperCount = 1, onExploreMore, onChangeTopic }: ThankYouProps) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center fade-in">
            <div className="text-center max-w-sm">
                <div className="flex justify-center mb-6">
                    <Image src="/logo-full.png" alt="LiquidRead" width={48} height={48} className="intro-logo-mark" />
                </div>

                {/* Animated check */}
                <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E8F5E9] text-[#4CAF50] text-2xl thankyou-check">
                        ✓
                    </span>
                </div>

                <h1 className="text-2xl font-semibold text-[#2C2218] mb-3">
                    Thank you.
                </h1>
                <p className="text-[#6B5C4A] leading-relaxed mb-2">
                    This helps build something genuinely useful.
                </p>
                <p className="text-[#9C8B78] text-sm mb-8">
                    {paperCount === 1
                        ? "1 paper explored"
                        : `${paperCount} papers explored`}
                </p>

                {/* Primary CTA — Explore More */}
                {onExploreMore && (
                    <button
                        onClick={onExploreMore}
                        className="w-full rounded-xl px-8 py-3.5 text-sm font-medium transition-colors bg-[#7C5C3E] hover:bg-[#6A4E34] active:bg-[#5A4028] text-white mb-3"
                    >
                        Explore another paper →
                    </button>
                )}

                {/* Secondary — Change Topic */}
                {onChangeTopic && (
                    <button
                        onClick={onChangeTopic}
                        className="text-[#7C5C3E] text-sm font-medium hover:text-[#5A4028] transition-colors underline underline-offset-2"
                    >
                        Change topic
                    </button>
                )}
            </div>
        </div>
    );
}
