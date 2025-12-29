import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET() {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!BACKEND_URL) {
        console.error("BACKEND_URL environment variable is not set.");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/get-graphs/${session.userId}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch graphs');
        }
        return NextResponse.json(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("GET graphs error:", errorMessage);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!BACKEND_URL) {
        console.error("BACKEND_URL environment variable is not set.");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    
    try {
        const response = await fetch(`${BACKEND_URL}/save-graph`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, userId: session.userId }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save graph');
        }
        return NextResponse.json(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("POST graph error:", errorMessage);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}