import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch the summary data
    const summaryResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/daily-summary?date=${date}`);
    
    if (!summaryResponse.ok) {
      throw new Error('Failed to fetch summary data');
    }

    const summaryData = await summaryResponse.json();

    // Generate PDF report
    const pdfBuffer = await generatePDFReport(summaryData);

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="daily-summary-${date}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error exporting daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to export daily summary' },
      { status: 500 }
    );
  }
}

async function generatePDFReport(data: any): Promise<Buffer> {
  // In a real implementation, you would use a library like puppeteer, jsPDF, or PDFKit
  // For now, generate a simple HTML-to-PDF conversion
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Daily Summary Report - ${data.date}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px;
          color: #333;
        }
        .header { 
          border-bottom: 2px solid #3b82f6; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .metric-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 20px; 
          margin-bottom: 30px; 
        }
        .metric-card { 
          border: 1px solid #e5e7eb; 
          padding: 20px; 
          border-radius: 8px; 
        }
        .metric-title { 
          font-size: 14px; 
          color: #6b7280; 
          margin-bottom: 5px; 
        }
        .metric-value { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 5px; 
        }
        .metric-subtitle { 
          font-size: 12px; 
          color: #6b7280; 
        }
        .section { 
          margin-bottom: 30px; 
        }
        .section h2 { 
          border-bottom: 1px solid #e5e7eb; 
          padding-bottom: 10px; 
        }
        .insight-item, .anomaly-item { 
          padding: 10px; 
          margin-bottom: 10px; 
          border-left: 4px solid #3b82f6; 
          background-color: #f8fafc; 
        }
        .anomaly-item { 
          border-left-color: #f59e0b; 
        }
        .anomaly-high { 
          border-left-color: #ef4444; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
        }
        th, td { 
          text-align: left; 
          padding: 8px; 
          border-bottom: 1px solid #e5e7eb; 
        }
        th { 
          background-color: #f8fafc; 
          font-weight: bold; 
        }
        .priority-high { 
          background-color: #fee2e2; 
          color: #991b1b; 
          padding: 2px 8px; 
          border-radius: 12px; 
          font-size: 12px; 
        }
        .priority-medium { 
          background-color: #fef3c7; 
          color: #92400e; 
          padding: 2px 8px; 
          border-radius: 12px; 
          font-size: 12px; 
        }
        .priority-low { 
          background-color: #dcfce7; 
          color: #166534; 
          padding: 2px 8px; 
          border-radius: 12px; 
          font-size: 12px; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Daily Summary Report</h1>
        <p>Generated for ${data.date}</p>
      </div>

      <div class="section">
        <h2>Key Metrics</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-title">Website Sessions</div>
            <div class="metric-value">${formatNumber(data.metrics.analytics.sessions)}</div>
            <div class="metric-subtitle">${(data.metrics.analytics.bounce_rate * 100).toFixed(1)}% bounce rate</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Campaign Spend</div>
            <div class="metric-value">£${data.metrics.campaigns.spend.toFixed(2)}</div>
            <div class="metric-subtitle">${data.metrics.campaigns.conversions} conversions</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Tasks Completed</div>
            <div class="metric-value">${data.metrics.tasks.completed}</div>
            <div class="metric-subtitle">${(data.metrics.tasks.completion_rate * 100).toFixed(1)}% completion rate</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">System Uptime</div>
            <div class="metric-value">${(data.metrics.system.uptime * 100).toFixed(1)}%</div>
            <div class="metric-subtitle">${data.metrics.system.errors} errors</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Key Insights</h2>
        ${data.insights.map((insight: string) => `
          <div class="insight-item">${insight}</div>
        `).join('')}
      </div>

      ${data.anomalies.length > 0 ? `
      <div class="section">
        <h2>Anomalies</h2>
        ${data.anomalies.map((anomaly: { metric: string; description: string; severity: string; current: string | number; expected: string | number }) => `
          <div class="anomaly-item ${anomaly.severity === 'high' ? 'anomaly-high' : ''}">
            <strong>${anomaly.metric}</strong> - ${anomaly.description}<br>
            <small>Current: ${anomaly.current} | Expected: ${anomaly.expected}</small>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="section">
        <h2>Recommended Actions</h2>
        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            ${data.actions.map((action: { priority: string; task: string; assigned_to: string; deadline: string }) => `
              <tr>
                <td><span class="priority-${action.priority}">${action.priority}</span></td>
                <td>${action.task}</td>
                <td>${action.assigned_to}</td>
                <td>${action.deadline}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <p><small>Report generated on ${new Date().toISOString().split('T')[0]} by Yarn Digital Analytics System</small></p>
      </div>
    </body>
    </html>
  `;

  // In production, use puppeteer or similar to generate actual PDF
  // For now, return HTML content as buffer (browser will handle PDF conversion)
  return Buffer.from(htmlContent, 'utf-8');
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
