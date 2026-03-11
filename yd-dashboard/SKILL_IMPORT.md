# Skill Import System

This document describes the Skill Import system for discovering and importing skills from external GitHub repositories.

## Features Delivered

### 1. Skill Import Service (`lib/skill-import-service.js`)
- **Skill Discovery**: Automatically scan repositories for SKILL.md files
- **Metadata Extraction**: Parse skill content to extract name, description, usage patterns
- **Repository Scanning**: Support multiple common skill directory structures
- **Validation System**: Validate skill structure before import
- **Batch Import**: Import multiple skills with single operation
- **Conflict Detection**: Check for existing skills at target paths
- **Source Attribution**: Add source metadata to imported skills

### 2. API Endpoints (`pages/api/skills/import/`)
- **POST /api/skills/import/discover** - Discover skills in repository
- **POST /api/skills/import/import** - Import selected skills
- **POST /api/skills/import/preview** - Preview import with validation
- **GET /api/skills/import/repositories** - Get popular skill repositories

### 3. Skill Import Interface (`pages/skill-import.js`)
- **Repository Discovery**: Search any GitHub repository for skills
- **Popular Repositories**: Quick access to common skill sources
- **Skill Selection**: Multi-select interface with previews
- **Import Preview**: Validation and conflict checking
- **Batch Operations**: Import multiple skills simultaneously
- **Progress Tracking**: Real-time import status and results

## Repository Discovery

### Supported Directory Structures
The system automatically scans for skills in these common locations:
- `/skills/` - OpenClaw standard location
- `/skill/` - Alternative naming
- `/.openclaw/skills/` - OpenClaw workspace location
- `/src/skills/` - Source code organization
- `/lib/skills/` - Library organization
- Root directory - For standalone skill repositories

### Skill File Detection
- Looks for `SKILL.md` files in all directory structures
- Recursively scans subdirectories
- Extracts metadata from skill content headers
- Generates preview content for quick review

## Popular Repositories

### Default Repository List
- **openclaw/skills** - Official OpenClaw skills
- **openclaw/openclaw** - Core OpenClaw skills
- **yarn-digital/skills** - Yarn Digital custom skills
- **anthropic/anthropic-skills** - Example skills from Anthropic

### Repository Categories
- **Official** - OpenClaw maintained repositories
- **Team** - Organization/team specific skills
- **Examples** - Educational and reference skills
- **Community** - Community contributed skills

## Skill Metadata Extraction

### Automatic Detection
The system parses skill files to extract:
- **Name** - From first `#` heading or directory name
- **Description** - From content under description sections
- **Usage** - From "use when" or "usage" sections
- **Dependencies** - From requirements sections

### Content Analysis
- Validates minimum content length (100 characters)
- Checks for required sections (title, description)
- Identifies usage patterns and guidelines
- Generates content previews for selection

## Import Process

### 1. Discovery Phase
```javascript
const result = await fetch('/api/skills/import/discover', {
  method: 'POST',
  body: JSON.stringify({ owner, repo, branch })
});
```

### 2. Selection Phase
- User selects skills from discovered list
- System shows skill previews and metadata
- Multi-select interface for batch operations

### 3. Preview Phase
```javascript
const preview = await fetch('/api/skills/import/preview', {
  method: 'POST', 
  body: JSON.stringify({ skills: selectedSkills })
});
```

### 4. Import Phase
```javascript
const result = await fetch('/api/skills/import/import', {
  method: 'POST',
  body: JSON.stringify({ 
    skills: selectedSkills,
    targetDirectory: 'skills/imported'
  })
});
```

## Validation System

### Skill Structure Validation
- **Title Check**: Ensures skill has proper title (`#` heading)
- **Section Check**: Validates required sections (`##` headings)
- **Content Check**: Minimum content length validation
- **Usage Check**: Looks for usage guidelines

### Conflict Detection
- Checks if target path already exists
- Provides conflict resolution options
- Prevents accidental overwrites

