import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getSession();
  const { username, password } = await request.json();

  const backendUrl = 'https://graphit.pythonanywhere.com/login';
  
  try {
    const backendResponse = await fetch(backendUrl, {
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