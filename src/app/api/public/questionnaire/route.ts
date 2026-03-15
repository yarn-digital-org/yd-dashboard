import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Public questionnaire submission endpoint.
 * POST { token, answers: { service, timeline, budget, current_website, goals, heard_from } }
 */
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { token, answers } = body;

    if (!token || !answers) {
      return NextResponse.json({ error: 'Missing token or answers' }, { status: 400 });
    }

    // Decode and validate token
    let decoded: { leadId?: string; contactId?: string; email: string; exp: number };
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    if (decoded.exp < Date.now()) {
      return NextResponse.json({ error: 'This link has expired. Please contact us directly.' }, { status: 410 });
    }

    const now = new Date().toISOString();

    // Save response
    await adminDb.collection('questionnaire_responses').add({
      leadId: decoded.leadId || null,
      contactId: decoded.contactId || null,
      email: decoded.email,
      answers,
      submittedAt: now,
    });

    // Mark send as responded
    const sendsSnap = await adminDb.collection('questionnaire_sends')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (!sendsSnap.empty) {
      await sendsSnap.docs[0].ref.update({
        responded: true,
        respondedAt: now,
      });
    }

    // Update lead/contact with answers
    if (decoded.leadId) {
      await adminDb.collection('leads').doc(decoded.leadId).update({
        questionnaire: answers,
        questionnaireCompletedAt: now,
        status: 'qualified',
      });
    }
    if (decoded.contactId) {
      await adminDb.collection('contacts').doc(decoded.contactId).update({
        questionnaire: answers,
        questionnaireCompletedAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ success: true, message: 'Thanks! We\'ll review your answers before we speak.' });
  } catch (error) {
    console.error('Questionnaire submission error:', error);
    return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 });
  }
}
