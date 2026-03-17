import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const agentKey = process.env.AGENT_API_KEY;
  
  return NextResponse.json({
    hasAuth: !!authHeader,
    authPrefix: authHeader?.substring(0, 10),
    hasEnvVar: !!agentKey,
    envVarLength: agentKey?.length || 0,
    envVarPrefix: agentKey?.substring(0, 8) || 'none',
    match: authHeader?.slice(7) === agentKey,
  });
}
