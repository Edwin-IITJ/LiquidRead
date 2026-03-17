export default function IntroScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center fade-in">
            <div className="max-w-[560px] w-full">
                <div className="text-xs uppercase tracking-widest text-slate-400">
                    Master's Thesis Research &middot; School Of Design, IIT Jodhpur
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 mt-4 font-serif">
                    How should research papers be presented to you?
                </h1>
                <p className="text-base text-slate-600 mt-4 leading-relaxed max-w-prose">
                    Research is hard to access, not because the science is difficult, but because it's rarely written for the person reading it. This experiment explores whether that can change.
                </p>
                <hr className="border-t border-slate-100 mt-6 mb-6" />
                <div className="inline-flex gap-3 flex-wrap">
                    <span className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-slate-500">
                        ⏱ 5-6 minutes
                    </span>
                    <span className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-slate-500">
                        ~16 questions
                    </span>
                    <span className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-slate-500">
                        Anonymous
                    </span>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                    Your responses are anonymous and used only for academic research. No sign-in required.
                </p>
                <div className="mt-8 flex md:justify-end">
                    <button
                        onClick={onStart}
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 text-sm font-medium transition-colors"
                    >
                        See how your version looks &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
}
