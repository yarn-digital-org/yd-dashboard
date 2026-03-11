// API endpoint for document management
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

// Mock database - in production this would be a real database
let documentsDB = [
  {
    id: 1,
    title: 'Yarn Digital SEO Audit',
    filename: 'yarn-digital-seo-audit.md',
    agent: 'Scout',
    category: 'SEO',
    size: '9,007 bytes',
    status: 'completed',
    created: new Date('2026-03-10T05:45:00Z').toISOString(),
    description: 'Comprehensive website analysis with technical SEO assessment and priority action plan',
    filePath: '/uploads/yarn-digital-seo-audit.md'
  },
  {
    id: 2,
    title: 'Belfast Competitor SEO Analysis',
    filename: 'belfast-competitor-seo-analysis.md',
    agent: 'Scout',
    category: 'Market Research',
    size: '12,785 bytes',
    status: 'completed',
    created: new Date('2026-03-10T05:50:00Z').toISOString(),
    description: 'Market intelligence on 5 competitors with key opportunities identified',
    filePath: '/uploads/belfast-competitor-seo-analysis.md'
  },
  {
    id: 3,
    title: 'Client Overview Template',
    filename: 'client-overview-template.md',
    agent: 'Aria',
    category: 'Templates',
    size: '2,450 bytes',
    status: 'completed',
    created: new Date('2026-03-10T05:30:00Z').toISOString(),
    description: 'Template for onboarding new clients with business info and project structure',
    filePath: '/uploads/client-overview-template.md'
  },
  {
    id: 4,
    title: 'Social Content Calendar',
    filename: 'yd-social-calendar-14days.md',
    agent: 'Aria',
    category: 'Marketing',
    size: '8,120 bytes',
    status: 'in-progress',
    created: new Date('2026-03-10T06:00:00Z').toISOString(),
    description: '14-day social media content plan for Yarn Digital growth',
    filePath: '/uploads/yd-social-calendar-14days.md'
  }
];

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// Get documents with optional filtering and pagination
async function handleGet(req, res) {
  try {
    const { 
      agent, 
      category, 
      status, 
      search,
      page = 1,
      limit = 20
    } = req.query;
    
    // Parse pagination params
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    let filteredDocs = [...documentsDB];

    // Apply filters
    if (agent && agent !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.agent === agent);
    }
    
    if (category && category !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.category === category);
    }
    
    if (status && status !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocs = filteredDocs.filter(doc =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.agent.toLowerCase().includes(searchLower) ||
        doc.category.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredDocs.sort((a, b) => new Date(b.created) - new Date(a.created));

    // Calculate pagination
    const total = filteredDocs.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginatedDocs = filteredDocs.slice(offset, offset + limitNum);

    res.status(200).json({
      success: true,
      documents: paginatedDocs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
}

// Create new document
async function handlePost(req, res) {
  try {
    const {
      title,
      filename,
      agent,
      category,
      description,
      content,
      status = 'draft'
    } = req.body;

    // Validate required fields
    if (!title || !filename || !agent || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, filename, agent, category'
      });
    }

    // Generate new ID
    const newId = Math.max(...documentsDB.map(doc => doc.id), 0) + 1;

    // Create file path
    const filePath = `/uploads/${filename}`;
    const fullPath = path.join(process.cwd(), 'public', filePath);

    // Save content to file if provided
    if (content) {
      fs.writeFileSync(fullPath, content, 'utf8');
    }

    // Calculate file size
    let size = '0 bytes';
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      size = `${stats.size.toLocaleString()} bytes`;
    }

    // Create document record
    const newDocument = {
      id: newId,
      title,
      filename,
      agent,
      category,
      size,
      status,
      created: new Date().toISOString(),
      description: description || '',
      filePath
    };

    // Add to database
    documentsDB.push(newDocument);

    res.status(201).json({
      success: true,
      document: newDocument
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create document'
    });
  }
}

// Update document
async function handlePut(req, res) {
  try {
    const { id } = req.query;
    const updates = req.body;

    const docIndex = documentsDB.findIndex(doc => doc.id === parseInt(id));
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Update document
    documentsDB[docIndex] = {
      ...documentsDB[docIndex],
      ...updates,
      updated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      document: documentsDB[docIndex]
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document'
    });
  }
}

// Delete document
async function handleDelete(req, res) {
  try {
    const { id } = req.query;

    const docIndex = documentsDB.findIndex(doc => doc.id === parseInt(id));
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = documentsDB[docIndex];
    
    // Remove file
    const fullPath = path.join(process.cwd(), 'public', document.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Remove from database
    documentsDB.splice(docIndex, 1);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};