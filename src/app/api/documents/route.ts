import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { 
  withAuth, 
  successResponse, 
  handleApiError,
  AuthUser
} from '@/lib/api-middleware';

// ============================================
// Types
// ============================================

interface Document {
  id: string;
  title: string;
  filename: string;
  agent: 'Scout' | 'Bolt' | 'Aria' | 'Radar';
  category: string;
  description: string;
  size: string;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  created: string;
  updated?: string;
  filePath: string;
  contentPreview?: string;
  content?: string;
}

// ============================================
// File System Reading Functions
// ============================================

function scanDeliverablesDirectory(): Document[] {
  const deliverablesPath = join(process.cwd(), 'deliverables');
  const documents: Document[] = [];
  
  try {
    // Get agent directories (scout, bolt, aria, radar)
    const agentDirs = readdirSync(deliverablesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    let docId = 1;
    
    for (const agentDir of agentDirs) {
      const agentPath = join(deliverablesPath, agentDir);
      const agent = agentDir.charAt(0).toUpperCase() + agentDir.slice(1) as 'Scout' | 'Bolt' | 'Aria' | 'Radar';
      
      try {
        // Get markdown files in agent directory
        const files = readdirSync(agentPath)
          .filter(file => extname(file).toLowerCase() === '.md');
        
        for (const file of files) {
          const filePath = join(agentPath, file);
          const stats = statSync(filePath);
          
          try {
            const content = readFileSync(filePath, 'utf-8');
            const title = extractTitle(content, file);
            const description = extractDescription(content);
            const category = inferCategory(file, content);
            
            documents.push({
              id: String(docId++),
              title,
              filename: file,
              agent,
              category,
              description,
              size: `${(stats.size / 1024).toFixed(1)} KB`,
              status: 'completed',
              created: stats.birthtime.toISOString(),
              updated: stats.mtime.toISOString(),
              filePath: `/documents/${agent.toLowerCase()}/${file}`,
              contentPreview: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
              content
            });
          } catch (fileError) {
            console.error(`Error reading file ${filePath}:`, fileError);
          }
        }
      } catch (agentDirError) {
        console.error(`Error reading agent directory ${agentPath}:`, agentDirError);
      }
    }
    
    return documents;
  } catch (error) {
    console.error('Error scanning deliverables directory:', error);
    return [];
  }
}

function extractTitle(content: string, filename: string): string {
  // Try to extract title from first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  
  // Fallback to filename without extension
  return basename(filename, '.md')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function extractDescription(content: string): string {
  const lines = content.split('\n');
  
  // Look for first paragraph after title
  let foundHeading = false;
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('#')) {
      foundHeading = true;
      continue;
    }
    
    if (foundHeading && trimmed.length > 20) {
      return trimmed.length > 200 ? trimmed.substring(0, 200) + '...' : trimmed;
    }
  }
  
  // Fallback to first non-empty line
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.length > 20) {
      return trimmed.length > 200 ? trimmed.substring(0, 200) + '...' : trimmed;
    }
  }
  
  return 'No description available';
}

function inferCategory(filename: string, content: string): string {
  const file = filename.toLowerCase();
  const contentLower = content.toLowerCase();
  
  if (file.includes('seo') || contentLower.includes('search engine')) return 'SEO';
  if (file.includes('competitor') || contentLower.includes('competitor')) return 'Market Research';
  if (file.includes('social') || contentLower.includes('social media')) return 'Marketing';
  if (file.includes('analytics') || contentLower.includes('analytics')) return 'Analytics';
  if (file.includes('brand') || contentLower.includes('brand voice')) return 'Content';
  if (file.includes('calendar') || contentLower.includes('content calendar')) return 'Marketing';
  if (file.includes('template')) return 'Templates';
  if (file.includes('baseline') || file.includes('audit')) return 'Analysis';
  if (file.includes('plan') || file.includes('strategy')) return 'Strategy';
  
  return 'General';
}

// ============================================
// GET - List documents with filtering
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get real documents from file system
    let filteredDocs = scanDeliverablesDirectory();
    
    // Apply filters
    const agent = searchParams.get('agent');
    if (agent && agent !== 'all' && ['Scout', 'Bolt', 'Aria', 'Radar'].includes(agent)) {
      filteredDocs = filteredDocs.filter(doc => doc.agent === agent);
    }
    
    const category = searchParams.get('category');
    if (category && category !== 'all') {
      filteredDocs = filteredDocs.filter(doc => 
        doc.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    const status = searchParams.get('status');
    if (status && status !== 'all' && ['draft', 'in-progress', 'completed', 'archived'].includes(status)) {
      filteredDocs = filteredDocs.filter(doc => doc.status === status);
    }
    
    const search = searchParams.get('search');
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocs = filteredDocs.filter(doc =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.filename.toLowerCase().includes(searchLower) ||
        doc.category.toLowerCase().includes(searchLower) ||
        doc.agent.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    const sort = searchParams.get('sort') || 'newest';
    switch (sort) {
      case 'newest':
        filteredDocs.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        break;
      case 'oldest':
        filteredDocs.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
        break;
      case 'title-asc':
        filteredDocs.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        filteredDocs.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'agent':
        filteredDocs.sort((a, b) => a.agent.localeCompare(b.agent));
        break;
      case 'category':
        filteredDocs.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'status':
        filteredDocs.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return successResponse({
      documents: filteredDocs,
      total: filteredDocs.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================
// Route Handler with Auth
// ============================================

export const GET = withAuth(handleGet);

// Export for other methods if needed in the future
export const POST = withAuth(async (request: NextRequest, context: any) => {
  return NextResponse.json({ success: false, error: 'Method not implemented yet' }, { status: 501 });
});

export const PUT = withAuth(async (request: NextRequest, context: any) => {
  return NextResponse.json({ success: false, error: 'Method not implemented yet' }, { status: 501 });
});

export const DELETE = withAuth(async (request: NextRequest, context: any) => {
  return NextResponse.json({ success: false, error: 'Method not implemented yet' }, { status: 501 });
});