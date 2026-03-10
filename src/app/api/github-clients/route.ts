import { NextRequest, NextResponse } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  handleApiError,
  AuthUser
} from '@/lib/api-middleware';
import {
  getClientDirectories,
  getClientDocs,
  createClientDoc,
  getRepoStats
} from '@/lib/github-api';

// ============================================
// Types
// ============================================

interface ClientDocsResponse {
  clients: {
    name: string;
    docs: any[];
    totalDocs: number;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  repository: {
    name: string;
    url: string;
    lastUpdated: string;
  };
}

interface ClientDetailResponse {
  client: {
    name: string;
    docs: any[];
    totalDocs: number;
    repository: {
      name: string;
      url: string;
      clientUrl: string;
    };
  };
}

// ============================================
// Handler Functions
// ============================================

async function handleGetClients(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get all client directories
    let clientDirectories = await getClientDirectories();

    // Apply search filter
    if (search) {
      const query = search.toLowerCase();
      clientDirectories = clientDirectories.filter(client =>
        client.toLowerCase().includes(query)
      );
    }

    // Get docs for each client
    const clients = [];
    
    for (const clientName of clientDirectories) {
      try {
        const docs = await getClientDocs(clientName);
        clients.push({
          name: clientName,
          docs: docs.map(doc => ({
            name: doc.name,
            path: doc.path,
            size: doc.size,
            htmlUrl: doc.htmlUrl,
            downloadUrl: doc.downloadUrl,
            title: doc.name.replace(/\.md$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          })),
          totalDocs: docs.length
        });
      } catch (error) {
        console.error(`Error fetching docs for client ${clientName}:`, error);
        clients.push({
          name: clientName,
          docs: [],
          totalDocs: 0
        });
      }
    }

    // Apply pagination
    const total = clients.length;
    const startIndex = (page - 1) * limit;
    const paginatedClients = clients.slice(startIndex, startIndex + limit);

    // Get repository stats
    const repoStats = await getRepoStats('yd-clients');

    const response: ClientDocsResponse = {
      clients: paginatedClients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      repository: {
        name: 'yd-clients',
        url: 'https://github.com/yarn-digital/yd-clients',
        lastUpdated: repoStats?.updatedAt || new Date().toISOString()
      }
    };

    return successResponse(response);
  } catch (error) {
    console.error('GitHub Clients API error:', error);
    return handleApiError(error);
  }
}

async function handleGetClientDetail(clientName: string): Promise<NextResponse> {
  try {
    const docs = await getClientDocs(clientName);

    if (docs.length === 0) {
      // Check if client directory exists
      const clients = await getClientDirectories();
      if (!clients.includes(clientName)) {
        return NextResponse.json(
          { success: false, error: 'Client not found' },
          { status: 404 }
        );
      }
    }

    const response: ClientDetailResponse = {
      client: {
        name: clientName,
        docs: docs.map(doc => ({
          name: doc.name,
          path: doc.path,
          sha: doc.sha,
          size: doc.size,
          htmlUrl: doc.htmlUrl,
          downloadUrl: doc.downloadUrl,
          title: doc.name.replace(/\.md$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: doc.name.replace(/\.md$/, '')
        })),
        totalDocs: docs.length,
        repository: {
          name: 'yd-clients',
          url: 'https://github.com/yarn-digital/yd-clients',
          clientUrl: `https://github.com/yarn-digital/yd-clients/tree/main/${clientName}`
        }
      }
    };

    return successResponse(response);
  } catch (error) {
    console.error(`Client detail fetch error for ${clientName}:`, error);
    return handleApiError(error);
  }
}

async function handleCreateClientDoc(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { clientName, filename, content, message } = body;

    if (!clientName || !filename || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientName, filename, content' },
        { status: 400 }
      );
    }

    // Ensure filename ends with .md
    const safeFilename = filename.endsWith('.md') ? filename : `${filename}.md`;

    const success = await createClientDoc(
      clientName, 
      safeFilename, 
      content, 
      message || `Add client document: ${clientName}/${safeFilename}`
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to create client document' },
        { status: 500 }
      );
    }

    return successResponse({ 
      message: 'Client document created successfully',
      path: `${clientName}/${safeFilename}`,
      clientName,
      filename: safeFilename
    });
  } catch (error) {
    console.error('Create client doc error:', error);
    return handleApiError(error);
  }
}

// ============================================
// Route Handlers
// ============================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) => {
  const { searchParams } = new URL(request.url);
  const clientName = searchParams.get('client');
  
  if (clientName) {
    return await handleGetClientDetail(clientName);
  }
  
  return await handleGetClients(request);
});

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) => {
  return await handleCreateClientDoc(request);
});