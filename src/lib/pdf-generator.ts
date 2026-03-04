/**
 * PDF generation utilities using jsPDF
 * Generates branded invoices and contracts
 */

import jsPDF from 'jspdf';
import { adminDb } from './firebase-admin';
import { Invoice, Contract, LineItem } from '@/types/database';

interface BrandingSettings {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
}

async function getBranding(): Promise<BrandingSettings> {
  const defaults: BrandingSettings = {
    companyName: 'Yarn Digital',
    logoUrl: '',
    primaryColor: '#FF3300',
  };

  if (!adminDb) return defaults;

  try {
    const doc = await adminDb.collection('settings').doc('branding').get();
    if (doc.exists) {
      const data = doc.data()!;
      return {
        companyName: data.companyName || defaults.companyName,
        logoUrl: data.logoUrl || defaults.logoUrl,
        primaryColor: data.primaryColor || defaults.primaryColor,
      };
    }
  } catch {}
  return defaults;
}

/**
 * Generate invoice PDF
 */
export async function generateInvoicePDF(
  invoice: Invoice & {
    clientName: string;
    clientEmail: string;
    clientAddress?: string;
  }
): Promise<Buffer> {
  const branding = await getBranding();
  const doc = new jsPDF();

  // Helper functions
  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;
  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-GB');
  };

  // Set colors
  const primaryColor = branding.primaryColor || '#FF3300';
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 51, b: 0 };
  };

  const rgb = hexToRgb(primaryColor);

  let yPosition = 30;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text(branding.companyName, 20, yPosition);

  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  yPosition += 20;
  doc.text(`Invoice ${invoice.invoiceNumber}`, 20, yPosition);

  // Add line under header
  yPosition += 10;
  doc.setDrawColor(rgb.r, rgb.g, rgb.b);
  doc.setLineWidth(1);
  doc.line(20, yPosition, 190, yPosition);

  yPosition += 20;

  // Bill To section
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('BILL TO', 20, yPosition);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  yPosition += 8;
  doc.text(invoice.clientName, 20, yPosition);
  yPosition += 6;
  doc.text(invoice.clientEmail, 20, yPosition);

  if (invoice.clientAddress) {
    yPosition += 6;
    doc.text(invoice.clientAddress, 20, yPosition);
  }

  // Invoice details (right side)
  const detailsX = 120;
  let detailsY = 60;

  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('INVOICE DATE', detailsX, detailsY);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  detailsY += 8;
  doc.text(formatDate(invoice.invoiceDate), detailsX, detailsY);

  detailsY += 12;
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('DUE DATE', detailsX, detailsY);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  detailsY += 8;
  doc.text(formatDate(invoice.dueDate), detailsX, detailsY);

  if (invoice.poNumber) {
    detailsY += 12;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('PO NUMBER', detailsX, detailsY);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    detailsY += 8;
    doc.text(invoice.poNumber, detailsX, detailsY);
  }

  yPosition += 30;

  // Line items table
  yPosition += 20;

  // Table header
  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('DESCRIPTION', 20, yPosition);
  doc.text('QTY', 120, yPosition);
  doc.text('RATE', 140, yPosition);
  doc.text('AMOUNT', 170, yPosition);

  yPosition += 8;
  doc.line(20, yPosition, 190, yPosition);

  // Line items
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  for (const item of invoice.lineItems) {
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }

    doc.text(item.description, 20, yPosition);
    if (item.details) {
      yPosition += 6;
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(item.details, 20, yPosition);
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
    }

    doc.text(item.quantity.toString(), 120, yPosition);
    doc.text(formatCurrency(item.rate), 140, yPosition);
    doc.text(formatCurrency(item.amount), 170, yPosition);

    yPosition += 5;
    doc.setDrawColor(243, 244, 246);
    doc.line(20, yPosition, 190, yPosition);
  }

  // Totals section
  yPosition += 20;

  // Check if we need a new page for totals
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 30;
  }

  const totalsX = 120;
  doc.setDrawColor(224, 224, 224);
  doc.line(totalsX, yPosition, 190, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setTextColor(74, 74, 74);
  doc.text('Subtotal', totalsX, yPosition);
  doc.text(formatCurrency(invoice.subtotal), 170, yPosition);

  if (invoice.discountAmount > 0) {
    yPosition += 8;
    doc.text('Discount', totalsX, yPosition);
    doc.text(`-${formatCurrency(invoice.discountAmount)}`, 170, yPosition);
  }

  if (invoice.taxAmount > 0) {
    yPosition += 8;
    const taxText = invoice.taxRate ? `Tax (${invoice.taxRate}%)` : 'Tax';
    doc.text(taxText, totalsX, yPosition);
    doc.text(formatCurrency(invoice.taxAmount), 170, yPosition);
  }

  yPosition += 12;
  doc.setDrawColor(224, 224, 224);
  doc.line(totalsX, yPosition, 190, yPosition);

  yPosition += 10;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Total', totalsX, yPosition);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text(formatCurrency(invoice.total), 170, yPosition);

  // Notes
  if (invoice.notes) {
    yPosition += 30;
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Notes', 20, yPosition);

    yPosition += 10;
    doc.setFontSize(10);
    doc.setTextColor(74, 74, 74);
    const notesLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(notesLines, 20, yPosition);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `© ${new Date().getFullYear()} ${branding.companyName}. All rights reserved.`,
    105,
    pageHeight - 20,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate contract PDF
 */
export async function generateContractPDF(
  contract: Contract & {
    clientName: string;
    clientEmail: string;
  }
): Promise<Buffer> {
  const branding = await getBranding();
  const doc = new jsPDF();

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-GB');
  };

  // Set colors
  const primaryColor = branding.primaryColor || '#FF3300';
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 51, b: 0 };
  };

  const rgb = hexToRgb(primaryColor);

  let yPosition = 30;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text(branding.companyName, 20, yPosition);

  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  yPosition += 20;
  doc.text(contract.name, 20, yPosition);

  // Add line under header
  yPosition += 10;
  doc.setDrawColor(rgb.r, rgb.g, rgb.b);
  doc.setLineWidth(1);
  doc.line(20, yPosition, 190, yPosition);

  yPosition += 20;

  // Contract details
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('CLIENT', 20, yPosition);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  yPosition += 8;
  doc.text(contract.clientName, 20, yPosition);
  yPosition += 6;
  doc.text(contract.clientEmail, 20, yPosition);

  // Contract details (right side)
  const detailsX = 120;
  let detailsY = 60;

  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('CREATED DATE', detailsX, detailsY);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  detailsY += 8;
  doc.text(formatDate(contract.createdAt), detailsX, detailsY);

  if (contract.signedAt) {
    detailsY += 12;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('SIGNED DATE', detailsX, detailsY);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    detailsY += 8;
    doc.text(formatDate(contract.signedAt), detailsX, detailsY);
  }

  yPosition += 30;

  // Contract content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const contentLines = doc.splitTextToSize(contract.content, 170);
  doc.text(contentLines, 20, yPosition);

  // Calculate where content ends
  yPosition += contentLines.length * 6;

  // Signatures section
  yPosition += 40;

  // Check if we need a new page for signatures
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 30;
  }

  doc.setDrawColor(224, 224, 224);
  doc.line(20, yPosition, 190, yPosition);

  yPosition += 15;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Signatures', 20, yPosition);

  for (const signer of contract.signers) {
    yPosition += 20;

    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(signer.name.toUpperCase(), 20, yPosition);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    yPosition += 8;
    doc.text(signer.email, 20, yPosition);

    // Signature line
    yPosition += 15;
    doc.setDrawColor(224, 224, 224);
    doc.line(20, yPosition, 100, yPosition);

    if (signer.signedAt) {
      yPosition += 8;
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Signed on ${formatDate(signer.signedAt)}`, 20, yPosition);
    }

    yPosition += 15;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `© ${new Date().getFullYear()} ${branding.companyName}. All rights reserved.`,
    105,
    pageHeight - 20,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}