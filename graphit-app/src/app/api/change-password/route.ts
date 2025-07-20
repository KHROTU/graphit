import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    
    try {
        const response = await fetch(`${BACKEND_URL}/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: session.userId,
                currentPassword,
                newPassword
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Failed to change password' }, { status: response.status });
        }
        
        return NextResponse.json(data);

    } catch (error) {
        console.error("Change Password API error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}