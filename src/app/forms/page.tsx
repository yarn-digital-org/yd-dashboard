'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { 
  FormInput, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  X,
  GripVertical,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Mail,
  Phone,
  Type,
  AlignLeft,
  List,
  CheckSquare
} from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Form {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  status: 'active' | 'inactive';
  submissionCount: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface Submission {
  id: string;
  formId: string;
  formName: string;
  data: Record<string, any>;
  submittedAt: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'textarea', label: 'Textarea', icon: AlignLeft },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'date', label: 'Date', icon: Calendar },
];

export default function FormsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showSubmissions, setShowSubmissions] = useState<{ form: Form; submissions: Submission[] } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [] as FormField[],
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchForms();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [searchQuery, statusFilter]);

  const fetchForms = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/forms?${params.toString()}`);
      const data = await res.json();
      setForms(data.forms || []);
    } catch (err) {
      console.error('Failed to fetch forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.fields.length === 0) {
      alert('Please add at least one field to your form');
      return;
    }

    try {
      const url = editingForm ? `/api/forms/${editingForm.id}` : '/api/forms';
      const method = editingForm ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id || '',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to save form');
        return;
      }

      setShowModal(false);
      setEditingForm(null);
      resetForm();
      fetchForms();
    } catch (err) {
      console.error('Failed to save form:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? All submissions will also be deleted.')) return;
    
    try {
      await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      fetchForms();
    } catch (err) {
      console.error('Failed to delete form:', err);
    }
  };

  const handleToggleStatus = async (form: Form) => {
    try {
      const newStatus = form.status === 'active' ? 'inactive' : 'active';
      await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchForms();
    } catch (err) {
      console.error('Failed to toggle form status:', err);
    }
  };

  const viewSubmissions = async (form: Form) => {
    try {
      const res = await fetch(`/api/forms/${form.id}/submissions`);
      const data = await res.json();
      setShowSubmissions({ form, submissions: data.submissions || [] });
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  };

  const deleteSubmission = async (formId: string, submissionId: string) => {
    if (!confirm('Delete this submission?')) return;
    try {
      await fetch(`/api/forms/${formId}/submissions?submissionId=${submissionId}`, { method: 'DELETE' });
      if (showSubmissions) {
        viewSubmissions(showSubmissions.form);
      }
    } catch (err) {
      console.error('Failed to delete submission:', err);
    }
  };

  const openEdit = (form: Form) => {
    setEditingForm(form);
    setFormData({
      name: form.name,
      description: form.description,
      fields: form.fields,
      status: form.status,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      fields: [],
      status: 'active',
    });
  };

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
    };
    setFormData({ ...formData, fields: [...formData.fields, newField] });
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index: number) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= formData.fields.length) return;
    const newFields = [...formData.fields];
    const [removed] = newFields.splice(from, 1);
    newFields.splice(to, 0, removed);
    setFormData({ ...formData, fields: newFields });
  };

  const copyEmbedCode = (form: Form) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const embedUrl = `${baseUrl}/embed/forms/${form.id}`;
    navigator.clipboard.writeText(embedUrl);
    alert('Embed URL copied to clipboard!');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFieldIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find(f => f.value === type);
    return fieldType?.icon || Type;
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading forms...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Forms</h1>
            <p className="text-gray-500 text-sm mt-1">
              Create and manage intake forms for leads and clients
            </p>
          </div>
          <button
            onClick={() => {
              setEditingForm(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#FF3300] hover:bg-[#E62E00] text-white px-4 py-2 min-h-[44px] rounded-lg font-medium transition w-full sm:w-auto"
          >
            <Plus size={18} />
            Create Form
          </button>
        </div>

        {/* Search and Filters */}
        {forms.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Forms Grid */}
        {forms.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <FormInput className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
            <p className="text-gray-500 mb-4">Create custom forms to capture leads, collect project briefs, and gather client information.</p>
            <button
              onClick={() => {
                setEditingForm(null);
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#FF3300] hover:bg-[#E62E00] text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Plus size={18} />
              Create Your First Form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition relative group"
              >
                {/* Actions Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setActiveMenu(activeMenu === form.id ? null : form.id)}
                    className="p-1 rounded hover:bg-gray-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <MoreVertical size={18} className="text-gray-400" />
                  </button>
                  {activeMenu === form.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
                      <button
                        onClick={() => {
                          viewSubmissions(form);
                          setActiveMenu(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                      >
                        <Eye size={14} />
                        View Submissions
                      </button>
                      <button
                        onClick={() => {
                          openEdit(form);
                          setActiveMenu(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                      >
                        <Edit size={14} />
                        Edit Form
                      </button>
                      <button
                        onClick={() => {
                          copyEmbedCode(form);
                          setActiveMenu(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                      >
                        <Copy size={14} />
                        Copy Embed URL
                      </button>
                      <button
                        onClick={() => {
                          handleToggleStatus(form);
                          setActiveMenu(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                      >
                        {form.status === 'active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {form.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(form.id);
                          setActiveMenu(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Form Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FF3300]/10 flex items-center justify-center">
                    <FileText className="text-[#FF3300]" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{form.name}</h3>
                    {form.description && (
                      <p className="text-sm text-gray-500 truncate">{form.description}</p>
                    )}
                  </div>
                </div>

                {/* Form Info */}
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      form.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {form.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>{form.submissionCount || 0} submission{form.submissionCount !== 1 ? 's' : ''}</span>
                  <span>Created {formatDate(form.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="bg-white rounded-none sm:rounded-xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingForm ? 'Edit Form' : 'Create Form'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Form Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Form Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                      placeholder="e.g., Contact Form, Project Brief"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                      placeholder="Brief description of this form's purpose"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Form Fields Builder */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Form Fields *
                    </label>
                    <button
                      type="button"
                      onClick={addField}
                      className="text-sm text-[#FF3300] hover:text-[#E62E00] font-medium flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add Field
                    </button>
                  </div>

                  {formData.fields.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                      <Type className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-gray-500 text-sm">No fields yet. Click &ldquo;Add Field&rdquo; to start building your form.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.fields.map((field, index) => {
                        const FieldIcon = getFieldIcon(field.type);
                        return (
                          <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col gap-1 pt-2">
                                <button
                                  type="button"
                                  onClick={() => moveField(index, index - 1)}
                                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                                  disabled={index === 0}
                                >
                                  <ChevronDown size={14} className="rotate-180" />
                                </button>
                                <GripVertical size={14} className="text-gray-300" />
                                <button
                                  type="button"
                                  onClick={() => moveField(index, index + 1)}
                                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                                  disabled={index === formData.fields.length - 1}
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>

                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                                    <input
                                      type="text"
                                      value={field.label}
                                      onChange={(e) => updateField(index, { label: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                                      placeholder="Field label"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                                    <select
                                      value={field.type}
                                      onChange={(e) => updateField(index, { type: e.target.value as FormField['type'] })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                                    >
                                      {FIELD_TYPES.map(ft => (
                                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
                                    <input
                                      type="text"
                                      value={field.placeholder || ''}
                                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                                      placeholder="Placeholder text"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateField(index, { required: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-[#FF3300] focus:ring-[#FF3300]"
                                      />
                                      <span className="text-sm text-gray-600">Required</span>
                                    </label>
                                  </div>
                                </div>

                                {field.type === 'select' && (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Options (one per line)</label>
                                    <textarea
                                      value={(field.options || []).join('\n')}
                                      onChange={(e) => updateField(index, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                                      rows={3}
                                    />
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => removeField(index)}
                                className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium transition"
                  >
                    {editingForm ? 'Save Changes' : 'Create Form'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submissions Modal */}
        {showSubmissions && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSubmissions(null)}
          >
            <div 
              className="bg-white rounded-none sm:rounded-xl w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Submissions: {showSubmissions.form.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {showSubmissions.submissions.length} submission{showSubmissions.submissions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmissions(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {showSubmissions.submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-gray-300 mb-2" size={48} />
                    <p className="text-gray-500">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {showSubmissions.submissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs text-gray-500">
                            Submitted {formatDate(submission.submittedAt)}
                          </span>
                          <button
                            onClick={() => deleteSubmission(showSubmissions.form.id, submission.id)}
                            className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {showSubmissions.form.fields.map((field) => (
                            <div key={field.id} className="text-sm">
                              <span className="font-medium text-gray-700">{field.label}: </span>
                              <span className="text-gray-600">
                                {field.type === 'checkbox' 
                                  ? (submission.data[field.id] ? 'Yes' : 'No')
                                  : submission.data[field.id] || '-'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
