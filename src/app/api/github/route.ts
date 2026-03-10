import { NextRequest } from 'next/server';
import {
  withAuth,
  successResponse,
  errorResponse,
  AuthUser,
} from '@/lib/api-middleware';
import {
  listContents,
  getFileContent,
  saveFile,
  deleteFile,
  getFileHistory,
  getRepoTree,
} from '@/lib/github';

// ============================================
// GET - List files, get content, or get tree
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') || 'skills') as 'skills' | 'clients';
  const action = searchParams.get('action') || 'list';
  const path = searchParams.get('path') || '';

  try {
    if (action === 'tree') {
      const tree = await getRepoTree(type);
      return successResponse({ tree, total: tree.length });
    }

    if (action === 'content' && path) {
      const file = await getFileContent(type, path);
      return successResponse(file);
    }

    if (action === 'history' && path) {
      const limit = parseInt(searchParams.get('limit') || '10');
      const history = await getFileHistory(type, path, limit);
      return successResponse({ history });
    }

    // Default: list directory
    const files = await listContents(type, path);
    return successResponse({
      files: files.map(f => ({
        name: f.name,
        path: f.path,
        type: f.type,
        sha: f.sha,
        size: f.size,
      })),
      total: files.length,
    });
  } catch (err) {
    console.error('GitHub GET error:', err);
    return errorResponse(
      err instanceof Error ? err.message : 'GitHub API error',
      500
    );
  }
}

// ============================================
// POST - Create new file
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const body = await request.json();
  const { type = 'skills', path, content, message } = body;

  if (!path || !content) {
    return errorResponse('path and content are required', 400);
  }

  try {
    const result = await saveFile(
      type as 'skills' | 'clients',
      path,
      content,
      message || `Create ${path}`
    );
    return successResponse(result, 201);
  } catch (err) {
    console.error('GitHub POST error:', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to create file',
      500
    );
  }
}

// ============================================
// PUT - Update existing file
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const body = await request.json();
  const { type = 'skills', path, content, sha, message } = body;

  if (!path || !content || !sha) {
    return errorResponse('path, content, and sha are required', 400);
  }

  try {
    const result = await saveFile(
      type as 'skills' | 'clients',
      path,
      content,
      message || `Update ${path}`,
      sha
    );
    return successResponse(result);
  } catch (err) {
    console.error('GitHub PUT error:', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to update file',
      500
    );
  }
}

// ============================================
// DELETE - Delete file
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') || 'skills') as 'skills' | 'clients';
  const path = searchParams.get('path') || '';
  const sha = searchParams.get('sha') || '';

  if (!path || !sha) {
    return errorResponse('path and sha are required', 400);
  }

  try {
    await deleteFile(type, path, sha, `Delete ${path}`);
    return successResponse({ deleted: path });
  } catch (err) {
    console.error('GitHub DELETE error:', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to delete file',
      500
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
