import Image from "next/image";

export default function IntroScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="flex flex-col fade-in">
            <div className="max-w-[520px] w-full">
                <div className="mb-6">
                    <Image src="/logo-mark.png" alt="LiquidRead Mark" width={64} height={64} />
                </div>

                {/* Headline */}
                <h1 className="text-3xl font-semibold text-[#2C2218] leading-tight mb-4">
                    Research, shaped to how&nbsp;you&nbsp;read.
                </h1>

                {/* Subheadline */}
                <p className="text-base text-[#6B5C4A] leading-relaxed mb-8">
                    Answer a few quick questions and I&apos;ll tune the first paper to your pace,
                    priorities, and curiosity.
                </p>

                {/* Ari line */}
                <div className="flex items-start gap-2.5 mb-10">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#EDE5D8] flex items-center justify-center">
                        <span className="text-[#7C5C3E] text-[10px] font-bold leading-none">A</span>
                    </span>
                    <p className="text-sm text-[#6B5C4A] italic">
                        Hi, I&apos;m Ari. I&apos;ll help set things up.
                    </p>
                </div>

                {/* CTA */}
                <button
                    id="onboarding-start-btn"
                    onClick={onStart}
                    className="w-full sm:w-auto bg-[#7C5C3E] hover:bg-[#6A4E34] active:bg-[#5A4028] text-white rounded-xl px-8 py-3.5 text-sm font-medium transition-colors"
                >
                    Start onboarding
                </button>

                {/* Helper */}
                <p className="text-xs text-[#9C8B78] mt-4">
                    Takes about 3 minutes. You can change answers anytime.
                </p>
            </div>
        </div>
    );
}
