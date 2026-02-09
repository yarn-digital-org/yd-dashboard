'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Receipt,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  X,
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  notes?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
];

export default function InvoicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as InvoiceItem[],
    tax: 0,
    status: 'draft' as Invoice['status'],
    dueDate: '',
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchInvoices();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [searchQuery, statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: InvoiceItem[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const updateItemAmount = (index: number, item: InvoiceItem) => {
    const amount = item.quantity * item.rate;
    const newItems = [...formData.items];
    newItems[index] = { ...item, amount };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const totals = calculateTotals(formData.items, formData.tax);
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices';
      const method = editingInvoice ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to save invoice');
        return;
      }

      setShowModal(false);
      setEditingInvoice(null);
      resetForm();
      fetchInvoices();
    } catch (err) {
      console.error('Failed to save invoice:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      fetchInvoices();
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

  const openEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      items: invoice.items.length > 0 ? invoice.items : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      tax: invoice.tax || 0,
      status: invoice.status,
      dueDate: invoice.dueDate || '',
      notes: invoice.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      tax: 0,
      status: 'draft',
      dueDate: '',
      notes: '',
    });
  };

  const getStatusStyle = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.color || 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.label || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totals = calculateTotals(formData.items, formData.tax);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading invoices...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-500 text-sm mt-1">
              {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingInvoice(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#FF3300] hover:bg-[#E62E00] text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus size={18} />
            Create Invoice
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>

            {/* Clear Filters */}
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

        {/* Invoices Grid */}
        {invoices.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <Receipt className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
            <p className="text-gray-500 mb-4">Create professional invoices and track payments</p>
            <button
              onClick={() => {
                setEditingInvoice(null);
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#FF3300] hover:bg-[#E62E00] text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Plus size={18} />
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition relative group"
              >
                {/* Actions Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setActiveMenu(activeMenu === invoice.id ? null : invoice.id)}
                    className="p-1 rounded hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={18} className="text-gray-400" />
                  </button>
                  {activeMenu === invoice.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                      <button
                        onClick={() => {
                          openEdit(invoice);
                          setActiveMenu(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(invoice.id);
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

                {/* Invoice Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#FF3300]/10 flex items-center justify-center text-[#FF3300]">
                    <Receipt size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {invoice.clientName}
                    </p>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{invoice.clientEmail}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                      <span>Due: {formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-900 font-semibold">
                    <DollarSign size={14} className="text-gray-400 flex-shrink-0" />
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>

                {/* Created Date */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  Created: {formatDate(invoice.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoice Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Email *
                    </label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                      required
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Line Items
                  </label>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index].description = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItem = { ...item, quantity: parseInt(e.target.value) || 0 };
                            updateItemAmount(index, newItem);
                          }}
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                        />
                        <input
                          type="number"
                          placeholder="Rate"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => {
                            const newItem = { ...item, rate: parseFloat(e.target.value) || 0 };
                            updateItemAmount(index, newItem);
                          }}
                          className="w-28 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                        />
                        <div className="w-28 px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                          {formatCurrency(item.amount)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-gray-400 hover:text-red-500 transition"
                          disabled={formData.items.length === 1}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-2 text-sm text-[#FF3300] hover:text-[#E62E00] font-medium"
                  >
                    + Add Line Item
                  </button>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600">Tax (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border border-gray-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    />
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Invoice['status'] })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {editingInvoice ? 'Save Changes' : 'Create Invoice'}
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
