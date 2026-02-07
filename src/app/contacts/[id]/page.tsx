'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { 
  ArrowLeft,
  Mail, 
  Phone, 
  Building2, 
  Globe,
  MapPin,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Briefcase,
  Tag,
  X,
  Plus,
  Instagram,
  Linkedin,
  Twitter,
  ExternalLink,
  Clock
} from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  website?: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  avatarUrl?: string;
  type: 'lead' | 'client' | 'past_client' | 'vendor' | 'other';
  tags: string[];
  customFields: Record<string, any>;
  notes?: string;
  lifetimeValue: number;
  projectCount: number;
  outstandingAmount: number;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TagItem {
  id: string;
  name: string;
  color: string;
}

const TYPE_OPTIONS = [
  { value: 'lead', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
  { value: 'client', label: 'Client', color: 'bg-green-100 text-green-800' },
  { value: 'past_client', label: 'Past Client', color: 'bg-gray-100 text-gray-800' },
  { value: 'vendor', label: 'Vendor', color: 'bg-purple-100 text-purple-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-600' },
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'projects', label: 'Projects', icon: Briefcase },
  { id: 'invoices', label: 'Invoices', icon: DollarSign },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && id) {
      fetchContact();
      fetchTags();
    }
  }, [user, authLoading, id, router]);

  const fetchContact = async () => {
    try {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/contacts');
          return;
        }
        throw new Error('Failed to fetch contact');
      }
      const data = await res.json();
      setContact(data);
      setFormData(data);
    } catch (err) {
      console.error('Failed to fetch contact:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      setTags(data.tags || []);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to update contact');
        return;
      }

      setShowEditModal(false);
      fetchContact();
    } catch (err) {
      console.error('Failed to update contact:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) return;
    
    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      router.push('/contacts');
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  const getTypeStyle = (type: string) => {
    const option = TYPE_OPTIONS.find(o => o.value === type);
    return option?.color || 'bg-gray-100 text-gray-600';
  };

  const getTypeLabel = (type: string) => {
    const option = TYPE_OPTIONS.find(o => o.value === type);
    return option?.label || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatAddress = (address?: Contact['address']) => {
    if (!address) return null;
    const parts = [address.street, address.city, address.state, address.zip, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading contact...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="text-center py-16">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contact not found</h2>
            <Link href="/contacts" className="text-[#FF3300] hover:underline">
              Back to contacts
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Back Button */}
        <Link 
          href="/contacts" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Contacts
        </Link>

        {/* Contact Header */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-[#FF3300]/10 flex items-center justify-center text-[#FF3300] text-2xl font-bold">
                {contact.avatarUrl ? (
                  <img src={contact.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(contact.firstName, contact.lastName)
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {contact.firstName} {contact.lastName}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeStyle(contact.type)}`}>
                    {getTypeLabel(contact.type)}
                  </span>
                </div>
                
                {(contact.jobTitle || contact.company) && (
                  <p className="text-gray-600 mb-2">
                    {contact.jobTitle}{contact.jobTitle && contact.company && ' at '}{contact.company}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    Added {formatDate(contact.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <Tag size={14} className="text-gray-400" />
              {contact.tags.map((tag) => {
                const tagData = tags.find(t => t.name === tag);
                return (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${tagData?.color || '#6B7280'}20`,
                      color: tagData?.color || '#6B7280'
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <DollarSign size={14} />
              Lifetime Value
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(contact.lifetimeValue || 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Briefcase size={14} />
              Projects
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {contact.projectCount || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <FileText size={14} />
              Outstanding
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(contact.outstandingAmount || 0)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-[#FF3300] text-[#FF3300]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400" />
                  <a href={`mailto:${contact.email}`} className="text-[#FF3300] hover:underline">
                    {contact.email}
                  </a>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400" />
                    <a href={`tel:${contact.phone}`} className="text-gray-700">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-3">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="text-gray-700">{contact.company}</span>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-gray-400" />
                    <a 
                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF3300] hover:underline flex items-center gap-1"
                    >
                      {contact.website}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                {formatAddress(contact.address) && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <span className="text-gray-700">{formatAddress(contact.address)}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(contact.socialLinks?.instagram || contact.socialLinks?.linkedin || contact.socialLinks?.twitter) && (
                <>
                  <h4 className="font-medium text-gray-700 mt-6 mb-3">Social</h4>
                  <div className="flex gap-3">
                    {contact.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${contact.socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        <Instagram size={18} className="text-gray-600" />
                      </a>
                    )}
                    {contact.socialLinks.linkedin && (
                      <a
                        href={contact.socialLinks.linkedin.startsWith('http') ? contact.socialLinks.linkedin : `https://linkedin.com/in/${contact.socialLinks.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        <Linkedin size={18} className="text-gray-600" />
                      </a>
                    )}
                    {contact.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${contact.socialLinks.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        <Twitter size={18} className="text-gray-600" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Notes</h3>
              {contact.notes ? (
                <p className="text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
              ) : (
                <p className="text-gray-400 italic">No notes added yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center py-8">
              <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">Projects linked to this contact will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center py-8">
              <DollarSign className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-gray-500 mb-4">Invoices for this contact will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center py-8">
              <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500 mb-4">Conversation history will appear here</p>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <div 
              className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Edit Contact</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type || 'client'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Contact['type'] })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    >
                      {TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.company || ''}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={formData.jobTitle || ''}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="text"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    placeholder="https://example.com"
                  />
                </div>

                {tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            const currentTags = formData.tags || [];
                            const newTags = currentTags.includes(tag.name)
                              ? currentTags.filter(t => t !== tag.name)
                              : [...currentTags, tag.name];
                            setFormData({ ...formData, tags: newTags });
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                            (formData.tags || []).includes(tag.name)
                              ? 'ring-2 ring-offset-1'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
