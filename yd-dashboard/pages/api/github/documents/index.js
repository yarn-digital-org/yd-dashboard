import GitHubService from '../../../../lib/github-service';

export default async function handler(req, res) {
  const github = new GitHubService();

  try {
    switch (req.method) {
      case 'GET':
        // List all documents
        const { path = '' } = req.query;
        const result = await github.listDocuments(path);
        res.status(200).json(result);
        break;

      case 'POST':
        // Create new document
        const { path: docPath, content, message, branch = 'main' } = req.body;
        
        if (!docPath || !content || !message) {
          return res.status(400).json({ 
            error: 'Missing required fields: path, content, message' 
          });
        }

        const storeResult = await github.storeDocument(docPath, content, message, branch);
        res.status(201).json(storeResult);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('GitHub Documents API Error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}