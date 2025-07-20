import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://graphit.pythonanywhere.com';

export async function GET() {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/get-graphs/${session.userId}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch graphs');
        }
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}