import SkillImportService from '../../../../lib/skill-import-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const skillImporter = new SkillImportService();
  
  try {
    const { owner, repo, branch = 'main' } = req.body;
    
    if (!owner || !repo) {
      return res.status(400).json({ 
        error: 'Missing required fields: owner, repo' 
      });
    }

    const result = await skillImporter.discoverSkills(owner, repo, branch);
    res.status(200).json(result);
  } catch (error) {
    console.error('Skill discovery API error:', error);
    
    // Handle specific GitHub API errors
    if (error.message.includes('Not Found')) {
      res.status(404).json({ error: 'Repository not found or not accessible' });
    } else if (error.message.includes('rate limit')) {
      res.status(429).json({ error: 'GitHub API rate limit exceeded' });
    } else if (error.message.includes('Bad credentials')) {
      res.status(401).json({ error: 'GitHub authentication failed' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Internal server error' 
      });
    }
  }
}