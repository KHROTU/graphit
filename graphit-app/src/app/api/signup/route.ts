import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: Request) {
    const body = await request.json();
    
    if (!BACKEND_URL) {
        console.error("BACKEND_URL environment variable is not set.");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    try {
        const backendResponse = await fetch(`${BACKEND_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch(error) {
        console.error("Signup API error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}