import { SheetPayload } from '@/types/quiz';

export async function submitToSheet(payload: SheetPayload): Promise<void> {
    const url = process.env.NEXT_PUBLIC_SHEET_URL;
    if (!url) {
        console.warn('NEXT_PUBLIC_SHEET_URL is not set. Skipping submission.');
        return;
    }

    await fetch(url, {
        method: 'POST',
        // Intentionally no Content-Type header — Apps Script reads via e.postData.contents
        body: JSON.stringify(payload),
    });
}
