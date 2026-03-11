import { Octokit } from '@octokit/rest';

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.owner = process.env.GITHUB_REPO_OWNER || 'yarn-digital';
    this.repo = process.env.GITHUB_REPO_NAME || 'client-docs';
  }

  /**
   * Store a document in GitHub repository
   * @param {string} path - File path in repository
   * @param {string} content - Document content
   * @param {string} message - Commit message
   * @param {string} branch - Branch name (default: main)
   */
  async storeDocument(path, content, message, branch = 'main') {
    try {
      // Check if file exists
      let sha = null;
      try {
        const { data } = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
          ref: branch,
        });
        sha = data.sha;
      } catch (error) {
        // File doesn't exist, that's okay for new files
        if (error.status !== 404) {
          throw error;
        }
      }

      // Create or update file
      const result = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        ...(sha && { sha }),
      });

      return {
        success: true,
        sha: result.data.content.sha,
        url: result.data.content.html_url,
        download_url: result.data.content.download_url,
      };
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw new Error(`Failed to store document: ${error.message}`);
    }
  }

  /**
   * Retrieve a document from GitHub repository
   * @param {string} path - File path in repository
   * @param {string} branch - Branch name (default: main)
   */
  async getDocument(path, branch = 'main') {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch,
      });

      if (data.type !== 'file') {
        throw new Error('Path is not a file');
      }

      return {
        success: true,
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        sha: data.sha,
        size: data.size,
        url: data.html_url,
        download_url: data.download_url,
        last_modified: data.last_modified || null,
      };
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw new Error(`Failed to retrieve document: ${error.message}`);
    }
  }

  /**
   * List all documents in repository
   * @param {string} path - Directory path (default: root)
   * @param {string} branch - Branch name (default: main)
   */
  async listDocuments(path = '', branch = 'main') {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch,
      });

      if (!Array.isArray(data)) {
        return [data];
      }

      // Filter for markdown files and other documents
      const documents = data
        .filter(item => 
          item.type === 'file' && 
          (item.name.endsWith('.md') || 
           item.name.endsWith('.txt') ||
           item.name.endsWith('.pdf') ||
           item.name.endsWith('.docx'))
        )
        .map(item => ({
          name: item.name,
          path: item.path,
          size: item.size,
          url: item.html_url,
          download_url: item.download_url,
          sha: item.sha,
        }));

      return {
        success: true,
        documents,
      };
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw new Error(`Failed to list documents: ${error.message}`);
    }
  }

  /**
   * Get file history/commits
   * @param {string} path - File path in repository
   * @param {string} branch - Branch name (default: main)
   */
  async getFileHistory(path, branch = 'main') {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner: this.owner,
        repo: this.repo,
        path,
        sha: branch,
        per_page: 50,
      });

      const history = data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
      }));

      return {
        success: true,
        history,
      };
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw new Error(`Failed to get file history: ${error.message}`);
    }
  }

  /**
   * Create a new repository for client docs
   * @param {string} repoName - Repository name
   * @param {boolean} isPrivate - Whether repository should be private
   */
  async createRepository(repoName, isPrivate = true) {
    try {
      const result = await this.octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'Client documents storage for Yarn Digital',
        private: isPrivate,
        auto_init: true,
      });

      return {
        success: true,
        repo_url: result.data.html_url,
        clone_url: result.data.clone_url,
      };
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  /**
   * Delete a document from repository
   * @param {string} path - File path in repository
   * @param {string} message - Commit message
   * @param {string} branch - Branch name (default: main)
   */
  async deleteDocument(path, message, branch = 'main') {
    try {
      // Get current file to get its SHA
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch,
      });

      await this.octokit.rest.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        sha: data.sha,
        branch,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
}

export default GitHubService;