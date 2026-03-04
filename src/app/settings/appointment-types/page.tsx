'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  X,
  Video,
} from 'lucide-react';

interface CustomQuestion {
  id: string;
  question: string;
  required: boolean;
  type: 'short_text' | 'long_text' | 'email' | 'phone';
}

interface AppointmentType {
  id: string;
  name: string;
  durationMinutes: number;
  description?: string;
  color?: string;
  bufferMinutes?: number;
  addGoogleMeet?: boolean;
  customQuestions?: CustomQuestion[];
  isActive: boolean;
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
];

const COLOR_OPTIONS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
];

export default function AppointmentTypesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: 30,
    description: '',
    color: '#3B82F6',
    bufferMinutes: 0,
    addGoogleMeet: false,
    customQuestions: [] as CustomQuestion[],
    isActive: true,
  });

  useEffect(() => {
    fetchAppointmentTypes();
  }, []);

  const fetchAppointmentTypes = async () => {
    try {
      const res = await fetch('/api/appointment-types');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAppointmentTypes(data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch appointment types:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      durationMinutes: 30,
      description: '',
      color: '#3B82F6',
      bufferMinutes: 0,
      addGoogleMeet: false,
      customQuestions: [],
      isActive: true,
    });
    setEditingType(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (type: AppointmentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      durationMinutes: type.durationMinutes,
      description: type.description || '',
      color: type.color || '#3B82F6',
      bufferMinutes: type.bufferMinutes || 0,
      addGoogleMeet: type.addGoogleMeet || false,
      customQuestions: type.customQuestions || [],
      isActive: type.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editingType
        ? `/api/appointment-types/${editingType.id}`
        : '/api/appointment-types';
      const method = editingType ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: editingType ? 'Appointment type updated' : 'Appointment type created',
        });
        setShowModal(false);
        resetForm();
        fetchAppointmentTypes();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save appointment type' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save appointment type' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment type?')) return;

    try {
      const res = await fetch(`/api/appointment-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Appointment type deleted' });
        fetchAppointmentTypes();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete appointment type' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete appointment type' });
    }
  };

  const addCustomQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      customQuestions: [
        ...prev.customQuestions,
        {
          id: `q${Date.now()}`,
          question: '',
          required: false,
          type: 'short_text',
        },
      ],
    }));
  };

  const updateCustomQuestion = (
    id: string,
    field: keyof CustomQuestion,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  const removeCustomQuestion = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.filter((q) => q.id !== id),
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Appointment Types
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure the types of appointments clients can book
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Type
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mx-6 mt-4 flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* List */}
        <div className="p-6">
          {appointmentTypes.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No appointment types yet</p>
              <button
                onClick={openCreateModal}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Create your first appointment type
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {appointmentTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color || '#3B82F6' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{type.name}</h3>
                      {!type.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                      {type.addGoogleMeet && (
                        <Video className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {type.durationMinutes} min
                      {type.bufferMinutes ? ` + ${type.bufferMinutes} min buffer` : ''}
                    </p>
                    {type.description && (
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    )}
                    {type.customQuestions && type.customQuestions.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {type.customQuestions.length} custom question(s)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(type)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingType ? 'Edit Appointment Type' : 'New Appointment Type'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Discovery Call, Strategy Session"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration *
                </label>
                <select
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationMinutes: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this appointment type"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Buffer Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buffer Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  step="5"
                  value={formData.bufferMinutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bufferMinutes: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Extra time before or after appointments
                </p>
              </div>

              {/* Google Meet */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="addGoogleMeet"
                  checked={formData.addGoogleMeet}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, addGoogleMeet: e.target.checked }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="addGoogleMeet" className="text-sm text-gray-700">
                  Automatically add Google Meet link
                </label>
              </div>

              {/* Custom Questions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Questions
                  </label>
                  <button
                    type="button"
                    onClick={addCustomQuestion}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.customQuestions.map((q) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) =>
                            updateCustomQuestion(q.id, 'question', e.target.value)
                          }
                          placeholder="Question text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomQuestion(q.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={q.type}
                          onChange={(e) =>
                            updateCustomQuestion(q.id, 'type', e.target.value)
                          }
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="short_text">Short Text</option>
                          <option value="long_text">Long Text</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) =>
                              updateCustomQuestion(q.id, 'required', e.target.checked)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          Required
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (available for booking)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
