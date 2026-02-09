import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - List submissions for a form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify form exists
    const formDoc = await adminDb.collection('forms').doc(id).get();
    if (!formDoc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const query = adminDb.collection('form_submissions')
      .where('formId', '==', id)
      .orderBy('submittedAt', 'desc');

    const snapshot = await query.get();
    let submissions = snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Pagination
    const total = submissions.length;
    submissions = submissions.slice(offset, offset + limit);

    return NextResponse.json({ 
      submissions,
      form: { id: formDoc.id, ...formDoc.data() },
      total,
      limit,
      offset,
      hasMore: offset + submissions.length < total
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id: formId } = await params;
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    const submissionRef = adminDb.collection('form_submissions').doc(submissionId);
    const submission = await submissionRef.get();

    if (!submission.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submissionData = submission.data();
    if (submissionData?.formId !== formId) {
      return NextResponse.json({ error: 'Submission does not belong to this form' }, { status: 400 });
    }

    await submissionRef.delete();

    // Update form submission count
    const formRef = adminDb.collection('forms').doc(formId);
    const formDoc = await formRef.get();
    if (formDoc.exists) {
      const form = formDoc.data();
      await formRef.update({
        submissionCount: Math.max(0, (form?.submissionCount || 1) - 1),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ message: 'Submission deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
