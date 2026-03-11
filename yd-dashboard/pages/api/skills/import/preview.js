import SkillImportService from '../../../../lib/skill-import-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const skillImporter = new SkillImportService();
  
  try {
    const { skills } = req.body;
    
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid skills array' 
      });
    }

    const preview = await skillImporter.previewImport(skills);
    
    res.status(200).json({
      success: true,
      preview,
      summary: {
        total: preview.length,
        valid: preview.filter(p => p.validation.isValid).length,
        conflicts: preview.filter(p => p.conflicts.hasConflict).length,
      }
    });
  } catch (error) {
    console.error('Skill import preview API error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}