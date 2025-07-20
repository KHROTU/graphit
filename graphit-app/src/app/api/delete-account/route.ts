import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();
    
    try {
        const response = await fetch(`${BACKEND_URL}/delete-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: session.userId,
                password
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Failed to delete account' }, { status: response.status });
        }
        
        await session.destroy();
        
        return NextResponse.json(data);

    } catch (error) {
        console.error("Delete Account API error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}