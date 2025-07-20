import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: Request) {
  try {
    const clientAnalytics = await request.json();

    if (!BACKEND_URL) {
      throw new Error("BACKEND_URL is not defined in environment variables.");
    }

    const backendResponse = await fetch(`${BACKEND_URL}/sync-analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientAnalytics),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json({ error: 'Backend failed to sync analytics', details: data }, { status: backendResponse.status });
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Sync Analytics API Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(JSON.stringify({ error: 'Failed to proxy analytics sync request.', details: errorMessage }), { status: 500 });
  }
}