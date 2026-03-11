import { NextRequest, NextResponse } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  handleApiError,
  AuthUser
} from '@/lib/api-middleware';
import { adminDb } from '@/lib/firebase-admin';

// ============================================
// Types
// ============================================

interface LibraryDocument {
  id: string;
  title: string;
  filename: string;
  agent: 'Scout' | 'Bolt' | 'Aria' | 'Radar';
  category: string;
  description: string;
  size: string;
  type: 'markdown' | 'text' | 'other';
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  created: string;
  modified: string;
  contentPreview: string;
  content?: string;
  wordCount?: number;
  lineCount?: number;
  tags?: string[];
}

interface LibraryResponse {
  documents: LibraryDocument[];
  total: number;
  filters: {
    agents: string[];
    categories: string[];
    types: string[];
  };
}

const COLLECTION = 'library-documents';

// ============================================
// Firestore Helper Functions
// ============================================

async function getLibraryDocuments(): Promise<LibraryDocument[]> {
  if (!adminDb) {
    console.error('Firebase Admin DB is null.');
    throw new Error('Firebase Admin not initialized - check environment variables');
  }

  try {
    const ref = adminDb.collection(COLLECTION);
    const snapshot = await ref.get();
    
    const documents: LibraryDocument[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        title: data.title || 'Untitled Document',
        filename: data.filename || 'document.md',
        agent: data.agent || 'Scout',
        category: data.category || 'General',
        description: data.description || '',
        size: data.size || '0 B',
        type: data.type || 'markdown',
        status: data.status || 'completed',
        created: data.created || new Date().toISOString(),
        modified: data.modified || data.created || new Date().toISOString(),
        contentPreview: data.contentPreview || '',
        content: data.content,
        wordCount: data.wordCount,
        lineCount: data.lineCount,
        tags: data.tags || [],
      });
    });

    return documents;
  } catch (error) {
    console.error('Error fetching library documents from Firestore:', error);
    throw error;
  }
}

function filterDocuments(documents: LibraryDocument[], filters: Record<string, string | null>): LibraryDocument[] {
  let filtered = [...documents];

  if (filters.agent && filters.agent !== 'all') {
    filtered = filtered.filter(doc => doc.agent === filters.agent);
  }

  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(doc => doc.category === filters.category);
  }

  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(doc => doc.type === filters.type);
  }

  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.description.toLowerCase().includes(query) ||
      doc.filename.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }

  return filtered;
}

function sortDocuments(documents: LibraryDocument[], sortBy: string): LibraryDocument[] {
  const sorted = [...documents];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
    case 'modified':
      return sorted.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'agent':
      return sorted.sort((a, b) => a.agent.localeCompare(b.agent));
    default:
      return sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }
}

// ============================================
// API Handlers
// ============================================

async function handleGet(request: NextRequest, context: { user: AuthUser }) {
  try {
    const { searchParams } = new URL(request.url);
    
    const agent = searchParams.get('agent');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort') || 'newest';
    
    const allDocuments = await getLibraryDocuments();
    
    const filteredDocuments = filterDocuments(allDocuments, {
      agent, category, type, search
    });
    
    const sortedDocuments = sortDocuments(filteredDocuments, sortBy);
    
    const agents = [...new Set(allDocuments.map(doc => doc.agent))].sort();
    const categories = [...new Set(allDocuments.map(doc => doc.category))].sort();
    const types = [...new Set(allDocuments.map(doc => doc.type))].sort();
    
    const response: LibraryResponse = {
      documents: sortedDocuments,
      total: sortedDocuments.length,
      filters: { agents, categories, types }
    };
    
    return successResponse(response);
  } catch (error) {
    console.error('Library API error:', error);
    return handleApiError(error);
  }
}

async function handlePost(request: NextRequest, context: { user: AuthUser }) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    const body = await request.json();
    
    if (!body.title || !body.agent) {
      return NextResponse.json(
        { success: false, error: 'Title and agent are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const docData = {
      title: body.title,
      filename: body.filename || `${body.title.toLowerCase().replace(/\s+/g, '-')}.md`,
      agent: body.agent,
      category: body.category || 'General',
      description: body.description || '',
      size: body.size || '0 B',
      type: body.type || 'markdown',
      status: body.status || 'draft',
      created: now,
      modified: now,
      contentPreview: body.contentPreview || '',
      content: body.content || '',
      wordCount: body.wordCount || 0,
      lineCount: body.lineCount || 0,
      tags: body.tags || [],
    };

    const ref = adminDb.collection(COLLECTION);
    const docRef = await ref.add(docData);

    return successResponse({ 
      id: docRef.id, 
      ...docData 
    });
  } catch (error) {
    console.error('Library POST error:', error);
    return handleApiError(error);
  }
}

// ============================================
// Route Exports
// ============================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) => {
  return await handleGet(request, context);
});

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) => {
  return await handlePost(request, context);
});
