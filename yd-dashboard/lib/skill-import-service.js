import GitHubService from './github-service';

class SkillImportService {
  constructor() {
    this.github = new GitHubService();
  }

  /**
   * Discover skills in a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} branch - Branch to scan (default: main)
   */
  async discoverSkills(owner, repo, branch = 'main') {
    try {
      const skills = [];
      
      // Get repository structure
      const { data: contents } = await this.github.octokit.rest.repos.getContent({
        owner,
        repo,
        path: '',
        ref: branch,
      });

      // Look for skills in common locations
      const skillPaths = [
        'skills',
        'skill',
        'Skills',
        '.openclaw/skills',
        'src/skills',
        'lib/skills'
      ];

      for (const path of skillPaths) {
        try {
          const skillsInPath = await this.scanDirectoryForSkills(owner, repo, path, branch);
          skills.push(...skillsInPath);
        } catch (error) {
          // Directory doesn't exist, continue
          continue;
        }
      }

      // Also check root for SKILL.md files
      const rootSkills = await this.scanDirectoryForSkills(owner, repo, '', branch);
      skills.push(...rootSkills);

      return {
        success: true,
        repository: `${owner}/${repo}`,
        branch,
        skills: this.deduplicateSkills(skills),
      };
    } catch (error) {
      console.error('Skill discovery error:', error);
      throw new Error(`Failed to discover skills: ${error.message}`);
    }
  }

  /**
   * Scan directory for skill files
   */
  async scanDirectoryForSkills(owner, repo, path, branch) {
    try {
      const { data: contents } = await this.github.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      const skills = [];

      if (Array.isArray(contents)) {
        for (const item of contents) {
          if (item.type === 'file' && item.name === 'SKILL.md') {
            // Found a skill file
            const skill = await this.analyzeSkillFile(owner, repo, item.path, branch);
            if (skill) {
              skills.push(skill);
            }
          } else if (item.type === 'dir') {
            // Check subdirectories
            const subSkills = await this.scanDirectoryForSkills(owner, repo, item.path, branch);
            skills.push(...subSkills);
          }
        }
      }

      return skills;
    } catch (error) {
      console.error(`Error scanning directory ${path}:`, error);
      return [];
    }
  }

  /**
   * Analyze a skill file and extract metadata
   */
  async analyzeSkillFile(owner, repo, filePath, branch) {
    try {
      const { data: file } = await this.github.octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branch,
      });

      if (file.type !== 'file') return null;

      const content = Buffer.from(file.content, 'base64').toString('utf-8');
      const metadata = this.extractSkillMetadata(content);

