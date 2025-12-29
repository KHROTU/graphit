import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: Request) {
  const session = await getSession();
  const { username, password } = await request.json();

  if (!BACKEND_URL) {
    console.error("BACKEND_URL environment variable is not set.");
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await backendResponse.json();

    if (backendResponse.ok) {
        session.userId = data.id;
        session.username = data.username;
        session.isLoggedIn = true;
        await session.save();
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: data.error }, { status: 401 });
    }
  } catch(error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}