### Import Results
- Success/failure status for each skill
- Detailed error messages for failures
- Summary statistics for batch operations

## Source Attribution

### Automatic Attribution
All imported skills receive source metadata:
```markdown
<!-- Imported from owner/repo at path/to/SKILL.md -->
<!-- Original: https://github.com/owner/repo/blob/branch/path -->
<!-- Imported on: 2026-03-11T12:00:00.000Z -->
```

### Traceability
- Original repository and path preserved
- Direct links to source material
- Import timestamp for tracking
- Version control through Git commits

## Target Directory Structure

### Default Organization
```
skills/imported/
├── skill-name-1/
│   └── SKILL.md
├── skill-name-2/
│   └── SKILL.md
└── skill-name-3/
    └── SKILL.md
```

### Customizable Paths
- Target directory can be specified
- Skills organized by name in subdirectories
- Maintains compatibility with skill editor
- Integrates with existing skill management

## Error Handling

### GitHub API Errors
- **404 Not Found**: Repository doesn't exist or not accessible
- **401 Unauthorized**: GitHub authentication failed
- **403 Forbidden**: Access denied or rate limited
- **429 Rate Limited**: GitHub API limits exceeded

### Validation Errors
- **Missing Content**: Skill file empty or too short
- **Invalid Structure**: Missing required sections
- **Conflict**: Target path already exists
- **Permission**: Cannot write to target location

### User Feedback
- Clear error messages for all failure modes
- Progress indicators for long operations
- Success confirmations with details
- Retry mechanisms for transient failures

## Integration with Existing Systems

### Skill Editor Integration
- Imported skills immediately available in skill editor
- Full editing and Git commit functionality
- Version history tracking for imported skills

### GitHub API Integration
- Uses existing GitHub service for authentication
- Leverages established API patterns
- Consistent error handling and rate limiting

### Dashboard Integration
- Added to main dashboard quick actions
- Professional UI consistent with other pages
- Responsive design for all screen sizes

## Usage Examples

### Import from Official Repository
1. Click "openclaw/skills" from popular repositories
2. Review discovered skills in the repository
3. Select desired skills for import
4. Preview import to check for conflicts
5. Complete import to local skill collection

### Import from Custom Repository
1. Enter repository owner and name
2. Specify branch (defaults to 'main')
3. System discovers all skills in repository
4. Select skills and preview import
5. Import with automatic source attribution

### Batch Import Multiple Skills
1. Discover skills from repository
2. Use checkboxes to select multiple skills
3. Preview shows validation and conflicts
4. Import all selected skills in single operation
5. Review results for success/failure status

## Performance Considerations

### GitHub API Limits
- Respects GitHub API rate limiting
- Provides appropriate error messages
- Suggests retry timing for rate limits

### Large Repository Handling
- Recursive scanning with reasonable depth limits
- Content preview limited to 500 characters
- Pagination for large skill collections

### Batch Operations
- Imports processed sequentially to avoid conflicts
- Progress feedback for multi-skill operations
- Rollback capabilities for failed batch imports

## Security Considerations

### GitHub Authentication
- Uses existing GitHub token from environment
- Respects repository access permissions
- No credential storage in browser

### Content Validation
- Validates skill content before import
- Prevents malicious content injection
- Source attribution for audit trails

### Target Path Validation
- Validates target paths for security
- Prevents directory traversal attacks
- Maintains consistent file organization

## Status

- ✅ **Skill Import Service**: Complete backend functionality
- ✅ **API Endpoints**: All REST endpoints implemented
- ✅ **User Interface**: Full-featured import interface
- ✅ **GitHub Integration**: Repository discovery and access
- ✅ **Validation System**: Content and conflict validation
- ✅ **Documentation**: Complete setup and usage guide
- ✅ **Dashboard Integration**: Added to main navigation

The Skill Import system is fully functional and ready for production use with proper GitHub authentication configured.