import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const backendUrl = 'https://graphit.pythonanywhere.com/signup';
    
    try {
        const backendResponse = await fetch(backendUrl, {
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