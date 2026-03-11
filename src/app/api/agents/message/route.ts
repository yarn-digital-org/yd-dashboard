import { NextRequest, NextResponse } from 'next/server';
import { AGENT_MAPPING } from '@/lib/agent-mapping';

const ALL_HANDS_CHANNEL = 'C0AKCHQ2WKY';

// In-memory log (non-persistent across serverless invocations — swap to Firestore later)
const messageLog: Array<{
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  channel: string;
  sent: boolean;
  slackTs: string | null;
  error?: string;
}> = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, message, channel } = body;

    if (!from || !message) {
      return NextResponse.json({ error: 'Missing required fields: from, message' }, { status: 400 });
    }

    if (!AGENT_MAPPING[from]) {
      return NextResponse.json({ error: `Unknown agent: ${from}` }, { status: 400 });
    }

    let slackMessage = message;
    if (to && to !== 'all' && AGENT_MAPPING[to]) {
      slackMessage = `<@${AGENT_MAPPING[to].slackId}> — ${message}`;
    }

    const targetChannel = channel || ALL_HANDS_CHANNEL;
    const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;

    const logEntry = {
      id: Date.now().toString(),
      from,
      to: to || 'all',
      message,
      timestamp: new Date().toISOString(),
      channel: targetChannel,
      sent: false,
      slackTs: null as string | null,
      error: undefined as string | undefined,
    };

    if (SLACK_TOKEN) {
      try {
        const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { Authorization: `Bearer ${SLACK_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: targetChannel, text: slackMessage }),
        });
        const slackData = await slackRes.json();
        if (slackData.ok) {
          logEntry.sent = true;
          logEntry.slackTs = slackData.ts;
        } else {
          logEntry.error = slackData.error;
        }
      } catch (err) {
        logEntry.error = (err as Error).message;
      }
    } else {
      logEntry.error = 'No SLACK_BOT_TOKEN configured';
    }

    messageLog.push(logEntry);
    if (messageLog.length > 100) messageLog.shift();

    return NextResponse.json({
      success: true,
      messageId: logEntry.id,
      sent: logEntry.sent,
      ...(logEntry.error && { warning: logEntry.error }),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  let filtered = [...messageLog];
  if (from) filtered = filtered.filter(m => m.from === from);
  if (to) filtered = filtered.filter(m => m.to === to || m.to === 'all');

  filtered.reverse();
  filtered = filtered.slice(0, limit);

  return NextResponse.json({ success: true, messages: filtered, total: filtered.length });
}
