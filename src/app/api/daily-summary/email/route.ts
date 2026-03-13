import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const date = body.date || new Date().toISOString().split('T')[0];

    // Fetch the summary data
    const summaryResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/daily-summary?date=${date}`);
    
    if (!summaryResponse.ok) {
      throw new Error('Failed to fetch summary data');
    }

    const summaryData = await summaryResponse.json();

    // Send email with summary data
    await sendDailySummaryEmail(summaryData, date);

    return NextResponse.json({ 
      success: true, 
      message: 'Daily summary email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending daily summary email:', error);
    return NextResponse.json(
      { error: 'Failed to send daily summary email' },
      { status: 500 }
    );
  }
}

async function sendDailySummaryEmail(data: any, date: string) {
  // In production, integrate with email service (SendGrid, Mailgun, etc.)
  // For now, simulate email sending and log the content

  const emailContent = generateEmailContent(data, date);
  const recipients = getEmailRecipients();

  // Simulate email sending
  console.log('=== DAILY SUMMARY EMAIL ===');
  console.log('To:', recipients.join(', '));
  console.log('Subject:', `Daily Summary Report - ${date}`);
  console.log('Content:', emailContent);

  // In production, replace with actual email service
  // await emailService.send({
  //   to: recipients,
  //   subject: `Daily Summary Report - ${date}`,
  //   html: emailContent
  // });

  // Store email in database for audit trail
  await logEmailSent(data, date, recipients);
}

function generateEmailContent(data: any, date: string): string {
  const criticalAnomalies = data.anomalies.filter((a: { severity: string }) => a.severity === 'high');
  const highPriorityActions = data.actions.filter((a: { priority: string }) => a.priority === 'high');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Summary Report</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header { 
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          padding: 30px 25px;
          border-radius: 12px 12px 0 0;
          text-align: center;
        }
        .content { 
          background: white;
          border: 1px solid #e5e7eb;
          border-top: none;
          padding: 25px;
          border-radius: 0 0 12px 12px;
        }
        .metric-row { 
          display: table;
          width: 100%;
          margin-bottom: 20px;
        }
        .metric { 
          display: table-cell;
          text-align: center;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          margin-right: 10px;
          width: 23%;
        }
        .metric:last-child { margin-right: 0; }
        .metric-value { 
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          display: block;
        }
        .metric-label { 
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .alert-box { 
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .alert-title { 
          font-weight: bold;
          color: #dc2626;
          margin-bottom: 10px;
        }
        .insight-box { 
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .insight-title { 
          font-weight: bold;
          color: #0369a1;
          margin-bottom: 10px;
        }
        ul { 
          margin: 0;
          padding-left: 20px;
        }
        li { margin-bottom: 5px; }
        .footer { 
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
        .cta-button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          margin: 10px 5px;
        }
        .trend-up { color: #10b981; font-weight: bold; }
        .trend-down { color: #ef4444; font-weight: bold; }
        .trend-stable { color: #6b7280; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 28px;">📊 Daily Summary</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${date}</p>
      </div>
      
      <div class="content">
        <h2 style="color: #1f2937; margin-top: 0;">Key Metrics</h2>
        
        <div class="metric-row">
          <div class="metric">
            <span class="metric-value">${formatNumber(data.metrics.analytics.sessions)}</span>
            <div class="metric-label">Sessions</div>
            <div class="trend-${data.metrics.analytics.trend}">${getTrendSymbol(data.metrics.analytics.trend)}</div>
          </div>
          <div class="metric">
            <span class="metric-value">£${data.metrics.campaigns.spend.toFixed(0)}</span>
            <div class="metric-label">Ad Spend</div>
            <div style="font-size: 12px; color: #6b7280;">${data.metrics.campaigns.conversions} conv.</div>
          </div>
          <div class="metric">
            <span class="metric-value">${data.metrics.tasks.completed}</span>
            <div class="metric-label">Tasks Done</div>
            <div style="font-size: 12px; color: #6b7280;">${(data.metrics.tasks.completion_rate * 100).toFixed(0)}% rate</div>
          </div>
          <div class="metric">
            <span class="metric-value">${(data.metrics.system.uptime * 100).toFixed(1)}%</span>
            <div class="metric-label">Uptime</div>
            <div style="font-size: 12px; color: #6b7280;">${data.metrics.system.errors} errors</div>
          </div>
        </div>

        ${criticalAnomalies.length > 0 ? `
        <div class="alert-box">
          <div class="alert-title">🚨 Critical Alerts</div>
          <ul>
            ${criticalAnomalies.map((anomaly: { metric: string; description: string }) => `
              <li><strong>${anomaly.metric}:</strong> ${anomaly.description}</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}

        <div class="insight-box">
          <div class="insight-title">💡 Key Insights</div>
          <ul>
            ${data.insights.map((insight: string) => `<li>${insight}</li>`).join('')}
          </ul>
        </div>

        ${highPriorityActions.length > 0 ? `
        <h3 style="color: #1f2937;">🎯 Priority Actions</h3>
        <ul>
          ${highPriorityActions.map((action: { task: string; assigned_to: string; deadline: string }) => `
            <li><strong>${action.task}</strong> (${action.assigned_to} - ${action.deadline})</li>
          `).join('')}
        </ul>
        ` : ''}

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/daily-summary" class="cta-button">
            📈 View Full Report
          </a>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/daily-summary/export?date=${date}" class="cta-button">
            📥 Download PDF
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>This automated report was generated by Yarn Digital Analytics System<br>
        Questions? Reply to this email or contact the team.</p>
      </div>
    </body>
    </html>
  `;
}

function getEmailRecipients(): string[] {
  // In production, get from environment variables or database
  const defaultRecipients = [
    'jonny@yarndigital.co.uk',
    'team@yarndigital.co.uk'
  ];

  const envRecipients = process.env.DAILY_SUMMARY_RECIPIENTS;
  if (envRecipients) {
    return envRecipients.split(',').map(email => email.trim());
  }

  return defaultRecipients;
}

async function logEmailSent(data: any, date: string, recipients: string[]) {
  try {
    // In production, log to database or audit system
    console.log(`Daily summary email sent for ${date} to:`, recipients);
    
    // Could store in Firestore for audit trail:
    // await db.collection('email_logs').add({
    //   type: 'daily_summary',
    //   date,
    //   recipients,
    //   sent_at: new Date().toISOString(),
    //   metrics_summary: {
    //     sessions: data.metrics.analytics.sessions,
    //     spend: data.metrics.campaigns.spend,
    //     tasks_completed: data.metrics.tasks.completed,
    //     uptime: data.metrics.system.uptime
    //   }
    // });
  } catch (error) {
    console.error('Error logging email send:', error);
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getTrendSymbol(trend: string): string {
  switch (trend) {
    case 'up': return '↗️ +';
    case 'down': return '↘️ -';
    default: return '→ =';
  }
}
