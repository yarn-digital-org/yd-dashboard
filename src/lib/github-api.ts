import { Octokit } from '@octokit/rest';

// Initialize GitHub API client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const GITHUB_OWNER = 'yarn-digital';
const SKILLS_REPO = 'yd-skills';
const CLIENTS_REPO = 'yd-clients';

// ============================================
// Types
// ============================================

export interface GitHubFile {
  name: string;
  path: string;
  content?: string;
  sha?: string;
  size: number;
  downloadUrl: string;
  htmlUrl: string;
  type: 'file' | 'dir';
  lastModified?: string;
}

export interface SkillFile extends GitHubFile {
  category: string;
  title: string;
  description?: string;
  author?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags?: string[];
}

// ============================================
// Skills Repository Functions
// ============================================

/**
 * List all skill categories from the yd-skills repository
 */
export async function getSkillCategories(): Promise<string[]> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: SKILLS_REPO,
      path: '',
    });

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter(item => item.type === 'dir' && item.name !== '.git')
      .map(item => item.name)
      .sort();
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    return [];
  }
}

/**
 * List all skills in a specific category
 */
export async function getSkillsInCategory(category: string): Promise<SkillFile[]> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: SKILLS_REPO,
      path: category,
    });

    if (!Array.isArray(data)) {
      return [];
    }

    const skills: SkillFile[] = [];

    for (const item of data) {
      if (item.type === 'file' && item.name.endsWith('.md')) {
        const skillFile: SkillFile = {
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          downloadUrl: item.download_url || '',
          htmlUrl: item.html_url || '',
          type: item.type as "file" | "dir",
          category,
          title: formatSkillTitle(item.name),
        };

        // Fetch content to extract metadata
        try {
          const content = await getFileContent(SKILLS_REPO, item.path);
          if (content) {
            const metadata = extractSkillMetadata(content);
            Object.assign(skillFile, metadata);
          }
        } catch (error) {
          console.error(`Error fetching content for ${item.path}:`, error);
        }

        skills.push(skillFile);
      }
    }

    return skills.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    console.error(`Error fetching skills in category ${category}:`, error);
    return [];
  }
}

/**
 * Get all skills from all categories
 */
export async function getAllSkills(): Promise<SkillFile[]> {
  const categories = await getSkillCategories();
  const allSkills: SkillFile[] = [];

  for (const category of categories) {
    const categorySkills = await getSkillsInCategory(category);
    allSkills.push(...categorySkills);
  }

  return allSkills;
}

/**
 * Get specific skill content by path
 */
export async function getSkillContent(skillPath: string): Promise<string | null> {
  return await getFileContent(SKILLS_REPO, skillPath);
}

/**
 * Create a new skill file
 */
export async function createSkillFile(
  category: string,
  filename: string,
  content: string,
  message?: string
): Promise<boolean> {
  try {
    const path = `${category}/${filename}`;
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: SKILLS_REPO,
      path,
      message: message || `Add new skill: ${filename}`,
      content: Buffer.from(content, 'utf8').toString('base64'),
    });

    return true;
  } catch (error) {
    console.error('Error creating skill file:', error);
    return false;
  }
}

/**
 * Update an existing skill file
 */
export async function updateSkillFile(
  skillPath: string,
  content: string,
  sha: string,
  message?: string
): Promise<boolean> {
  try {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: SKILLS_REPO,
      path: skillPath,
      message: message || `Update skill: ${skillPath}`,
      content: Buffer.from(content, 'utf8').toString('base64'),
      sha,
    });

    return true;
  } catch (error) {
    console.error('Error updating skill file:', error);
    return false;
  }
}

/**
 * Delete a skill file
 */
export async function deleteSkillFile(
  skillPath: string,
  sha: string,
  message?: string
): Promise<boolean> {
  try {
    await octokit.rest.repos.deleteFile({
      owner: GITHUB_OWNER,
      repo: SKILLS_REPO,
      path: skillPath,
      message: message || `Delete skill: ${skillPath}`,
      sha,
    });

    return true;
  } catch (error) {
    console.error('Error deleting skill file:', error);
    return false;
  }
}

