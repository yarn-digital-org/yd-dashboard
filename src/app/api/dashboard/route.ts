import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export interface DashboardMetrics {
  revenue: number;
  outstanding: number;
  projectsCount: number;
  leadsCount: number;
  clientsCount: number;
  contactsCount: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'contact_created' | 'lead_created' | 'project_created' | 'invoice_paid';
  title: string;
  subtitle: string;
  timestamp: string;
}

// Empty metrics for when Firebase isn't configured
const emptyMetrics: DashboardMetrics = {
  revenue: 0,
  outstanding: 0,
  projectsCount: 0,
  leadsCount: 0,
  clientsCount: 0,
  contactsCount: 0,
  recentActivity: [],
};

// GET - Fetch dashboard metrics
export async function GET(request: NextRequest) {
  try {
    // If Firebase isn't configured, return empty metrics instead of error
    if (!adminDb) {
      console.warn('Dashboard: Firebase not configured, returning empty metrics');
      return NextResponse.json(emptyMetrics);
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const startDateISO = startDate.toISOString();

    // Fetch contacts (with error handling)
    let contacts: any[] = [];
    try {
      const contactsSnapshot = await adminDb.collection('contacts').get();
      contacts = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (e) {
      console.warn('Dashboard: Failed to fetch contacts', e);
    }

    // Filter contacts by period
    const filteredContacts = period === 'all' 
      ? contacts 
      : contacts.filter((c: any) => c.createdAt >= startDateISO);

    // Calculate metrics from contacts
    const allContacts = contacts as any[];

    // Contact type counts
    const leads = allContacts.filter(c => c.type === 'lead');
    const clients = allContacts.filter(c => c.type === 'client');
    
    // Calculate revenue (sum of lifetimeValue for all clients)
    const totalRevenue = clients.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0);
    
    // Calculate outstanding (sum of outstandingAmount)
    const totalOutstanding = allContacts.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);
    
    // Project count (sum of projectCount across all contacts)
    const totalProjects = allContacts.reduce((sum, c) => sum + (c.projectCount || 0), 0);

    // Try to fetch leads collection if it exists (for accurate lead count)
    let leadsCount = leads.length;
    try {
      const leadsSnapshot = await adminDb.collection('leads').get();
      if (!leadsSnapshot.empty) {
        leadsCount = leadsSnapshot.size;
      }
    } catch {
      // leads collection doesn't exist, use contact type count
    }

    // Try to fetch projects collection if it exists
    let projectsCount = totalProjects;
    try {
      const projectsSnapshot = await adminDb.collection('projects').get();
      if (!projectsSnapshot.empty) {
        projectsCount = projectsSnapshot.size;
      }
    } catch {
      // projects collection doesn't exist, use sum from contacts
    }

    // Get recent activity (last 10 contacts created)
    const recentContacts = allContacts
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 10);

    const recentActivity: ActivityItem[] = recentContacts.map(c => ({
      id: c.id || '',
      type: c.type === 'lead' ? 'lead_created' : 'contact_created',
      title: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown',
      subtitle: c.company || c.email || '',
      timestamp: c.createdAt || new Date().toISOString(),
    }));

    const metrics: DashboardMetrics = {
      revenue: totalRevenue,
      outstanding: totalOutstanding,
      projectsCount,
      leadsCount,
      clientsCount: clients.length,
      contactsCount: allContacts.length,
      recentActivity,
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    // Return empty metrics on error instead of failing
    return NextResponse.json(emptyMetrics);
  }
}
