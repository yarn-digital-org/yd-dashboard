'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Building2, Upload, Link2, Users, Rocket, Check, ChevronRight, ChevronLeft, X, Loader2,
} from 'lucide-react';

interface OnboardingState {
  currentStep: number;
  businessName: string;
  industry: string;
  logoUrl: string;
  contactsImported: boolean;
  googleConnected: boolean;
  emailConnected: boolean;
  teamInvites: string[];
  completed: boolean;
}

const STEPS = [
  { id: 1, title: 'Business Details', icon: Building2, description: 'Tell us about your business' },
  { id: 2, title: 'Import Contacts', icon: Upload, description: 'Bring in your existing contacts' },
  { id: 3, title: 'Connect Apps', icon: Link2, description: 'Link your tools' },
  { id: 4, title: 'Invite Team', icon: Users, description: 'Add team members' },
  { id: 5, title: 'Get Started', icon: Rocket, description: 'You\'re all set!' },
];

const INDUSTRIES = [
  'Agency / Marketing',
  'Consulting',
  'Design / Creative',
  'Development / Tech',
  'E-commerce',
  'Education',
  'Finance / Accounting',
  'Healthcare',
  'Legal',
  'Real Estate',
  'Other',
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    businessName: '',
    industry: '',
    logoUrl: '',
    contactsImported: false,
    googleConnected: false,
    emailConnected: false,
    teamInvites: [''],
    completed: false,
  });
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check auth and load saved progress
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadProgress();
    }
  }, [user, authLoading]);

  const loadProgress = async () => {
    try {
      const res = await fetch('/api/onboarding');
      if (res.ok) {
        const data = await res.json();
        if (data.data?.completed) {
          router.push('/dashboard');
          return;
        }
        if (data.data) {
          setState(prev => ({ ...prev, ...data.data }));
        }
      }
    } catch {}
  };

  const saveProgress = async (updates: Partial<OnboardingState>) => {
    const newState = { ...state, ...updates };
    setState(newState);
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      });
    } catch {}
  };

  const nextStep = () => {
    const next = Math.min(state.currentStep + 1, 5);
    saveProgress({ currentStep: next });
  };

  const prevStep = () => {
    const prev = Math.max(state.currentStep - 1, 1);
    saveProgress({ currentStep: prev });
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, completed: true }),
      });
      router.push('/dashboard');
    } catch {
      setSaving(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setImportStatus('Importing...');
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImportStatus(`Imported ${data.imported || 0} contacts!`);
        saveProgress({ contactsImported: true });
      } else {
        setImportStatus('Import failed. Check CSV format.');
      }
    } catch {
      setImportStatus('Import failed.');
    }
  };

  const addInviteField = () => {
    setState(prev => ({ ...prev, teamInvites: [...prev.teamInvites, ''] }));
  };

  const updateInvite = (index: number, value: string) => {
    setState(prev => {
      const invites = [...prev.teamInvites];
      invites[index] = value;
      return { ...prev, teamInvites: invites };
    });
  };

  const sendInvites = async () => {
    const emails = state.teamInvites.filter(e => e.trim() && e.includes('@'));
    if (emails.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/org/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });
      saveProgress({ teamInvites: emails });
    } catch {}
    setSaving(false);
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 1rem',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '1rem',
    border: '1px solid #E5E7EB',
    padding: '2rem',
    maxWidth: '600px',
    width: '100%',
    marginTop: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  };

  const btnPrimary: React.CSSProperties = {
    backgroundColor: '#FF3300',
    color: '#FFFFFF',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const btnSecondary: React.CSSProperties = {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px', backgroundColor: '#FF3300', borderRadius: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF',
          fontWeight: 700, fontSize: '1.25rem', margin: '0 auto 1rem',
        }}>Y</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
          Welcome to Yarn Digital
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
          Let&apos;s get your workspace set up in a few quick steps
        </p>
      </div>

      {/* Progress Stepper */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '1.5rem',
        maxWidth: '600px', width: '100%', justifyContent: 'center', flexWrap: 'wrap',
      }}>
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = state.currentStep === step.id;
          const isDone = state.currentStep > step.id;
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDone ? '#10B981' : isActive ? '#FF3300' : '#E5E7EB',
                color: isDone || isActive ? '#FFF' : '#9CA3AF',
                fontSize: '0.75rem', fontWeight: 600,
                transition: 'all 0.2s',
              }}>
                {isDone ? <Check size={14} /> : step.id}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: '2rem', height: '2px',
                  backgroundColor: isDone ? '#10B981' : '#E5E7EB',
                  transition: 'background-color 0.2s',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
          {STEPS[state.currentStep - 1].title}
        </h2>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {STEPS[state.currentStep - 1].description}
        </p>

        {/* Step 1: Business Details */}
        {state.currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Business Name
              </label>
              <input
                type="text"
                value={state.businessName}
                onChange={e => setState(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="e.g. Yarn Digital"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Industry
              </label>
              <select
                value={state.industry}
                onChange={e => setState(prev => ({ ...prev, industry: e.target.value }))}
                style={{ ...inputStyle, appearance: 'none' as const }}
              >
                <option value="">Select your industry</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Logo (optional)
              </label>
              <div style={{
                border: '2px dashed #D1D5DB', borderRadius: '0.5rem', padding: '2rem',
                textAlign: 'center', cursor: 'pointer', color: '#6B7280',
              }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} style={{ margin: '0 auto 0.5rem', color: '#9CA3AF' }} />
                <p style={{ fontSize: '0.875rem' }}>Click to upload logo</p>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>PNG, JPG up to 2MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setState(prev => ({ ...prev, logoUrl: URL.createObjectURL(f) }));
                  }}
                />
              </div>
              {state.logoUrl && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={state.logoUrl} alt="Logo preview" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '0.25rem' }} />
                  <span style={{ fontSize: '0.75rem', color: '#10B981' }}>Logo uploaded</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Import Contacts */}
        {state.currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              border: '2px dashed #D1D5DB', borderRadius: '0.5rem', padding: '2rem',
              textAlign: 'center',
            }}>
              <Upload size={32} style={{ margin: '0 auto 0.75rem', color: '#9CA3AF' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Upload CSV file</p>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '1rem' }}>
                Columns: firstName, lastName, email, phone, company
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={e => setCsvFile(e.target.files?.[0] || null)}
                style={{ fontSize: '0.875rem' }}
              />
            </div>
            {csvFile && (
              <button onClick={handleCsvImport} style={btnPrimary}>
                Import {csvFile.name}
              </button>
            )}
            {importStatus && (
              <p style={{ fontSize: '0.875rem', color: importStatus.includes('failed') ? '#EF4444' : '#10B981' }}>
                {importStatus}
              </p>
            )}
            {state.contactsImported && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981' }}>
                <Check size={16} /> Contacts imported!
              </div>
            )}
          </div>
        )}

        {/* Step 3: Connect Apps */}
        {state.currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Google Calendar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#F3F4F6', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                  📅
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>Google Calendar</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Sync events and bookings</div>
                </div>
              </div>
              {state.googleConnected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#10B981', fontSize: '0.875rem' }}>
                  <Check size={16} /> Connected
                </div>
              ) : (
                <a href="/api/auth/google/authorize" style={{ ...btnSecondary, textDecoration: 'none' }}>
                  Connect
                </a>
              )}
            </div>

            {/* Email (Resend) */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#F3F4F6', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                  ✉️
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>Email</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Send emails to contacts</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#10B981', fontSize: '0.875rem' }}>
                <Check size={16} /> Configured
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Invite Team */}
        {state.currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              Enter email addresses of team members you&apos;d like to invite.
            </p>
            {state.teamInvites.map((email, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => updateInvite(i, e.target.value)}
                  placeholder="team@example.com"
                  style={{ ...inputStyle, flex: 1 }}
                />
                {i > 0 && (
                  <button
                    onClick={() => setState(prev => ({
                      ...prev,
                      teamInvites: prev.teamInvites.filter((_, idx) => idx !== i),
                    }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0.5rem' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addInviteField} style={{ ...btnSecondary, alignSelf: 'flex-start' }}>
              + Add another
            </button>
            {state.teamInvites.some(e => e.includes('@')) && (
              <button onClick={sendInvites} disabled={saving} style={btnPrimary}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Send Invitations
              </button>
            )}
          </div>
        )}

        {/* Step 5: Get Started */}
        {state.currentStep === 5 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', backgroundColor: '#ECFDF5', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <Rocket size={28} style={{ color: '#10B981' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
              You&apos;re all set!
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your workspace is ready. Here&apos;s what you can do next:
            </p>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                { label: 'Create your first project', done: false },
                { label: 'Add a contact', done: state.contactsImported },
                { label: 'Set up business details', done: !!state.businessName },
                { label: 'Connect Google Calendar', done: state.googleConnected },
                { label: 'Send your first invoice', done: false },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', backgroundColor: item.done ? '#F0FDF4' : '#F9FAFB',
                  borderRadius: '0.5rem', border: `1px solid ${item.done ? '#BBF7D0' : '#E5E7EB'}`,
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: item.done ? '#10B981' : '#E5E7EB',
                    color: item.done ? '#FFF' : '#9CA3AF',
                  }}>
                    {item.done ? <Check size={12} /> : <span style={{ fontSize: '0.75rem' }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: item.done ? '#065F46' : '#374151', fontWeight: 500 }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: '2rem',
          paddingTop: '1.5rem', borderTop: '1px solid #F3F4F6',
        }}>
          <div>
            {state.currentStep > 1 && (
              <button onClick={prevStep} style={btnSecondary}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {state.currentStep < 5 && state.currentStep > 1 && (
              <button onClick={nextStep} style={btnSecondary}>
                Skip
              </button>
            )}
            {state.currentStep < 5 ? (
              <button onClick={nextStep} style={btnPrimary}>
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleComplete} disabled={saving} style={btnPrimary}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Go to Dashboard <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
