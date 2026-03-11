import SkillImportService from '../../../../lib/skill-import-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const skillImporter = new SkillImportService();
  
  try {
    const { skills, targetDirectory = 'skills/imported' } = req.body;
    
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid skills array' 
      });
    }

    // Validate all skills before importing
    const validationResults = [];
    for (const skill of skills) {
      if (!skill.fullContent || !skill.name) {
        validationResults.push({
          skill: skill.name || 'Unknown',
          error: 'Missing required skill data (name or content)'
        });
      }
    }

    if (validationResults.length > 0) {
      return res.status(400).json({
        error: 'Invalid skill data',
        validationErrors: validationResults
      });
    }

    // Import skills
    const results = await skillImporter.importMultipleSkills(skills, targetDirectory);
    
    const summary = {
      total: skills.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };

    res.status(200).json({
      success: true,
      summary,
      ...summary
    });
  } catch (error) {
    console.error('Skill import API error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}