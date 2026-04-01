export async function logEvent(payload: Record<string, unknown>): Promise<void> {
    try {
        await fetch("/api/log-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch {
        // silent fail — logging must never break the UI
    }
}
