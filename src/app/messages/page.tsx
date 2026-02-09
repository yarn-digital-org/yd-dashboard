'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '1.5rem 2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Messages</h1>
              <p style={{ color: '#6B7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                Communicate with your clients and team
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#FFFFFF', 
          borderRadius: '0.75rem', 
          border: '1px solid #E5E7EB',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#FFF5F2',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <MessageSquare size={32} style={{ color: '#FF3300' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>
            No messages yet
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
            Your client conversations and team messages will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