// ============================================
// Client Docs Repository Functions
// ============================================

/**
 * List all client directories
 */
export async function getClientDirectories(): Promise<string[]> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: CLIENTS_REPO,
      path: '',
    });

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter(item => item.type === 'dir' && item.name !== '.git')
      .map(item => item.name)
      .sort();
  } catch (error) {
    console.error('Error fetching client directories:', error);
    return [];
  }
}

/**
 * Get client documentation files
 */
export async function getClientDocs(clientName: string): Promise<GitHubFile[]> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: CLIENTS_REPO,
      path: clientName,
    });

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter(item => item.type === 'file' && item.name.endsWith('.md'))
      .map(item => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size,
        downloadUrl: item.download_url || '',
        htmlUrl: item.html_url || '',
        type: item.type as "file" | "dir",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error(`Error fetching docs for client ${clientName}:`, error);
    return [];
  }
}

/**
 * Create client documentation file
 */
export async function createClientDoc(
  clientName: string,
  filename: string,
  content: string,
  message?: string
): Promise<boolean> {
  try {
    const path = `${clientName}/${filename}`;
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: CLIENTS_REPO,
      path,
      message: message || `Add client doc: ${clientName}/${filename}`,
      content: Buffer.from(content, 'utf8').toString('base64'),
    });

    return true;
  } catch (error) {
    console.error('Error creating client doc:', error);
    return false;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get file content from any repository
 */
async function getFileContent(repo: string, path: string): Promise<string | null> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo,
      path,
    });

    if ('content' in data && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }

    return null;
  } catch (error) {
    console.error(`Error fetching file content for ${path}:`, error);
    return null;
  }
}

/**
 * Format skill filename to human-readable title
 */
function formatSkillTitle(filename: string): string {
  return filename
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Extract metadata from skill markdown content
 */
function extractSkillMetadata(content: string): Partial<SkillFile> {
  const metadata: Partial<SkillFile> = {};

  // Extract title from first H1
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Extract description from first paragraph after title
  const lines = content.split('\n');
  let foundTitle = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('#')) {
      foundTitle = true;
      continue;
    }
    
    if (foundTitle && trimmed && !trimmed.startsWith('##')) {
      metadata.description = trimmed.length > 200 
        ? trimmed.substring(0, 197) + '...' 
        : trimmed;
      break;
    }
  }

  // Extract frontmatter if it exists
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    
    // Parse YAML-like frontmatter
    const authorMatch = frontmatter.match(/^author:\s*(.+)$/m);
    if (authorMatch) metadata.author = authorMatch[1].trim();
    
    const difficultyMatch = frontmatter.match(/^difficulty:\s*(.+)$/m);
    if (difficultyMatch) {
      const diff = difficultyMatch[1].trim() as any;
      if (['beginner', 'intermediate', 'advanced', 'expert'].includes(diff)) {
        metadata.difficulty = diff;
      }
    }
    
    const tagsMatch = frontmatter.match(/^tags:\s*\[(.*)\]$/m);
    if (tagsMatch) {
      metadata.tags = tagsMatch[1]
        .split(',')
        .map(tag => tag.trim().replace(/['"]/g, ''))
        .filter(Boolean);
    }
  }

  return metadata;
}

/**
 * Get repository statistics
 */
export async function getRepoStats(repo: string) {
  try {
    const { data } = await octokit.rest.repos.get({
      owner: GITHUB_OWNER,
      repo,
    });

    return {
      name: data.name,
      description: data.description,
      size: data.size,
      stargazers: data.stargazers_count,
      language: data.language,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      pushedAt: data.pushed_at,
    };
  } catch (error) {
    console.error(`Error fetching stats for ${repo}:`, error);
    return null;
  }
}