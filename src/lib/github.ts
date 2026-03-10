/**
 * GitHub API client for skills and client docs repos
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SKILLS_REPO = process.env.GITHUB_SKILLS_REPO || 'yarn-digital/yd-skills';
const CLIENTS_REPO = process.env.GITHUB_CLIENTS_REPO || 'yarn-digital/yd-clients';

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  content?: string;
  download_url?: string;
}

interface GitHubCommit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

async function githubFetch(url: string, options?: RequestInit): Promise<Response> {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not configured');
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

function getRepo(type: 'skills' | 'clients'): string {
  return type === 'skills' ? SKILLS_REPO : CLIENTS_REPO;
}

/**
 * List contents of a directory in a repo
 */
export async function listContents(
  type: 'skills' | 'clients',
  path = ''
): Promise<GitHubFile[]> {
  const repo = getRepo(type);
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await githubFetch(url);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`GitHub API error: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

/**
 * Get file content (decoded from base64)
 */
export async function getFileContent(
  type: 'skills' | 'clients',
  path: string
): Promise<{ content: string; sha: string; name: string }> {
  const repo = getRepo(type);
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await githubFetch(url);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();

  const content = data.content
    ? Buffer.from(data.content, 'base64').toString('utf-8')
    : '';

  return { content, sha: data.sha, name: data.name };
}

/**
 * Create or update a file
 */
export async function saveFile(
  type: 'skills' | 'clients',
  path: string,
  content: string,
  message: string,
  sha?: string // Required for updates, omit for new files
): Promise<{ sha: string; path: string }> {
  const repo = getRepo(type);
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
  };
  if (sha) body.sha = sha;

  const res = await githubFetch(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub save error: ${res.status} ${(err as Record<string, string>).message || ''}`);
  }
  const data = await res.json();
  return { sha: data.content.sha, path: data.content.path };
}

/**
 * Delete a file
 */
export async function deleteFile(
  type: 'skills' | 'clients',
  path: string,
  sha: string,
  message: string
): Promise<void> {
  const repo = getRepo(type);
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await githubFetch(url, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha }),
  });
  if (!res.ok) throw new Error(`GitHub delete error: ${res.status}`);
}

/**
 * Get commit history for a file
 */
export async function getFileHistory(
  type: 'skills' | 'clients',
  path: string,
  limit = 10
): Promise<GitHubCommit[]> {
  const repo = getRepo(type);
  const url = `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(path)}&per_page=${limit}`;
  const res = await githubFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((c: { sha: string; commit: { message: string; author: { name: string; date: string } } }) => ({
    sha: c.sha,
    message: c.commit.message,
    date: c.commit.author.date,
    author: c.commit.author.name,
  }));
}

/**
 * Recursively get all files in a repo
 */
export async function getRepoTree(
  type: 'skills' | 'clients'
): Promise<Array<{ path: string; type: 'file' | 'dir'; sha: string; size?: number }>> {
  const repo = getRepo(type);
  const url = `https://api.github.com/repos/${repo}/git/trees/main?recursive=1`;
  const res = await githubFetch(url);
  if (!res.ok) throw new Error(`GitHub tree error: ${res.status}`);
  const data = await res.json();
  return (data.tree || [])
    .filter((f: { path: string }) => !f.path.startsWith('.'))
    .map((f: { path: string; type: string; sha: string; size?: number }) => ({
      path: f.path,
      type: f.type === 'tree' ? 'dir' as const : 'file' as const,
      sha: f.sha,
      size: f.size,
    }));
}
