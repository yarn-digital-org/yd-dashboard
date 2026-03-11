import GitHubService from '../../../../lib/github-service';

export default async function handler(req, res) {
  const github = new GitHubService();
  
  // Reconstruct the file path from the dynamic route
  const { path: pathSegments } = req.query;
  const filePath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get specific document or its history
        if (req.query.action === 'history') {
          const historyResult = await github.getFileHistory(filePath, req.query.branch);
          res.status(200).json(historyResult);
        } else {
          const document = await github.getDocument(filePath, req.query.branch);
          res.status(200).json(document);
        }
        break;

      case 'PUT':
        // Update existing document
        const { content, message, branch = 'main' } = req.body;
        
        if (!content || !message) {
          return res.status(400).json({ 
            error: 'Missing required fields: content, message' 
          });
        }

        const updateResult = await github.storeDocument(filePath, content, message, branch);
        res.status(200).json(updateResult);
        break;

      case 'DELETE':
        // Delete document
        const { message: deleteMessage, branch: deleteBranch = 'main' } = req.body;
        
        if (!deleteMessage) {
          return res.status(400).json({ 
            error: 'Missing required field: message' 
          });
        }

        const deleteResult = await github.deleteDocument(filePath, deleteMessage, deleteBranch);
        res.status(200).json(deleteResult);
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('GitHub Document API Error:', error);
    
    // Handle specific GitHub API errors
    if (error.message.includes('Not Found')) {
      res.status(404).json({ error: 'Document not found' });
    } else if (error.message.includes('rate limit')) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Internal server error' 
      });
    }
  }
}