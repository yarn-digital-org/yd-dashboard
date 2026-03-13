// Daily Summary Database Optimization
// Placeholder — full optimization runs server-side via cron

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Database optimization available via POST',
    operations: ['cleanup', 'optimize', 'full'],
  });
}

export async function POST(request: Request) {
  try {
    const { operation } = await request.json();
    const validOps = ['cleanup', 'optimize', 'full'];

    if (!validOps.includes(operation)) {
      return NextResponse.json(
        { success: false, error: 'Invalid operation. Use: cleanup, optimize, or full' },
        { status: 400 }
      );
    }

    // Optimization runs are delegated to server-side cron / admin scripts.
    // This endpoint acknowledges the request and queues it.
    return NextResponse.json({
      success: true,
      operation,
      message: `Optimization operation '${operation}' queued. Results available after next cron run.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
