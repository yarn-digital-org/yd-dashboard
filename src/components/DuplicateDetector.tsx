'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2, CheckCircle, Users, Mail, Phone, User, Merge } from 'lucide-react';

interface DuplicateContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  type: string;
  createdAt: string;
}

interface DuplicateGroup {
  matchType: 'email' | 'phone' | 'name';
  matchValue: string;
  contacts: DuplicateContact[];
}

interface DuplicateDetectorProps {
  onClose: () => void;
  onMergeComplete: () => void;
}

export default function DuplicateDetector({ onClose, onMergeComplete }: DuplicateDetectorProps) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchTypes, setMatchTypes] = useState<string[]>(['email', 'phone', 'name']);

  useEffect(() => {
    fetchDuplicates();
  }, [matchTypes]);

  const fetchDuplicates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/contacts/duplicates?matchTypes=${matchTypes.join(',')}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch duplicates');
      }
      
      setGroups(data.groups);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedGroup || !primaryId) return;
    
    const mergeIds = selectedGroup.contacts
      .filter(c => c.id !== primaryId)
      .map(c => c.id);
    
    if (mergeIds.length === 0) return;
    
    setMerging(true);
    setError(null);
    
    try {
      const res = await fetch('/api/contacts/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId, mergeIds })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to merge contacts');
      }
      
      // Remove merged group and refresh
      setGroups(groups.filter(g => g !== selectedGroup));
      setSelectedGroup(null);
      setPrimaryId(null);
      onMergeComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMerging(false);
    }
  };

  const getMatchIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail size={16} className="text-blue-500" />;
      case 'phone': return <Phone size={16} className="text-green-500" />;
      case 'name': return <User size={16} className="text-purple-500" />;
      default: return null;
    }
  };

  const getMatchLabel = (type: string) => {
    switch (type) {
      case 'email': return 'Same Email';
      case 'phone': return 'Same Phone';
      case 'name': return 'Same Name';
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="text-[#FF3300]" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Duplicate Detection</h2>
              <p className="text-sm text-gray-500">
                Find and merge duplicate contacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Match Type Filters */}
        <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
          <span className="text-sm text-gray-600">Match by:</span>
          {['email', 'phone', 'name'].map(type => (
            <label key={type} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={matchTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setMatchTypes([...matchTypes, type]);
                  } else {
                    setMatchTypes(matchTypes.filter(t => t !== type));
                  }
                }}
                className="rounded border-gray-300 text-[#FF3300] focus:ring-[#FF3300]"
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
          <button
            onClick={fetchDuplicates}
            className="ml-auto text-sm text-[#FF3300] hover:underline"
          >
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="text-[#FF3300] animate-spin" size={48} />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h3>
              <p className="text-gray-500 text-center">
                Your contacts are clean! No potential duplicates were detected.
              </p>
            </div>
          ) : (
            <>
              {/* Groups List */}
              <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Found <strong>{groups.length}</strong> potential duplicate groups
                  </p>
                  
                  <div className="space-y-2">
                    {groups.map((group, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedGroup(group);
                          setPrimaryId(group.contacts[0]?.id || null);
                        }}
                        className={`w-full text-left p-4 rounded-lg border transition ${
                          selectedGroup === group
                            ? 'border-[#FF3300] bg-[#FF3300]/5'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getMatchIcon(group.matchType)}
                          <span className="text-xs font-medium text-gray-500">
                            {getMatchLabel(group.matchType)}
                          </span>
                          <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                            {group.contacts.length} contacts
                          </span>
                        </div>
                        <div className="font-medium text-gray-900 truncate">
                          {group.matchValue}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {group.contacts.map(c => `${c.firstName} ${c.lastName}`).join(', ')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Group Detail */}
              <div className="w-1/2 overflow-y-auto">
                {selectedGroup ? (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      {getMatchIcon(selectedGroup.matchType)}
                      <span className="font-medium text-gray-700">
                        {getMatchLabel(selectedGroup.matchType)}: {selectedGroup.matchValue}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      Select the primary contact to keep. Other contacts will be merged into it.
                    </p>

                    <div className="space-y-3">
                      {selectedGroup.contacts.map(contact => (
                        <div
                          key={contact.id}
                          onClick={() => setPrimaryId(contact.id)}
                          className={`p-4 rounded-lg border cursor-pointer transition ${
                            primaryId === contact.id
                              ? 'border-[#FF3300] bg-[#FF3300]/5 ring-2 ring-[#FF3300]/20'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {contact.firstName} {contact.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{contact.email}</div>
                              {contact.phone && (
                                <div className="text-sm text-gray-500">{contact.phone}</div>
                              )}
                              {contact.company && (
                                <div className="text-sm text-gray-500">{contact.company}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                contact.type === 'client' ? 'bg-green-100 text-green-800' :
                                contact.type === 'lead' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {contact.type}
                              </span>
                              <div className="text-xs text-gray-400 mt-1">
                                Added {formatDate(contact.createdAt)}
                              </div>
                            </div>
                          </div>
                          {primaryId === contact.id && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-[#FF3300] font-medium">
                              <CheckCircle size={14} />
                              Primary contact (will be kept)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleMerge}
                      disabled={merging || !primaryId}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {merging ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Merging...
                        </>
                      ) : (
                        <>
                          <Merge size={18} />
                          Merge {selectedGroup.contacts.length - 1} into Primary
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Select a duplicate group to review
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
