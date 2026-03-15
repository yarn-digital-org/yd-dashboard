'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'service',
    label: 'What service are you looking for?',
    type: 'select',
    options: ['New website', 'SEO & digital marketing', 'Brand identity & design', 'Shopify store', 'Paid advertising', 'Not sure yet'],
    required: true,
  },
  {
    id: 'timeline',
    label: "What's your ideal timeline?",
    type: 'select',
    options: ['ASAP (within 2 weeks)', '1–2 months', '3–6 months', 'Just exploring'],
    required: true,
  },
  {
    id: 'budget',
    label: "What's your budget range?",
    type: 'select',
    options: ['Under £2,000', '£2,000–£5,000', '£5,000–£10,000', '£10,000+', 'Not sure'],
    required: false,
  },
  {
    id: 'current_website',
    label: 'Do you have a current website?',
    type: 'select',
    options: ["Yes, and it's working well", 'Yes, but it needs work', 'No website yet'],
    required: false,
  },
  {
    id: 'goals',
    label: "What's your main goal from this project?",
    type: 'textarea',
    placeholder: 'E.g. more leads, better branding, faster site...',
    required: false,
  },
  {
    id: 'heard_from',
    label: 'How did you hear about us?',
    type: 'text',
    placeholder: 'E.g. Google, referral, social media...',
    required: false,
  },
];

export default function QuestionnairePage() {
  const params = useParams();
  const token = params?.token as string;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/public/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setDone(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '2rem',
        fontFamily: '"Inter", sans-serif',
      }}>
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <CheckCircle2 size={48} style={{ color: '#FF3300', margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
            You&apos;re all set!
          </h1>
          <p style={{ color: '#888', fontSize: '1rem', lineHeight: 1.6 }}>
            Thanks for filling that in. We&apos;ll review your answers before we speak — 
            no need to explain everything from scratch on the call.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", sans-serif', color: '#fafafa',
    }}>
      {/* Nav */}
      <div style={{
        padding: '1.25rem 2rem', borderBottom: '1px solid #1a1a1a',
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.04em' }}>
          YARN<span style={{ color: '#FF3300' }}>.</span>
        </span>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{
            fontSize: '0.8125rem', fontWeight: 600, color: '#FF3300',
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem',
          }}>
            Quick questions
          </p>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 700,
            letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: '0.75rem',
          }}>
            Tell us about your project
          </h1>
          <p style={{ color: '#888', fontSize: '0.9375rem', lineHeight: 1.5 }}>
            6 quick questions — takes about 2 minutes. Helps us prepare for your consultation.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {QUESTIONS.map((q, i) => (
            <div key={q.id}>
              <label style={{
                display: 'block', fontSize: '0.9375rem', fontWeight: 600,
                color: '#fafafa', marginBottom: '0.625rem', letterSpacing: '-0.01em',
              }}>
                {i + 1}. {q.label}
                {q.required && <span style={{ color: '#FF3300', marginLeft: '0.25rem' }}>*</span>}
              </label>

              {q.type === 'select' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {q.options?.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem',
                        border: `1px solid ${answers[q.id] === opt ? '#FF3300' : '#2d2d2d'}`,
                        backgroundColor: answers[q.id] === opt ? 'rgba(255,51,0,0.1)' : '#111',
                        color: answers[q.id] === opt ? '#FF3300' : '#aaa',
                        cursor: 'pointer', transition: 'all 0.15s', fontWeight: answers[q.id] === opt ? 600 : 400,
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'textarea' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={q.placeholder}
                  rows={4}
                  style={{
                    width: '100%', backgroundColor: '#111', border: '1px solid #2d2d2d',
                    borderRadius: '8px', color: '#fafafa', padding: '0.875rem 1rem',
                    fontSize: '0.9375rem', outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              )}

              {q.type === 'text' && (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={q.placeholder}
                  style={{
                    width: '100%', backgroundColor: '#111', border: '1px solid #2d2d2d',
                    borderRadius: '8px', color: '#fafafa', padding: '0.875rem 1rem',
                    fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              )}
            </div>
          ))}

          {error && (
            <p style={{ color: '#FF3300', fontSize: '0.875rem' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: '#FF3300', color: '#fff',
              padding: '0.875rem 2rem', borderRadius: '8px',
              fontWeight: 600, fontSize: '1rem', border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'opacity 0.15s', width: 'fit-content',
              letterSpacing: '-0.01em',
            }}
          >
            {submitting ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
            ) : (
              'Submit →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
