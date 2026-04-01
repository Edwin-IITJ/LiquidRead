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

interface NarrativeCardProps {
    layer: number;
    card: CardData;
    visualHints: VisualHints;
}

export default function NarrativeCard({ layer, card }: NarrativeCardProps) {
    const currentLayer = card.layers[layer];
    if (!currentLayer) return null;

    return (
        <div className="flex flex-col gap-3">
            {currentLayer.headline && (
                <h3 className="text-base font-semibold text-slate-800 leading-snug">
                    {currentLayer.headline}
                </h3>
            )}
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {currentLayer.body}
            </p>
        </div>
    );
}