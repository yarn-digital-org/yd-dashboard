import SkillImportService from '../../../../lib/skill-import-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const skillImporter = new SkillImportService();
  
  try {
    const repositories = skillImporter.getPopularSkillRepositories();
    
    res.status(200).json({
      success: true,
      repositories
    });
  } catch (error) {
    console.error('Repositories API error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}