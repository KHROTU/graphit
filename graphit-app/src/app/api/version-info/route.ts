import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET() {
    if (!BACKEND_URL) {
        return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/version-info?_=${new Date().getTime()}`, {
            cache: 'no-store',
        });
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Failed to fetch version info from backend' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Version Info API proxy error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}