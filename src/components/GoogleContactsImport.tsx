'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2, Users, Mail, Building2, ArrowRight, ExternalLink } from 'lucide-react';

interface GoogleContact {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  selected?: boolean;
}

interface GoogleContactsImportProps {
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'loading' | 'preview' | 'importing' | 'complete' | 'error';

export default function GoogleContactsImport({ onClose, onComplete }: GoogleContactsImportProps) {
  const [step, setStep] = useState<Step>('loading');
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [selectedAll, setSelectedAll] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; duplicates: string[] } | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts/import-google');
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'NOT_CONNECTED' || data.code === 'SCOPE_MISSING') {
          setNeedsReconnect(true);
          setError(data.error);
          setStep('error');
          return;
        }
        throw new Error(data.error || 'Failed to fetch contacts');
      }

      setContacts(data.contacts.map((c: GoogleContact) => ({ ...c, selected: true })));
      setStep('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Google Contacts');
      setStep('error');
    }
  };

  const toggleContact = (index: number) => {
    setContacts(prev => prev.map((c, i) => i === index ? { ...c, selected: !c.selected } : c));
  };

  const toggleAll = () => {
    const newState = !selectedAll;
    setSelectedAll(newState);
    setContacts(prev => prev.map(c => ({ ...c, selected: newState })));
  };

  const selectedCount = contacts.filter(c => c.selected).length;

  const handleImport = async () => {
    const selected = contacts.filter(c => c.selected);
    if (selected.length === 0) return;

    setStep('importing');
    try {
      const res = await fetch('/api/contacts/import-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: selected, skipDuplicates }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setResult(data);
      setStep('complete');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Import from Google</h2>
              <p className="text-sm text-gray-500">
                {step === 'loading' && 'Fetching your contacts...'}
                {step === 'preview' && `${contacts.length} contacts found`}
                {step === 'importing' && 'Importing...'}
                {step === 'complete' && 'Import complete'}
                {step === 'error' && 'Something went wrong'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'loading' && (
            <div className="text-center py-16">
              <Loader2 className="mx-auto text-blue-500 animate-spin mb-4" size={40} />
              <p className="text-gray-500">Fetching contacts from Google...</p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-red-400 mb-4" size={40} />
              <p className="text-gray-700 font-medium mb-2">{error}</p>
              {needsReconnect && (
                <a
                  href="/api/auth/google/authorize"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Reconnect Google <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}

          {step === 'preview' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedAll}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-[#FF3300]"
                  />
                  Select all ({contacts.length})
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={e => setSkipDuplicates(e.target.checked)}
                    className="rounded border-gray-300 text-[#FF3300]"
                  />
                  Skip duplicates
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {contacts.map((contact, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${!contact.selected ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={contact.selected}
                      onChange={() => toggleContact(i)}
                      className="rounded border-gray-300 text-[#FF3300] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {contact.firstName} {contact.lastName}
                        </span>
                        {contact.company && (
                          <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                            <Building2 size={10} /> {contact.company}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail size={10} /> {contact.email}
                        </span>
                        {contact.phone && (
                          <span className="text-xs text-gray-400">{contact.phone}</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
                {contacts.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No contacts with email addresses found in your Google account.
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'importing' && (
            <div className="text-center py-16">
              <Loader2 className="mx-auto text-[#FF3300] animate-spin mb-4" size={40} />
              <p className="text-gray-700 font-medium">Importing {selectedCount} contacts...</p>
            </div>
          )}

          {step === 'complete' && result && (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-green-600" size={28} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Complete!</h3>
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xl font-bold text-green-600">{result.imported}</div>
                  <div className="text-xs text-green-700">Imported</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-xl font-bold text-yellow-600">{result.duplicates.length}</div>
                  <div className="text-xs text-yellow-700">Duplicates</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xl font-bold text-gray-600">{result.skipped}</div>
                  <div className="text-xs text-gray-700">Skipped</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 p-5 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm">
            {step === 'complete' ? 'Close' : 'Cancel'}
          </button>
          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium text-sm disabled:opacity-50"
            >
              Import {selectedCount} Contacts <ArrowRight size={14} />
            </button>
          )}
          {step === 'complete' && (
            <button
              onClick={() => { onComplete(); onClose(); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium text-sm"
            >
              View Contacts <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
