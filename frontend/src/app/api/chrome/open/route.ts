import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/chrome/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Chrome open error:', error);
    return NextResponse.json(
      { error: 'Failed to open Chrome' },
      { status: 500 }
    );
  }
}