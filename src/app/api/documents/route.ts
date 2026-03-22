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

interface Document {
  id: string;
  title: string;
  filename: string;
  agent: 'Scout' | 'Bolt' | 'Aria' | 'Radar' | 'Blaze' | 'Jarvis';
  category: string;
  description: string;
  size: string;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  created: string;
  updated?: string;
  filePath: string;
  contentPreview?: string;
  content?: string;
  tags?: string[];
  version?: string;
  type?: string;
}

interface DocumentsResponse {
  documents: Document[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    agents: string[];
    categories: string[];
    statuses: string[];
  };
}

// ============================================
// Firestore Helper Functions
// ============================================

async function getDocumentsFromFirestore(): Promise<Document[]> {
  if (!adminDb) {
    console.error('Firebase Admin DB is null. Environment variables:', {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      hasCredentialsBase64: !!process.env.FIREBASE_CREDENTIALS_BASE64,
      serviceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0
    });
    throw new Error('Firebase Admin not initialized - check environment variables');
  }

  try {
    const documentsRef = adminDb.collection('documents');
    const snapshot = await documentsRef.get();
    
    const documents: Document[] = [];
    
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
        status: data.status || 'completed',
        created: data.created || new Date().toISOString(),
        updated: data.updated || data.created || new Date().toISOString(),
        filePath: data.filePath || data.filename || 'document.md',
        contentPreview: data.contentPreview || '',
        content: data.content || '',
        tags: data.tags || [],
        version: data.version || '1.0',
        type: data.type || 'markdown'
      });
    });

    return documents;
  } catch (error) {
    console.error('Error fetching documents from Firestore:', error);
    throw error;
  }
}

function filterDocuments(documents: Document[], filters: any): Document[] {
  let filtered = [...documents];

  // Filter by agent
  if (filters.agent && filters.agent !== 'all') {
    filtered = filtered.filter(doc => doc.agent === filters.agent);
  }

  // Filter by category
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(doc => doc.category === filters.category);
  }

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(doc => doc.status === filters.status);
  }

  // Search filter
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.description.toLowerCase().includes(query) ||
      doc.filename.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query) ||
      (doc.content && doc.content.toLowerCase().includes(query)) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }

  return filtered;
}

function sortDocuments(documents: Document[], sortBy: string): Document[] {
  const sorted = [...documents];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
    case 'updated':
      return sorted.sort((a, b) => {
        const aUpdated = a.updated || a.created;
        const bUpdated = b.updated || b.created;
        return new Date(bUpdated).getTime() - new Date(aUpdated).getTime();
      });
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'agent':
      return sorted.sort((a, b) => a.agent.localeCompare(b.agent));
    case 'category':
      return sorted.sort((a, b) => a.category.localeCompare(b.category));
    default:
      return sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }
}

function paginateResults(documents: Document[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return documents.slice(startIndex, endIndex);
}

// ============================================
// API Handlers
// ============================================

async function handleGet(
  request: NextRequest,
  context: { user: AuthUser }
): Promise<NextResponse<any>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const agent = searchParams.get('agent');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    
    // Fetch all documents from Firestore
    const allDocuments = await getDocumentsFromFirestore();
    
    // Apply filters
    const filteredDocuments = filterDocuments(allDocuments, {
      agent,
      category,
      status,
      search
    });
    
    // Sort documents
    const sortedDocuments = sortDocuments(filteredDocuments, sortBy);
    
    // Paginate results
    const paginatedDocuments = paginateResults(sortedDocuments, page, limit);
    
    // Generate filter options from all documents
    const agents = [...new Set(allDocuments.map(doc => doc.agent))].sort();
    const categories = [...new Set(allDocuments.map(doc => doc.category))].sort();
    const statuses = [...new Set(allDocuments.map(doc => doc.status))].sort();
    
    const response: DocumentsResponse = {
      documents: paginatedDocuments,
      pagination: {
        total: filteredDocuments.length,
        page,
        limit,
        totalPages: Math.ceil(filteredDocuments.length / limit)
      },
      filters: {
        agents,
        categories,
        statuses
      }
    };
    
    return successResponse(response);
    
  } catch (error) {
    console.error('Documents API error:', error);
    return handleApiError(error);
  }
}

// ============================================
// Document Detail API (for individual document fetch)
// ============================================

async function handleGetDocument(
  documentId: string,
  context: { user: AuthUser }
): Promise<NextResponse<any>> {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    const docRef = adminDb.collection('documents').doc(documentId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const document: Document = {
      id: doc.id,
      title: data?.title || 'Untitled Document',
      filename: data?.filename || 'document.md',
      agent: data?.agent || 'Scout',
      category: data?.category || 'General',
      description: data?.description || '',
      size: data?.size || '0 B',
      status: data?.status || 'completed',
      created: data?.created || new Date().toISOString(),
      updated: data?.updated || data?.created || new Date().toISOString(),
      filePath: data?.filePath || data?.filename || 'document.md',
      contentPreview: data?.contentPreview || '',
      content: data?.content || '',
      tags: data?.tags || [],
      version: data?.version || '1.0',
      type: data?.type || 'markdown'
    };
    
    return successResponse({ document });
    
  } catch (error) {
    console.error('Document fetch error:', error);
    return handleApiError(error);
  }
}

// ============================================
// POST - Create or upsert a document
// ============================================

async function handlePost(request: NextRequest) {
  if (!adminDb) throw new Error('Firebase Admin not initialized');

  const body = await request.json();
  const { title, filename, agent, category, description, status, content, filePath, tags } = body;

  if (!title) {
    return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const contentStr = content || '';
  const preview = contentStr.substring(0, 300).replace(/[#*_\-`]/g, '').trim();
  const sizeBytes = Buffer.byteLength(contentStr, 'utf8');
  const sizeStr = sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(1)} KB` : `${sizeBytes} B`;

  const docData = {
    title: title || 'Untitled',
    filename: filename || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
    agent: agent || 'Bolt',
    category: category || 'General',
    description: description || '',
    size: sizeStr,
    status: status || 'completed',
    created: now,
    updated: now,
    filePath: filePath || '',
    contentPreview: preview,
    content: contentStr,
    tags: tags || [],
    version: '1.0',
    type: 'markdown',
  };

  // Upsert: check if doc with same title + agent already exists
  const existing = await adminDb.collection('documents')
    .where('title', '==', title)
    .where('agent', '==', docData.agent)
    .limit(1)
    .get();

  let docId: string;
  if (!existing.empty) {
    docId = existing.docs[0].id;
    await adminDb.collection('documents').doc(docId).update({
      ...docData,
      created: existing.docs[0].data().created || now, // preserve original created date
    });
  } else {
    const ref = await adminDb.collection('documents').add(docData);
    docId = ref.id;
  }

  return NextResponse.json({ success: true, id: docId });
}

// ============================================
// Route Exports
// ============================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) => {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('id');
  
  if (documentId) {
    return await handleGetDocument(documentId, context);
  }
  
  return await handleGet(request, context);
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error('Document create error:', error);
    return handleApiError(error);
  }
});