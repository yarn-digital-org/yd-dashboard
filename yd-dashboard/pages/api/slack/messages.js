/**
 * Slack Inter-Agent Messages API
 * Fetches recent messages from agent Slack channels via OpenClaw webhook or direct channel reads.
 *
 * GET /api/slack/messages?channel=<channelId>&limit=<n>
 * GET /api/slack/messages?agents=all  — fetch from all known agent channels
 *
 * NOTE: This dashboard reads from the Yarn Digital Slack workspace.
 * OpenClaw agents post using their bot tokens; this API surfaces those messages
 * for visibility in the dashboard.
 */

// Known agent Slack channel IDs and metadata
export const AGENT_CHANNELS = {
  'all-hands': {
    channelId: 'C0AKCHQ2WKY',
    label: '#all-hands',
    description: 'Main team coordination channel',
    agents: ['Jarvis', 'Bolt', 'Aria', 'Scout', 'Radar', 'Blaze']
  }
};

// Agent identity map (Slack user ID → agent info)
export const AGENT_IDENTITIES = {
  'U0AC3C0P8AZ': { name: 'Jarvis', role: 'Chief of Staff / CMO', color: 'bg-blue-600', emoji: '🧠' },
  'U0AKGDJSVEG': { name: 'Bolt',   role: 'Dev & Engineering',      color: 'bg-purple-600', emoji: '⚡' },
  'U0AKGC1AW20': { name: 'Aria',   role: 'Creative Director',      color: 'bg-pink-600', emoji: '🎨' },
  'U0AKRNBKDAM': { name: 'Scout',  role: 'Research & Strategy',    color: 'bg-green-600', emoji: '🔍' },
  'U0AKRR5MGG1': { name: 'Radar',  role: 'Analytics & Monitoring', color: 'bg-orange-600', emoji: '📡' },
  'U0AKUJ4MWFK': { name: 'Blaze',  role: 'Ads & Paid Media',       color: 'bg-red-600', emoji: '🔥' },
  'U0ABRB47U1M': { name: 'Jonny',  role: 'CEO & Founder',          color: 'bg-gray-800', emoji: '👤' }
};

// Resolve <@USERID> mentions in message text
function resolveMentions(text) {
  if (!text) return '';
  return text.replace(/<@([A-Z0-9]+)>/g, (match, userId) => {
    const agent = AGENT_IDENTITIES[userId];
    return agent ? `@${agent.name}` : match;
  });
}

// Resolve <#CHANNELID|name> channel references
function resolveChannels(text) {
  if (!text) return '';
  return text.replace(/<#([A-Z0-9]+)\|?([^>]*)>/g, (match, channelId, name) => {
    return name ? `#${name}` : `#${channelId}`;
  });
}

function cleanText(text) {
  return resolveChannels(resolveMentions(text || ''));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { channel = 'C0AKCHQ2WKY', limit = '50', agents } = req.query;
  const slackToken = process.env.SLACK_BOT_TOKEN;

  if (!slackToken) {
    return res.status(503).json({
      success: false,
      error: 'SLACK_BOT_TOKEN not configured',
      hint: 'Add SLACK_BOT_TOKEN to Vercel environment variables'
    });
  }

  try {
    const channelToFetch = agents === 'all' ? 'C0AKCHQ2WKY' : channel;

    const url = new URL('https://slack.com/api/conversations.history');
    url.searchParams.set('channel', channelToFetch);
    url.searchParams.set('limit', Math.min(parseInt(limit), 100).toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${slackToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!data.ok) {
      return res.status(502).json({
        success: false,
        error: `Slack API error: ${data.error}`,
        channel: channelToFetch
      });
    }

    const messages = (data.messages || [])
      .filter(msg => msg.type === 'message' && !msg.subtype)
      .map(msg => {
        const agentInfo = AGENT_IDENTITIES[msg.user] || {
          name: msg.user || 'Unknown',
          role: 'Unknown',
          color: 'bg-gray-500',
          emoji: '❓'
        };
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
          reactions: (msg.reactions || []).map(r => ({ name: r.name, count: r.count })),
          threadTs: msg.thread_ts,
          replyCount: msg.reply_count || 0
        };
      })
      // Only show messages from known agents (filter out system/bot noise)
      .filter(msg => msg.isAgent || msg.agentName !== 'Unknown');

    const agentActivity = {};
    messages.forEach(msg => {
      if (!agentActivity[msg.agentName]) {
        agentActivity[msg.agentName] = { count: 0, lastMessage: null };
      }
      agentActivity[msg.agentName].count++;
      if (!agentActivity[msg.agentName].lastMessage) {
        agentActivity[msg.agentName].lastMessage = msg.timestamp;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        channel: channelToFetch,
        messages,
        total: messages.length,
        agentActivity,
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Failed to fetch messages: ${error.message}`
    });
  }
}
