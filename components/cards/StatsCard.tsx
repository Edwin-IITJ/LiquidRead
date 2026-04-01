interface CardLayer {
    label: string;
    headline: string | null;
    body: string;
}

interface CardData {
    maxLayer: number;
    layers: CardLayer[];
}

interface VisualHints {
    keyStat: string | null;
    keyStatLabel: string | null;
    comparisonLeft: string | null;
    comparisonRight: string | null;
}

interface StatsCardProps {
    layer: number;
    card: CardData;
    visualHints: VisualHints;
}

export default function StatsCard({ layer, card, visualHints }: StatsCardProps) {
    const currentLayer = card.layers[layer];
    if (!currentLayer) return null;

    const showStatBlock = layer === 1 && visualHints?.keyStat;

    return (
        <div className="flex flex-col gap-3">
            {currentLayer.headline && (
                <h3 className="text-base font-semibold text-slate-800 leading-snug">
                    {currentLayer.headline}
                </h3>
            )}

            {showStatBlock && (
                <div className="flex flex-col gap-1 py-3">
                    <span className="text-5xl font-black text-slate-900 leading-none">
                        {visualHints.keyStat}
                    </span>
                    {visualHints.keyStatLabel && (
                        <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                            {visualHints.keyStatLabel}
                        </span>
                    )}
                    <div className="border-b border-slate-200 mt-3" />
                </div>
            )}

            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {currentLayer.body}
            </p>
        </div>
    );
}