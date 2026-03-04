/**
 * PDF Generator for invoices and contracts
 * Uses a minimal HTML-to-PDF approach without external paid services
 * Generates a well-structured HTML document suitable for browser print/PDF export
 */

export interface InvoicePdfData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  from: {
    name: string;
    email?: string;
    address?: string;
    phone?: string;
  };
  to: {
    name: string;
    email?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  notes?: string;
  currency?: string;
}

export interface ContractPdfData {
  title: string;
  date: string;
  parties: {
    provider: { name: string; address?: string };
    client: { name: string; address?: string };
  };
  sections: Array<{
    title: string;
    content: string;
  }>;
  signatureDate?: string;
}

/**
 * Generate invoice HTML suitable for printing/PDF export
 */
export function generateInvoiceHtml(data: InvoicePdfData): string {
  const currency = data.currency || '£';
  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${escapeHtml(item.description)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">${currency}${item.rate.toFixed(2)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">${currency}${item.amount.toFixed(2)}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
<style>
  @media print {
    body { margin: 0; padding: 20px; }
    .no-print { display: none; }
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1F2937; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
  table { border-collapse: collapse; width: 100%; }
</style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
    <div>
      <h1 style="font-size: 28px; font-weight: 700; margin: 0; color: #0A0A0A;">YARN<span style="color: #FF3300;">.</span></h1>
      ${data.from.name ? `<p style="margin: 4px 0 0; color: #6B7280;">${escapeHtml(data.from.name)}</p>` : ''}
      ${data.from.email ? `<p style="margin: 2px 0 0; color: #6B7280; font-size: 14px;">${escapeHtml(data.from.email)}</p>` : ''}
      ${data.from.address ? `<p style="margin: 2px 0 0; color: #6B7280; font-size: 14px;">${escapeHtml(data.from.address)}</p>` : ''}
    </div>
    <div style="text-align: right;">
      <h2 style="font-size: 24px; font-weight: 600; margin: 0; color: #374151;">INVOICE</h2>
      <p style="margin: 4px 0 0; font-size: 16px; color: #6B7280;">${escapeHtml(data.invoiceNumber)}</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #6B7280;">Date: ${escapeHtml(data.date)}</p>
      <p style="margin: 2px 0 0; font-size: 14px; color: #6B7280;">Due: ${escapeHtml(data.dueDate)}</p>
    </div>
  </div>

  <div style="margin-bottom: 32px; padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
    <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600;">Bill To</p>
    <p style="margin: 0; font-weight: 600;">${escapeHtml(data.to.name)}</p>
    ${data.to.email ? `<p style="margin: 2px 0 0; font-size: 14px; color: #6B7280;">${escapeHtml(data.to.email)}</p>` : ''}
    ${data.to.address ? `<p style="margin: 2px 0 0; font-size: 14px; color: #6B7280;">${escapeHtml(data.to.address)}</p>` : ''}
  </div>

  <table style="margin-bottom: 24px;">
    <thead>
      <tr style="background-color: #F3F4F6;">
        <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6B7280; font-weight: 600;">Description</th>
        <th style="padding: 10px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #6B7280; font-weight: 600;">Qty</th>
        <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6B7280; font-weight: 600;">Rate</th>
        <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6B7280; font-weight: 600;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div style="display: flex; justify-content: flex-end;">
    <table style="width: 250px;">
      <tr>
        <td style="padding: 6px 0; color: #6B7280;">Subtotal</td>
        <td style="padding: 6px 0; text-align: right;">${currency}${data.subtotal.toFixed(2)}</td>
      </tr>
      ${data.tax !== undefined ? `
      <tr>
        <td style="padding: 6px 0; color: #6B7280;">Tax${data.taxRate ? ` (${data.taxRate}%)` : ''}</td>
        <td style="padding: 6px 0; text-align: right;">${currency}${data.tax.toFixed(2)}</td>
      </tr>` : ''}
      <tr style="border-top: 2px solid #1F2937;">
        <td style="padding: 10px 0; font-weight: 700; font-size: 18px;">Total</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 700; font-size: 18px;">${currency}${data.total.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  ${data.notes ? `
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
    <p style="font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600; margin: 0 0 8px;">Notes</p>
    <p style="margin: 0; color: #6B7280; font-size: 14px;">${escapeHtml(data.notes)}</p>
  </div>` : ''}
</body>
</html>`;
}

/**
 * Generate contract HTML suitable for printing/PDF export
 */
export function generateContractHtml(data: ContractPdfData): string {
  const sections = data.sections
    .map(
      (section, i) => `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 8px;">${i + 1}. ${escapeHtml(section.title)}</h3>
      <p style="margin: 0; color: #374151; white-space: pre-wrap;">${escapeHtml(section.content)}</p>
    </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(data.title)}</title>
<style>
  @media print {
    body { margin: 0; padding: 20px; }
    .no-print { display: none; }
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1F2937; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
</style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">${escapeHtml(data.title)}</h1>
    <p style="color: #6B7280; margin: 0;">Date: ${escapeHtml(data.date)}</p>
  </div>

  <div style="display: flex; justify-content: space-between; margin-bottom: 32px; gap: 24px;">
    <div style="flex: 1; padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
      <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600;">Provider</p>
      <p style="margin: 0; font-weight: 600;">${escapeHtml(data.parties.provider.name)}</p>
      ${data.parties.provider.address ? `<p style="margin: 2px 0 0; font-size: 14px; color: #6B7280;">${escapeHtml(data.parties.provider.address)}</p>` : ''}
    </div>
    <div style="flex: 1; padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
      <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600;">Client</p>
      <p style="margin: 0; font-weight: 600;">${escapeHtml(data.parties.client.name)}</p>
      ${data.parties.client.address ? `<p style="margin: 2px 0 0; font-size: 14px; color: #6B7280;">${escapeHtml(data.parties.client.address)}</p>` : ''}
    </div>
  </div>

  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">

  ${sections}

  <div style="margin-top: 48px; display: flex; justify-content: space-between; gap: 48px;">
    <div style="flex: 1;">
      <p style="font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600; margin: 0 0 32px;">Provider Signature</p>
      <div style="border-bottom: 1px solid #1F2937; margin-bottom: 8px; height: 40px;"></div>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">${escapeHtml(data.parties.provider.name)}</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: #6B7280;">Date: ____________</p>
    </div>
    <div style="flex: 1;">
      <p style="font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600; margin: 0 0 32px;">Client Signature</p>
      <div style="border-bottom: 1px solid #1F2937; margin-bottom: 8px; height: 40px;"></div>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">${escapeHtml(data.parties.client.name)}</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: #6B7280;">Date: ____________</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
