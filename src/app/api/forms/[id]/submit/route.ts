import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export interface FormSubmission {
  id: string;
  formId: string;
  formName: string;
  data: Record<string, any>;
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// POST - Submit form data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    
    // Get the form to validate fields
    const formDoc = await adminDb.collection('forms').doc(id).get();
    
    if (!formDoc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const form = formDoc.data() as any;
    
    if (form.status !== 'active') {
      return NextResponse.json({ error: 'This form is not accepting submissions' }, { status: 400 });
    }

    const data = await request.json();

    // Validate required fields
    const missingFields: string[] = [];
    for (const field of form.fields) {
      if (field.required) {
        const value = data[field.id];
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          missingFields.push(field.label);
        }
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Validate field types
    for (const field of form.fields) {
      const value = data[field.id];
      if (value !== undefined && value !== null && value !== '') {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              return NextResponse.json({ 
                error: `Invalid email format for field: ${field.label}` 
              }, { status: 400 });
            }
            break;
          case 'phone':
            const phoneRegex = /^[\d\s+\-()]+$/;
            if (!phoneRegex.test(value)) {
              return NextResponse.json({ 
                error: `Invalid phone format for field: ${field.label}` 
              }, { status: 400 });
            }
            break;
          case 'date':
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
              return NextResponse.json({ 
                error: `Invalid date format for field: ${field.label}` 
              }, { status: 400 });
            }
            break;
        }
      }
    }

    // Get metadata from request
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const now = new Date().toISOString();
    
    const submission: Omit<FormSubmission, 'id'> = {
      formId: id,
      formName: form.name,
      data: data,
      submittedAt: now,
      ipAddress,
      userAgent,
    };

    // Save submission
    const submissionRef = await adminDb.collection('form_submissions').add(submission);

    // Update form submission count
    await adminDb.collection('forms').doc(id).update({
      submissionCount: (form.submissionCount || 0) + 1,
      updatedAt: now,
    });

    // Fire automations for form submission
    try {
      const { fireAutomations } = await import('@/lib/automation-engine');
      const formOwner = form.userId;
      if (formOwner) {
        await fireAutomations('form_submission', {
          id: submissionRef.id,
          formId: id,
          formName: form.name,
          _collection: 'form_submissions',
          ...submission.data,
        }, formOwner);
      } else {
        console.warn(`Form ${id} has no userId, skipping automations`);
      }
    } catch (e) {
      console.error('Automation trigger error:', e);
    }

    return NextResponse.json({ 
      id: submissionRef.id,
      message: 'Form submitted successfully',
      submittedAt: now
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error submitting form:', error);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
