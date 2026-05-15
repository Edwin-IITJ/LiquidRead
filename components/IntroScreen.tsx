export default function IntroScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="flex flex-col fade-in">
            <div className="max-w-[520px] w-full">
                {/* Eyebrow */}
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-500 mb-5">
                    Meet LiquidRead
                </p>

                {/* Headline */}
                <h1 className="text-3xl font-semibold text-slate-900 leading-tight mb-4">
                    Research, shaped to how&nbsp;you&nbsp;read.
                </h1>

                {/* Subheadline */}
                <p className="text-base text-slate-500 leading-relaxed mb-8">
                    Answer a few quick questions and I'll tune the first paper to your pace,
                    priorities, and curiosity.
                </p>

                {/* Ari line */}
                <div className="flex items-start gap-2.5 mb-10">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 text-[10px] font-bold leading-none">A</span>
                    </span>
                    <p className="text-sm text-slate-500 italic">
                        Hi, I'm Ari. I'll help set things up.
                    </p>
                </div>

                {/* CTA */}
                <button
                    id="onboarding-start-btn"
                    onClick={onStart}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl px-8 py-3.5 text-sm font-medium transition-colors"
                >
                    Start onboarding
                </button>

                {/* Helper */}
                <p className="text-xs text-slate-400 mt-4">
                    Takes about 3 minutes. You can change answers anytime.
                </p>
            </div>
        </div>
    );
}
