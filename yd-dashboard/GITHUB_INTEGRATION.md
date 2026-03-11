# GitHub Integration for Client Documents

This document describes the GitHub API integration for managing client documents and skills.

## Features Delivered

### 1. GitHub API Integration (`lib/github-service.js`)
- Complete GitHub API service class using Octokit
- Store, retrieve, list, and delete documents in GitHub repositories
- File history and commit management
- Repository creation and management
- Error handling and authentication

### 2. Document Management API (`pages/api/github/documents/`)
- RESTful API endpoints for document CRUD operations
- GET `/api/github/documents` - List all documents
- POST `/api/github/documents` - Create new document
- GET `/api/github/documents/[path]` - Get specific document
- PUT `/api/github/documents/[path]` - Update existing document
- DELETE `/api/github/documents/[path]` - Delete document
- GET `/api/github/documents/[path]?action=history` - Get file history

### 3. GitHub Documents Page (`pages/documents-github.js`)
- Full document management interface
- Search and filter functionality
- Document upload with commit messages
- Preview documents in new window
- Download documents directly from GitHub
- View file history and commits
- Responsive design with modal interfaces

### 4. Inline Skill Editor (`pages/skill-editor.js`)
- Load skills from GitHub repository
- Inline markdown editor with live preview
- Git commit functionality with custom messages
- File history viewer
- Side-by-side editing and preview modes
- Syntax highlighting for markdown

### 5. Version History View (`pages/version-history.js`)
- Visual timeline of all document commits
- Filter by author, timeframe, and search terms
- View document content at specific commits
- Commit details and metadata display
- Interactive timeline interface
- Direct links to GitHub commits

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in the project root:

```bash
# GitHub API Configuration
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_REPO_OWNER=yarn-digital
GITHUB_REPO_NAME=client-docs
```

### 2. GitHub Personal Access Token
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate new token with these scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
3. Copy token to `GITHUB_TOKEN` environment variable

### 3. Repository Setup
- The integration can work with any GitHub repository
- Default: `yarn-digital/client-docs`
- Repository will be created automatically if it doesn't exist
- Documents can be organized in folders (e.g., `clients/project-name/`)

### 4. Install Dependencies
```bash
npm install @octokit/rest
```

## API Endpoints

### List Documents
```http
GET /api/github/documents?path=optional/subfolder
```

### Create Document
```http
POST /api/github/documents
Content-Type: application/json

{
  "path": "clients/yarn-digital/project-overview.md",
  "content": "# Project Overview\n\nDocument content here...",
  "message": "Add project overview document"
}
```

### Get Document
```http
GET /api/github/documents/clients/yarn-digital/project-overview.md
```

### Update Document
```http
PUT /api/github/documents/clients/yarn-digital/project-overview.md
Content-Type: application/json

{
  "content": "# Updated Project Overview\n\nUpdated content...",
  "message": "Update project details"
}
```

### Get File History
```http
GET /api/github/documents/clients/yarn-digital/project-overview.md?action=history
```

## Pages

### `/documents-github`
- Main document management interface
- Upload, view, edit, and delete documents
- Search and filter capabilities
- Direct GitHub integration

### `/skill-editor`
- Edit skill files with Git commits
- Live preview mode
- File history viewer
- Commit message management

### `/version-history`
- Visual timeline of all changes
- Filter by author, time, search
- View content at specific commits
- Track document evolution

## Technical Details

### GitHub Service Class Methods
- `storeDocument(path, content, message, branch)` - Create or update file
- `getDocument(path, branch)` - Retrieve file content
- `listDocuments(path, branch)` - List files in directory
- `getFileHistory(path, branch)` - Get commit history
- `deleteDocument(path, message, branch)` - Delete file
- `createRepository(name, private)` - Create new repository

### Error Handling
- GitHub API rate limiting
- Authentication errors
- File not found errors
- Network errors
- Proper HTTP status codes

### Security
- GitHub token stored in environment variables
- No hardcoded credentials
- Repository access controlled by GitHub permissions
- Input validation and sanitization

## Usage Examples

### Store Client Document
```javascript
const github = new GitHubService();
await github.storeDocument(
  'clients/stonebridge-farm/brand-guidelines.md',
  '# Stonebridge Farm Brand Guidelines\n\n...',
  'Add brand guidelines for Stonebridge Farm'
);
```

### Load Document History
```javascript
const history = await github.getFileHistory('clients/stonebridge-farm/brand-guidelines.md');
console.log(`${history.length} commits found`);
```

## Integration Status
- ✅ GitHub API service implementation
- ✅ RESTful API endpoints
- ✅ Document management interface
- ✅ Skill editor with Git commits
- ✅ Version history timeline
- ✅ Error handling and validation
- ✅ Environment configuration
- ✅ Documentation and examples

The GitHub integration is fully functional and ready for production use with proper environment configuration.