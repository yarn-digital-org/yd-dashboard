import { NextRequest, NextResponse } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  handleApiError,
  AuthUser
} from '@/lib/api-middleware';
import {
  getSkillCategories,
  getSkillsInCategory,
  getAllSkills,
  getSkillContent,
  createSkillFile,
  updateSkillFile,
  deleteSkillFile,
  getRepoStats
} from '@/lib/github-api';

// ============================================
// Types
// ============================================

interface SkillsResponse {
  skills: any[];
  categories: string[];
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

interface SkillContentResponse {
  skill: {
    path: string;
    content: string;
    renderedHtml?: string;
    metadata: any;
  };
}

// ============================================
// Handler Functions
// ============================================

async function handleGetSkills(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get categories first
    const categories = await getSkillCategories();

    // Get skills
    let skills = category && category !== 'all' 
      ? await getSkillsInCategory(category)
      : await getAllSkills();

    // Apply search filter
    if (search) {
      const query = search.toLowerCase();
      skills = skills.filter(skill =>
        skill.title.toLowerCase().includes(query) ||
        skill.description?.toLowerCase().includes(query) ||
        skill.category.toLowerCase().includes(query) ||
        skill.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply pagination
    const total = skills.length;
    const startIndex = (page - 1) * limit;
    const paginatedSkills = skills.slice(startIndex, startIndex + limit);

    // Get repository stats
    const repoStats = await getRepoStats('yd-skills');

    const response: SkillsResponse = {
      skills: paginatedSkills,
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      repository: {
        name: 'yd-skills',
        url: 'https://github.com/yarn-digital/yd-skills',
        lastUpdated: repoStats?.updatedAt || new Date().toISOString()
      }
    };

    return successResponse(response);
  } catch (error) {
    console.error('GitHub Skills API error:', error);
    return handleApiError(error);
  }
}

async function handleGetSkillContent(skillPath: string): Promise<NextResponse<any>> {
  try {
    const content = await getSkillContent(skillPath);
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Extract metadata from content
    const lines = content.split('\n');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    
    const metadata = {
      title: titleMatch?.[1]?.trim() || 'Untitled Skill',
      category: skillPath.split('/')[0] || 'uncategorized',
      filename: skillPath.split('/').pop() || 'unknown.md',
      lastModified: new Date().toISOString() // This would come from GitHub API in real implementation
    };

    const response: SkillContentResponse = {
      skill: {
        path: skillPath,
        content,
        metadata
      }
    };

    return successResponse(response);
  } catch (error) {
    console.error('Skill content fetch error:', error);
    return handleApiError(error);
  }
}

async function handleCreateSkill(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const body = await request.json();
    const { category, filename, content, message } = body;

    if (!category || !filename || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: category, filename, content' },
        { status: 400 }
      );
    }

    // Ensure filename ends with .md
    const safeFilename = filename.endsWith('.md') ? filename : `${filename}.md`;

    const success = await createSkillFile(category, safeFilename, content, message);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to create skill file' },
        { status: 500 }
      );
    }

    return successResponse({ 
      message: 'Skill created successfully',
      path: `${category}/${safeFilename}`
    });
  } catch (error) {
    console.error('Create skill error:', error);
    return handleApiError(error);
  }
}

async function handleUpdateSkill(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const body = await request.json();
    const { path, content, sha, message } = body;

    if (!path || !content || !sha) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: path, content, sha' },
        { status: 400 }
      );
    }

    const success = await updateSkillFile(path, content, sha, message);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update skill file' },
        { status: 500 }
      );
    }

    return successResponse({ 
      message: 'Skill updated successfully',
      path
    });
  } catch (error) {
    console.error('Update skill error:', error);
    return handleApiError(error);
  }
}

async function handleDeleteSkill(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const body = await request.json();
    const { path, sha, message } = body;

    if (!path || !sha) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: path, sha' },
        { status: 400 }
      );
    }

    const success = await deleteSkillFile(path, sha, message);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete skill file' },
        { status: 500 }
      );
    }

    return successResponse({ 
      message: 'Skill deleted successfully',
      path
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    return handleApiError(error);
  }
}

// ============================================
// Route Handlers
// ============================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) => {
  const { searchParams } = new URL(request.url);
  const skillPath = searchParams.get('path');
  
  if (skillPath) {
    return await handleGetSkillContent(skillPath);
  }
  
  return await handleGetSkills(request);
});

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) => {
  return await handleCreateSkill(request);
});

export const PUT = withAuth(async (request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) => {
  return await handleUpdateSkill(request);
});

export const DELETE = withAuth(async (request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) => {
  return await handleDeleteSkill(request);
});