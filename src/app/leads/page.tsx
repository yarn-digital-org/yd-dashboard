'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: string;
  source: string;
  notes: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
const SOURCE_OPTIONS = ['direct', 'referral', 'website', 'social', 'ads', 'other'];

export default function LeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', company: '', phone: '', status: 'new', source: 'direct', notes: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchLeads();
  }, [user, authLoading, router]);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLead ? `/api/leads/${editingLead.id}` : '/api/leads';
      const method = editingLead ? 'PUT' : 'POST';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      setShowModal(false);
      setEditingLead(null);
      setFormData({ name: '', email: '', company: '', phone: '', status: 'new', source: 'direct', notes: '' });
      fetchLeads();
    } catch (err) {
      console.error('Failed to save lead:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    fetchLeads();
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({ name: lead.name, email: lead.email, company: lead.company, phone: lead.phone, status: lead.status, source: lead.source, notes: lead.notes });
    setShowModal(true);
  };

  const statusColors: Record<string, string> = {
    new: '#3B82F6', contacted: '#F59E0B', qualified: '#8B5CF6', proposal: '#F97316', won: '#10B981', lost: '#EF4444'
  };

  if (authLoading || loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box', marginBottom: '0.75rem' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '1.5rem' }}>
        <div style={{ borderBottom: '1px solid #E0E0E0', paddingBottom: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', margin: 0 }}>Leads CRM</h1>
            <p style={{ color: '#7A7A7A', margin: '0.25rem 0 0' }}>{leads.length} total leads</p>
          </div>
          <button onClick={() => { setEditingLead(null); setFormData({ name: '', email: '', company: '', phone: '', status: 'new', source: 'direct', notes: '' }); setShowModal(true); }} style={{ backgroundColor: '#FF3300', color: '#FFFFFF', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            + Add Lead
          </button>
        </div>

        <div style={{ backgroundColor: '#F5F5F5', borderRadius: '0.75rem', border: '1px solid #E0E0E0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#EFEFEF' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#7A7A7A', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#7A7A7A', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#7A7A7A', textTransform: 'uppercase' }}>Company</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#7A7A7A', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#7A7A7A', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#7A7A7A' }}>No leads yet. Add your first lead!</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} style={{ borderTop: '1px solid #E0E0E0' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#0A0A0A' }}>{lead.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#7A7A7A' }}>{lead.email}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#7A7A7A' }}>{lead.company}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ backgroundColor: statusColors[lead.status] + '20', color: statusColors[lead.status], padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500 }}>{lead.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button onClick={() => openEdit(lead)} style={{ color: '#FF3300', background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}>Edit</button>
                    <button onClick={() => handleDelete(lead.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', padding: '1.5rem', width: '100%', maxWidth: '400px', border: '1px solid #E0E0E0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0A0A0A', margin: 0 }}>{editingLead ? 'Edit Lead' : 'Add Lead'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#7A7A7A' }}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} required />
                <input type="email" placeholder="Email *" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} required />
                <input type="text" placeholder="Company" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={inputStyle}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} style={inputStyle}>
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#FF3300', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
