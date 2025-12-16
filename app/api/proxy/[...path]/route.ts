
import { NextResponse } from "next/server";

export async function POST(request: Request, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    try {
        const body = await request.json();
        const path = params.path.join("/");

        // Use environment variable for Docker compatibility
        const backendUrl = process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8000";
        const targetUrl = `${backendUrl}/${path}`;

        console.log(`[PROXY] Forwarding to: ${targetUrl}`);

        const res = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[PROXY] Backend Error (${res.status}):`, errorText);
            return NextResponse.json({ error: `Backend failed: ${res.statusText}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("[PROXY] Internal Error:", error);
        return NextResponse.json(
            { error: "Analiz servisine erişilemedi. Backend çalışmıyor olabilir." },
            { status: 503 }
        );
    }
}
