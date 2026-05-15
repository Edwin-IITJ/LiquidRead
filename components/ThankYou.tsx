"use client";

export default function ThankYou() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center fade-in">
            <div className="text-center max-w-sm">
                <div className="w-12 h-12 rounded-full bg-[#EDE5D8] flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-6 h-6 text-[#7C5C3E]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-semibold text-[#2C2218] mb-3">
                    Thank you.
                </h1>
                <p className="text-[#6B5C4A] leading-relaxed">
                    This helps build something genuinely useful.
                </p>
            </div>
        </div>
    );
}
