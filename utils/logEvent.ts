export interface LogEventParams {
    session_id: string;
    event_type: string;
    component_type: string | null;
    card_variant: string | null;
    paper_title: string | null;
    paper_field: string | null;
    normalised_score: number | null;
    metadata?: Record<string, unknown> | null;
    calibration_signal?: string | null;
    suitability_rating?: number | null;
    participant?: string | null;
}

export async function logEvent(params: LogEventParams): Promise<void> {
    const body = {
        session_id: params.session_id,
        event_type: params.event_type,
        component_type: params.component_type ?? null,
        card_variant: params.card_variant ?? null,
        paper_title: params.paper_title ?? null,
        paper_field: params.paper_field ?? null,
        normalised_score: params.normalised_score ?? null,
        metadata: params.metadata ?? null,
        calibration_signal: params.calibration_signal ?? null,
        suitability_rating: params.suitability_rating ?? null,
        participant: params.participant ?? null,
    };
    try {
        await fetch("/api/log-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch {
        // silent fail — logging must never break the UI
    }
}
