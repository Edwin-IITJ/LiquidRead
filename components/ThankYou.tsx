"use client";

export default function ThankYou() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center fade-in">
            <div className="text-center max-w-sm">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-6 h-6 text-indigo-600"
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
                <h1 className="text-2xl font-semibold text-slate-900 mb-3">
                    Thank you.
                </h1>
                <p className="text-slate-500 leading-relaxed">
                    This helps build something genuinely useful.
                </p>
            </div>
        </div>
    );
}
