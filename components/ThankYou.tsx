"use client";
import Image from "next/image";

export default function ThankYou() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center fade-in">
            <div className="text-center max-w-sm">
                <div className="flex justify-center mb-6">
                    <Image src="/logo-mark.png" alt="LiquidRead Mark" width={48} height={48} />
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
