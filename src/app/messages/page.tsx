'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import {
  MessageSquare, Send, Search, Plus, MoreVertical,
  ChevronDown, FileText, Clock, Check, CheckCheck,
  Trash2, BellOff, Bell, X, User
} from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

interface Conversation {
  id: string;
  contactId: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  isMuted: boolean;
  contact: Contact | null;
}

interface Message {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  channel: 'email' | 'live_chat';
  subject?: string;
  body: string;
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  subject?: string;
  body: string;
  category?: string;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [showConvMenu, setShowConvMenu] = useState<string | null>(null);
  const [messageChannel, setMessageChannel] = useState<'live_chat' | 'email'>('live_chat');
  const [emailSubject, setEmailSubject] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchConversations();
      fetchTemplates();
      fetchContacts();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      const data = await res.json();
      setConversations(data.data || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages/conversations/${convId}/messages`);
      const data = await res.json();
      setMessages(data.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/messages/templates');
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setContacts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    fetchMessages(conv.id);
    // Mark as read
    if (conv.unreadCount > 0) {
      fetch(`/api/messages/conversations/${conv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unreadCount: 0 }),
      });
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
      );
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: messageInput.trim(),
          channel: messageChannel,
          ...(messageChannel === 'email' && emailSubject ? { subject: emailSubject } : {}),
        }),
      });
      const data = await res.json();
      if (data.data) {
        setMessages(prev => [...prev, data.data]);
        setMessageInput('');
        // Update conversation preview
        setConversations(prev =>
          prev.map(c =>
            c.id === selectedConv.id
              ? { ...c, lastMessagePreview: messageInput.trim().substring(0, 100), lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const createConversation = async (contactId: string) => {
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (data.data) {
        setShowNewConv(false);
        setContactSearch('');
        await fetchConversations();
        const conv = { ...data.data, contact: contacts.find(c => c.id === contactId) || null };
        selectConversation(conv);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const deleteConversation = async (convId: string) => {
    if (!confirm('Delete this conversation and all messages?')) return;
    try {
      await fetch(`/api/messages/conversations/${convId}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (selectedConv?.id === convId) {
        setSelectedConv(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const toggleMute = async (conv: Conversation) => {
    try {
      await fetch(`/api/messages/conversations/${conv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMuted: !conv.isMuted }),
      });
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, isMuted: !c.isMuted } : c)
      );
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  const insertTemplate = (template: Template) => {
    setMessageInput(prev => prev + template.body);
    setShowTemplates(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getContactName = (conv: Conversation) => {
    if (conv.contact) {
      return `${conv.contact.firstName} ${conv.contact.lastName}`.trim();
    }
    return 'Unknown Contact';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return <CheckCheck size={14} style={{ color: '#3B82F6' }} />;
      case 'delivered': return <CheckCheck size={14} style={{ color: '#9CA3AF' }} />;
      case 'sent': return <Check size={14} style={{ color: '#9CA3AF' }} />;
      case 'failed': return <X size={14} style={{ color: '#EF4444' }} />;
      default: return null;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = getContactName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase()) ||
      conv.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredContacts = contacts.filter(c => {
    if (!contactSearch) return true;
    const name = `${c.firstName} ${c.lastName} ${c.email} ${c.company || ''}`.toLowerCase();
    return name.includes(contactSearch.toLowerCase());
  });

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Messages</h1>
              {!isMobile && <p style={{ color: '#6B7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>}
            </div>
            <button
              onClick={() => setShowNewConv(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', backgroundColor: '#FF3300', color: '#FFFFFF',
                border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem',
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <Plus size={16} />
              {isMobile ? 'New' : 'New Conversation'}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Conversation List */}
          <div style={{
            width: isMobile ? '100%' : '360px',
            borderRight: isMobile ? 'none' : '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            display: (isMobile && selectedConv) ? 'none' : 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}>
            {/* Search */}
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.75rem', backgroundColor: '#F9FAFB',
                borderRadius: '0.5rem', border: '1px solid #E5E7EB',
              }}>
                <Search size={16} style={{ color: '#9CA3AF' }} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent',
                    fontSize: '0.875rem', color: '#111827',
                  }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <MessageSquare size={48} style={{ color: '#D1D5DB', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.875rem 1rem', cursor: 'pointer',
                      backgroundColor: selectedConv?.id === conv.id ? '#FFF5F2' : 'transparent',
                      borderBottom: '1px solid #F3F4F6',
                      borderLeft: selectedConv?.id === conv.id ? '3px solid #FF3300' : '3px solid transparent',
                      position: 'relative',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = selectedConv?.id === conv.id ? '#FFF5F2' : '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = selectedConv?.id === conv.id ? '#FFF5F2' : 'transparent')}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      backgroundColor: '#FF3300', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#FFFFFF', fontWeight: 600,
                      fontSize: '0.875rem', flexShrink: 0,
                    }}>
                      {conv.contact
                        ? `${conv.contact.firstName?.[0] || ''}${conv.contact.lastName?.[0] || ''}`
                        : '?'}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontWeight: conv.unreadCount > 0 ? 700 : 500,
                          fontSize: '0.875rem', color: '#111827',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {getContactName(conv)}
                          {conv.isMuted && <BellOff size={12} style={{ marginLeft: '4px', color: '#9CA3AF', display: 'inline' }} />}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#9CA3AF', flexShrink: 0 }}>
                          {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{
                          fontSize: '0.8125rem',
                          color: conv.unreadCount > 0 ? '#374151' : '#9CA3AF',
                          fontWeight: conv.unreadCount > 0 ? 500 : 400,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {conv.lastMessagePreview || 'No messages yet'}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span style={{
                            backgroundColor: '#FF3300', color: '#FFFFFF', fontSize: '0.6875rem',
                            fontWeight: 700, borderRadius: '9999px', padding: '1px 6px',
                            minWidth: '18px', textAlign: 'center', flexShrink: 0,
                          }}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Menu */}
                    <div
                      onClick={e => { e.stopPropagation(); setShowConvMenu(showConvMenu === conv.id ? null : conv.id); }}
                      style={{ cursor: 'pointer', padding: '4px', borderRadius: '4px', flexShrink: 0 }}
                    >
                      <MoreVertical size={16} style={{ color: '#9CA3AF' }} />
                    </div>

                    {showConvMenu === conv.id && (
                      <div style={{
                        position: 'absolute', right: '12px', top: '48px', zIndex: 50,
                        backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        overflow: 'hidden', minWidth: '160px',
                      }}>
                        <button
                          onClick={e => { e.stopPropagation(); toggleMute(conv); setShowConvMenu(null); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.75rem', width: '100%', border: 'none',
                            backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.8125rem',
                            color: '#374151',
                          }}
                        >
                          {conv.isMuted ? <Bell size={14} /> : <BellOff size={14} />}
                          {conv.isMuted ? 'Unmute' : 'Mute'}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteConversation(conv.id); setShowConvMenu(null); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.75rem', width: '100%', border: 'none',
                            backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.8125rem',
                            color: '#EF4444',
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div style={{
            flex: 1,
            display: (isMobile && !selectedConv) ? 'none' : 'flex',
            flexDirection: 'column',
            backgroundColor: '#F9FAFB',
          }}>
            {!selectedConv ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: '2rem',
              }}>
                <div style={{
                  width: '80px', height: '80px', backgroundColor: '#FFF5F2',
                  borderRadius: '1.25rem', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: '1.5rem',
                }}>
                  <MessageSquare size={40} style={{ color: '#FF3300' }} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>
                  Select a conversation
                </h2>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', textAlign: 'center', maxWidth: '300px' }}>
                  Choose a conversation from the left panel or start a new one to begin messaging.
                </p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div style={{
                  padding: '0.875rem 1.25rem', backgroundColor: '#FFFFFF',
                  borderBottom: '1px solid #E5E7EB', display: 'flex',
                  alignItems: 'center', gap: '0.75rem',
                }}>
                  {/* Mobile back button */}
                  {isMobile && (
                    <button
                      onClick={() => { setSelectedConv(null); setMessages([]); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '0.5rem', color: '#6B7280', display: 'flex',
                        alignItems: 'center', flexShrink: 0,
                      }}
                    >
                      ← 
                    </button>
                  )}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: '#FF3300', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#FFFFFF', fontWeight: 600,
                    fontSize: '0.8125rem',
                  }}>
                    {selectedConv.contact
                      ? `${selectedConv.contact.firstName?.[0] || ''}${selectedConv.contact.lastName?.[0] || ''}`
                      : '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                      {getContactName(selectedConv)}
                    </div>
                    {selectedConv.contact?.email && (
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                        {selectedConv.contact.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                  {messagesLoading ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem' }}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem' }}>
                      <p style={{ fontSize: '0.875rem' }}>No messages yet. Send the first message below.</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <div style={{
                          maxWidth: isMobile ? '85%' : '70%', padding: '0.625rem 0.875rem',
                          borderRadius: msg.direction === 'outbound'
                            ? '1rem 1rem 0.25rem 1rem'
                            : '1rem 1rem 1rem 0.25rem',
                          backgroundColor: msg.direction === 'outbound' ? '#FF3300' : '#FFFFFF',
                          color: msg.direction === 'outbound' ? '#FFFFFF' : '#111827',
                          boxShadow: msg.direction === 'outbound' ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                          border: msg.direction === 'outbound' ? 'none' : '1px solid #E5E7EB',
                        }}>
                          {msg.subject && (
                            <div style={{
                              fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem',
                              opacity: msg.direction === 'outbound' ? 0.9 : 1,
                            }}>
                              {msg.subject}
                            </div>
                          )}
                          <div style={{ fontSize: '0.875rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {msg.body}
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                            gap: '4px', marginTop: '4px',
                          }}>
                            {msg.channel === 'email' && (
                              <span style={{ fontSize: '0.625rem', opacity: 0.7 }}>✉️</span>
                            )}
                            <span style={{
                              fontSize: '0.6875rem',
                              opacity: msg.direction === 'outbound' ? 0.75 : 0.5,
                            }}>
                              {msg.createdAt ? formatTime(msg.createdAt) : ''}
                            </span>
                            {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose */}
                <div style={{
                  padding: '0.875rem 1.25rem', backgroundColor: '#FFFFFF',
                  borderTop: '1px solid #E5E7EB',
                }}>
                  {/* Channel selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{
                      display: 'inline-flex', borderRadius: '0.375rem', border: '1px solid #E5E7EB',
                      overflow: 'hidden', fontSize: '0.75rem',
                    }}>
                      <button
                        onClick={() => setMessageChannel('live_chat')}
                        style={{
                          padding: '0.25rem 0.625rem', border: 'none', cursor: 'pointer',
                          backgroundColor: messageChannel === 'live_chat' ? '#FF3300' : '#FFFFFF',
                          color: messageChannel === 'live_chat' ? '#FFFFFF' : '#6B7280',
                          fontWeight: 500,
                        }}
                      >
                        💬 Chat
                      </button>
                      <button
                        onClick={() => setMessageChannel('email')}
                        style={{
                          padding: '0.25rem 0.625rem', border: 'none', cursor: 'pointer',
                          borderLeft: '1px solid #E5E7EB',
                          backgroundColor: messageChannel === 'email' ? '#FF3300' : '#FFFFFF',
                          color: messageChannel === 'email' ? '#FFFFFF' : '#6B7280',
                          fontWeight: 500,
                        }}
                      >
                        ✉️ Email
                      </button>
                    </div>
                    {messageChannel === 'email' && selectedConv?.contact?.email && (
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                        to: {selectedConv.contact.email}
                      </span>
                    )}
                  </div>

                  {/* Email subject line */}
                  {messageChannel === 'email' && (
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '0.5rem',
                        outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  )}

                  {/* Template dropdown */}
                  <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#6B7280',
                        backgroundColor: 'transparent', border: '1px solid #E5E7EB',
                        borderRadius: '0.375rem', cursor: 'pointer',
                      }}
                    >
                      <FileText size={12} />
                      Templates
                      <ChevronDown size={12} />
                    </button>
                    {showTemplates && templates.length > 0 && (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: 0, marginBottom: '4px',
                        backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        maxHeight: '200px', overflowY: 'auto', minWidth: '250px', zIndex: 50,
                      }}>
                        {templates.map(tmpl => (
                          <button
                            key={tmpl.id}
                            onClick={() => insertTemplate(tmpl)}
                            style={{
                              display: 'block', width: '100%', padding: '0.5rem 0.75rem',
                              border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                              textAlign: 'left', borderBottom: '1px solid #F3F4F6',
                            }}
                          >
                            <div style={{ fontWeight: 500, fontSize: '0.8125rem', color: '#111827' }}>
                              {tmpl.name}
                            </div>
                            <div style={{
                              fontSize: '0.75rem', color: '#9CA3AF',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {tmpl.body.substring(0, 60)}...
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <textarea
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                      rows={2}
                      style={{
                        flex: 1, padding: '0.625rem 0.875rem', border: '1px solid #E5E7EB',
                        borderRadius: '0.75rem', fontSize: '0.875rem', resize: 'none',
                        outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sending}
                      style={{
                        padding: '0.625rem', backgroundColor: messageInput.trim() ? '#FF3300' : '#E5E7EB',
                        color: messageInput.trim() ? '#FFFFFF' : '#9CA3AF',
                        border: 'none', borderRadius: '0.75rem', cursor: messageInput.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* New Conversation Modal */}
        {showNewConv && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
            onClick={() => setShowNewConv(false)}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF', borderRadius: '0.75rem',
                width: isMobile ? '95vw' : '420px', maxHeight: isMobile ? '85vh' : '500px',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{
                padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', color: '#111827', margin: 0 }}>
                  New Conversation
                </h3>
                <button
                  onClick={() => setShowNewConv(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.75rem', backgroundColor: '#F9FAFB',
                  borderRadius: '0.5rem', border: '1px solid #E5E7EB',
                }}>
                  <Search size={16} style={{ color: '#9CA3AF' }} />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '340px' }}>
                {filteredContacts.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
                    {contacts.length === 0 ? 'No contacts found. Add contacts first.' : 'No matching contacts'}
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => createConversation(contact.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1.25rem', width: '100%', border: 'none',
                        backgroundColor: 'transparent', cursor: 'pointer',
                        borderBottom: '1px solid #F3F4F6', textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        backgroundColor: '#FF3300', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#FFFFFF', fontWeight: 600,
                        fontSize: '0.8125rem', flexShrink: 0,
                      }}>
                        {contact.firstName?.[0]}{contact.lastName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827' }}>
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                          {contact.email}
                          {contact.company && ` · ${contact.company}`}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