      return {
        name: metadata.name || this.getSkillNameFromPath(filePath),
        description: metadata.description || 'No description available',
        path: filePath,
        directory: filePath.substring(0, filePath.lastIndexOf('/')),
        size: file.size,
        repository: `${owner}/${repo}`,
        branch,
        content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // Preview
        fullContent: content,
        metadata,
        url: file.html_url,
        lastModified: file.last_modified || null,
        sha: file.sha,
      };
    } catch (error) {
      console.error(`Error analyzing skill file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract metadata from skill content
   */
  extractSkillMetadata(content) {
    const metadata = {};
    const lines = content.split('\n');

    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      const line = lines[i].trim();
      
      // Look for title in first few lines
      if (line.startsWith('# ') && !metadata.name) {
        metadata.name = line.substring(2).trim();
      }
      
      // Look for description
      if (line.startsWith('## ') && line.toLowerCase().includes('description')) {
        metadata.description = lines[i + 1]?.trim() || '';
      }
      
      // Look for usage patterns
      if (line.toLowerCase().includes('use when') || line.toLowerCase().includes('usage:')) {
        metadata.usage = lines[i + 1]?.trim() || '';
      }
      
      // Look for dependencies
      if (line.toLowerCase().includes('dependencies') || line.toLowerCase().includes('requires')) {
        metadata.dependencies = lines[i + 1]?.trim() || '';
      }
    }

    return metadata;
  }

  /**
   * Get skill name from file path
   */
  getSkillNameFromPath(filePath) {
    const parts = filePath.split('/');
    if (parts.length > 1) {
      return parts[parts.length - 2]; // Directory name
    }
    return 'Unknown Skill';
  }

  /**
   * Remove duplicate skills
   */
  deduplicateSkills(skills) {
    const seen = new Set();
    return skills.filter(skill => {
      const key = `${skill.repository}:${skill.path}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Import a skill to local repository
   */
  async importSkill(skill, targetPath = null) {
    try {
      // Determine target path
      const finalPath = targetPath || `skills/imported/${skill.name}/SKILL.md`;
      
      // Create commit message
      const message = `Import skill: ${skill.name} from ${skill.repository}`;
      
      // Add source attribution to content
      const attributedContent = this.addSourceAttribution(skill.fullContent, skill);
      
      // Store in target repository
      const result = await this.github.storeDocument(finalPath, attributedContent, message);
      
      return {
        success: true,
        skill: skill.name,
        path: finalPath,
        sourceRepository: skill.repository,
        sourcePath: skill.path,
        ...result,
      };
    } catch (error) {
      console.error('Skill import error:', error);
      throw new Error(`Failed to import skill: ${error.message}`);
    }
  }

  /**
   * Add source attribution to skill content
   */
  addSourceAttribution(content, skill) {
    const attribution = `<!-- Imported from ${skill.repository} at ${skill.path} -->\n<!-- Original: ${skill.url} -->\n<!-- Imported on: ${new Date().toISOString()} -->\n\n`;
    return attribution + content;
  }

  /**
   * Batch import multiple skills
   */
  async importMultipleSkills(skills, targetDirectory = 'skills/imported') {
    const results = [];
    
    for (const skill of skills) {
      try {
        const targetPath = `${targetDirectory}/${skill.name}/SKILL.md`;
        const result = await this.importSkill(skill, targetPath);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          skill: skill.name,
          error: error.message,
        });
      }
    }
    
    return results;
  }

  /**
   * Get popular skill repositories
   */
  getPopularSkillRepositories() {
    return [
      {
        owner: 'openclaw',
        repo: 'skills',
        description: 'Official OpenClaw skills repository',
        category: 'Official'
      },
      {
        owner: 'openclaw',
        repo: 'openclaw',
        description: 'OpenClaw core skills',
        category: 'Official'
      },
      {
        owner: 'yarn-digital',
        repo: 'skills',
        description: 'Yarn Digital custom skills',
        category: 'Team'
      },
      {
        owner: 'anthropic',
        repo: 'anthropic-skills',
        description: 'Anthropic skill examples',
        category: 'Examples'
      }
    ];
  }

  /**
   * Validate skill structure
   */
  validateSkill(content) {
    const issues = [];
    
    if (!content.includes('# ')) {
      issues.push('Missing title (# heading)');
    }
    
    if (!content.includes('## ')) {
      issues.push('Missing sections (## headings)');
    }
    
    if (content.length < 100) {
      issues.push('Content too short (minimum 100 characters)');
    }
    
    if (!content.toLowerCase().includes('use when')) {
      issues.push('Missing usage guidelines');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Preview skill import (dry run)
   */
  async previewImport(skills) {
    const preview = [];
    
    for (const skill of skills) {
      const validation = this.validateSkill(skill.fullContent);
      const targetPath = `skills/imported/${skill.name}/SKILL.md`;
      
      preview.push({
        skill: skill.name,
        description: skill.description,
        sourceRepository: skill.repository,
        sourcePath: skill.path,
        targetPath,
        size: skill.size,
        validation,
        conflicts: await this.checkForConflicts(targetPath),
      });
    }
    
    return preview;
  }

  /**
   * Check for conflicts with existing skills
   */
  async checkForConflicts(targetPath) {
    try {
      await this.github.getDocument(targetPath);
      return { hasConflict: true, message: 'File already exists at target path' };
    } catch (error) {
      if (error.message.includes('Not Found')) {
        return { hasConflict: false, message: 'No conflicts' };
      }
      return { hasConflict: false, message: 'Unable to check conflicts' };
    }
  }
}

export default SkillImportService;