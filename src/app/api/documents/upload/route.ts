import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/documents/upload
 * Public endpoint for agents to upload documents to Firestore.
 * Documents automatically appear on yd-dashboard.vercel.app/documents.
 *
 * Required fields: title, content, agent
 * Optional: category, description, status, tags, filename
 *
 * Upserts by title+agent — calling twice with the same title+agent updates instead of duplicating.
 */
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Firebase not initialized' }, { status: 500 });
    }

    const body = await request.json();
    const { title, content, agent, category, description, status, tags, filename } = body;

    if (!title || !content || !agent) {
      return NextResponse.json(
        { success: false, error: 'Required fields: title, content, agent' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const contentStr = String(content);
    const preview = contentStr.substring(0, 300).replace(/[#*_\-`]/g, '').trim();
    const sizeBytes = Buffer.byteLength(contentStr, 'utf8');
    const sizeStr = sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(1)} KB` : `${sizeBytes} B`;

    const docData: Record<string, unknown> = {
      title,
      filename: filename || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
      agent,
      category: category || 'General',
      description: description || preview.substring(0, 150),
      size: sizeStr,
      status: status || 'completed',
      updated: now,
      contentPreview: preview,
      content: contentStr,
      tags: tags || [agent.toLowerCase()],
      version: '1.0',
      type: 'markdown',
    };

    // Upsert: check if doc with same title + agent already exists
    const existing = await adminDb.collection('documents')
      .where('title', '==', title)
      .where('agent', '==', agent)
      .limit(1)
      .get();

    let docId: string;
    if (!existing.empty) {
      docId = existing.docs[0].id;
      await adminDb.collection('documents').doc(docId).update(docData);
    } else {
      docData.created = now;
      const ref = await adminDb.collection('documents').add(docData);
      docId = ref.id;
    }

    return NextResponse.json({
      success: true,
      id: docId,
      action: existing.empty ? 'created' : 'updated',
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
