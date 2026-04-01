import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { error } = await supabase.from("events").insert([body]);
        if (error) throw error;
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("log-event failed:", err);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}