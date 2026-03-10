# Learnings API Testing Guide

## API Endpoints Created

### 1. GET /api/learnings
- **Purpose:** List learnings with filtering
- **Query Parameters:** category, tags, client, impact, status, limit, offset
- **Response:** Array of learnings with pagination info

### 2. POST /api/learnings
- **Purpose:** Create a new learning
- **Body:** title, description, category, tags, client, project, impact, actionable, status
- **Response:** Created learning object

### 3. GET /api/learnings/[id]
- **Purpose:** Get specific learning by ID
- **Response:** Single learning object

### 4. PUT /api/learnings/[id]
- **Purpose:** Update specific learning
- **Body:** Partial learning object (only fields to update)
- **Response:** Updated learning object

### 5. DELETE /api/learnings/[id]
- **Purpose:** Archive learning (soft delete)
- **Response:** Success message

## Test Commands

### Create a Learning
```bash
curl -X POST http://localhost:3000/api/learnings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "SEO improvement increased traffic by 40%",
    "description": "By implementing proper meta descriptions and improving page load speed, organic traffic increased significantly",
    "category": "seo",
    "tags": ["meta-descriptions", "page-speed", "organic-traffic"],
    "client": "example-client",
    "impact": "high",
    "actionable": true
  }'
```

### List All Learnings
```bash
curl http://localhost:3000/api/learnings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by Category
```bash
curl "http://localhost:3000/api/learnings?category=seo&impact=high" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update a Learning
```bash
curl -X PUT http://localhost:3000/api/learnings/LEARNING_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"impact": "medium", "tags": ["updated-tag"]}'
```

### Archive a Learning
```bash
curl -X DELETE http://localhost:3000/api/learnings/LEARNING_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Schema

```typescript
interface Learning {
  id: string;
  title: string; // 3-100 chars
  description: string; // 10-2000 chars
  category: 'seo' | 'development' | 'design' | 'marketing' | 'client-management';
  tags: string[]; // max 10 tags
  client?: string;
  project?: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  dateCreated: string; // ISO timestamp
  createdBy: string; // user ID
  lastUpdated: string; // ISO timestamp
  updatedBy: string; // user ID
  status: 'draft' | 'published' | 'archived';
  orgId: string; // organization ID
}
```

## Implementation Status
- ✅ Database types added to `/types/database.ts`
- ✅ LEARNINGS collection added to COLLECTIONS
- ✅ API routes created with proper authentication
- ✅ Input validation with Zod schemas
- ✅ Error handling with middleware
- ✅ Organization-scoped access control
- ✅ Soft delete (archive) functionality
- ✅ Firestore integration with timestamp handling

## Next Steps
1. Deploy and test endpoints
2. Create frontend dashboard page at `/learnings`
3. Add search and filtering UI
4. Integrate with task/skill workflow