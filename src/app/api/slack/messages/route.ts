import { NextRequest, NextResponse } from 'next/server';
import { AGENT_IDENTITIES } from '@/lib/agent-mapping';

function resolveMentions(text: string): string {
  return text.replace(/<@([A-Z0-9]+)>/g, (match, userId) => {
    const agent = AGENT_IDENTITIES[userId];
    return agent ? `@${agent.name}` : match;
  });
}

function resolveChannels(text: string): string {
  return text.replace(/<#([A-Z0-9]+)\|?([^>]*)>/g, (_match, _channelId, name) => {
    return name ? `#${name}` : `#${_channelId}`;
  });
}

function cleanText(text: string): string {
  return resolveChannels(resolveMentions(text || ''));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel') || 'C0AKCHQ2WKY';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const agents = searchParams.get('agents');

  const slackToken = process.env.SLACK_BOT_TOKEN;
  if (!slackToken) {
    return NextResponse.json(
      { success: false, error: 'SLACK_BOT_TOKEN not configured', hint: 'Add SLACK_BOT_TOKEN to Vercel environment variables' },
      { status: 503 }
    );
  }

  try {
    const channelToFetch = agents === 'all' ? 'C0AKCHQ2WKY' : channel;
    const url = new URL('https://slack.com/api/conversations.history');
    url.searchParams.set('channel', channelToFetch);
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${slackToken}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ success: false, error: `Slack API error: ${data.error}`, channel: channelToFetch }, { status: 502 });
    }

    interface SlackReaction {
      name: string;
      count: number;
    }

    const messages = (data.messages || [])
      .filter((msg: { type: string; subtype?: string }) => msg.type === 'message' && !msg.subtype)
      .map((msg: { ts: string; user: string; text: string; reactions?: SlackReaction[]; thread_ts?: string; reply_count?: number }) => {
        const agentInfo = AGENT_IDENTITIES[msg.user] || { name: msg.user || 'Unknown', role: 'Unknown', color: 'bg-gray-500', emoji: '❓' };
        return {
          id: msg.ts,
          ts: msg.ts,
          timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
          userId: msg.user,
          agentName: agentInfo.name,
          agentRole: agentInfo.role,
          agentColor: agentInfo.color,
          agentEmoji: agentInfo.emoji,
          isAgent: !!AGENT_IDENTITIES[msg.user],
          text: cleanText(msg.text),
          rawText: msg.text,
          channel: channelToFetch,
          reactions: (msg.reactions || []).map((r: SlackReaction) => ({ name: r.name, count: r.count })),
          threadTs: msg.thread_ts,
          replyCount: msg.reply_count || 0,
        };
      })
      .filter((msg: { isAgent: boolean; agentName: string }) => msg.isAgent || msg.agentName !== 'Unknown');

    const agentActivity: Record<string, { count: number; lastMessage: string | null }> = {};
    messages.forEach((msg: { agentName: string; timestamp: string }) => {
      if (!agentActivity[msg.agentName]) {
        agentActivity[msg.agentName] = { count: 0, lastMessage: null };
      }
      agentActivity[msg.agentName].count++;
      if (!agentActivity[msg.agentName].lastMessage) {
        agentActivity[msg.agentName].lastMessage = msg.timestamp;
      }
    });

    return NextResponse.json({
      success: true,
      data: { channel: channelToFetch, messages, total: messages.length, agentActivity, fetchedAt: new Date().toISOString() },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: `Failed to fetch messages: ${(error as Error).message}` }, { status: 500 });
  }
}
