export function getSessionId(): string {
    if (typeof window === "undefined") return "ssr";
    const params = new URLSearchParams(window.location.search);
    const participant = params.get("participant");
    if (participant) {
        sessionStorage.setItem("liquidread-participant", participant);
        return participant;
    }
    let id = localStorage.getItem("liquidread-session-id");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("liquidread-session-id", id);
    }
    return id;
}