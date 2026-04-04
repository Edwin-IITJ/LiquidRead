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

interface ComparisonCardProps {
    layer: number;
    card: CardData;
    visualHints: VisualHints;
}

export default function ComparisonCard({ layer, card, visualHints }: ComparisonCardProps) {
    const currentLayer = card.layers[layer];
    if (!currentLayer) return null;

    const showColumns =
        layer === 1 &&
        visualHints?.comparisonLeft &&
        visualHints?.comparisonRight;

    if (!showColumns) {
        return (
            <div className="flex flex-col gap-3">
                {currentLayer.headline && (
                    <h3 className="text-base font-semibold text-slate-800 leading-snug font-serif">
                        {currentLayer.headline}
                    </h3>
                )}
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-serif">
                    {currentLayer.body}
                </p>
            </div>
        );
    }

    const sentences = currentLayer.body.split(". ");
    const mid = Math.ceil(sentences.length / 2);
    const leftText = sentences.slice(0, mid).join(". ") + ".";
    const rightText = sentences.slice(mid).join(". ");

    return (
        <div className="flex flex-col gap-3">
            {currentLayer.headline && (
                <h3 className="text-base font-semibold text-slate-800 leading-snug font-serif">
                    {currentLayer.headline}
                </h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        {visualHints.comparisonLeft}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed font-serif">
                        {leftText}
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        {visualHints.comparisonRight}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed font-serif">
                        {rightText}
                    </p>
                </div>
            </div>
        </div>
    );
}