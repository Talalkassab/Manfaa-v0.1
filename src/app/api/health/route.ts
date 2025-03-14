import { NextResponse } from 'next/server';

/**
 * Health check API endpoint
 * Used to verify the development environment and check important services
 */
export async function GET() {
  const startTime = Date.now();
  
  // Measure end time for performance benchmarking
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  return NextResponse.json({
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    performance: {
      responseTime: `${responseTime}ms`,
    },
    nextjs: {
      version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'local',
    },
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
} 