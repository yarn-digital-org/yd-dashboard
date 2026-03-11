import { useState, useEffect } from 'react';
import { Search, Download, Eye, GitBranch, FileText, AlertCircle, CheckCircle, Star, Globe } from 'lucide-react';

export default function SkillImport() {
  const [repositories, setRepositories] = useState([]);
  const [discoveredSkills, setDiscoveredSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [preview, setPreview] = useState(null);
  
  // Discovery form state
  const [discoveryForm, setDiscoveryForm] = useState({
    owner: '',
    repo: '',
    branch: 'main'
  });

  // Load popular repositories
  useEffect(() => {
    loadPopularRepositories();
  }, []);

  const loadPopularRepositories = async () => {
    try {
      const response = await fetch('/api/skills/import/repositories');
      const result = await response.json();
      
      if (result.success) {
        setRepositories(result.repositories);
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
    }
  };

  // Discover skills in repository
  const discoverSkills = async (owner, repo, branch = 'main') => {
    setLoading(true);
    setError(null);
    setDiscoveredSkills([]);
    
    try {
      const response = await fetch('/api/skills/import/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo, branch }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setDiscoveredSkills(result.skills);
        if (result.skills.length === 0) {
          setError(`No skills found in ${owner}/${repo}`);
        }
      } else {
        throw new Error('Discovery failed');
      }
    } catch (error) {
      console.error('Discovery error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle repository discovery
  const handleDiscovery = (e) => {
    e.preventDefault();
    if (!discoveryForm.owner || !discoveryForm.repo) {
      setError('Please enter both repository owner and name');
      return;
    }
    
    discoverSkills(discoveryForm.owner, discoveryForm.repo, discoveryForm.branch);
  };

  // Handle popular repository selection
  const handlePopularRepo = (repo) => {
    setDiscoveryForm({
      owner: repo.owner,
      repo: repo.repo,
      branch: 'main'
    });
    discoverSkills(repo.owner, repo.repo, 'main');
  };

  // Handle skill selection
  const handleSkillSelection = (skill, isSelected) => {
    if (isSelected) {
      setSelectedSkills([...selectedSkills, skill]);
    } else {
      setSelectedSkills(selectedSkills.filter(s => s.path !== skill.path));
    }
  };

  // Preview import
  const previewImport = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select skills to import');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/skills/import/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skills: selectedSkills }),
      });

      if (!response.ok) {
        throw new Error(`Preview failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPreview(result);
      } else {
        throw new Error('Preview failed');
      }
    } catch (error) {
      console.error('Preview error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Import selected skills
  const importSkills = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select skills to import');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/skills/import/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          skills: selectedSkills,
          targetDirectory: 'skills/imported'
        }),
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess(`Imported ${result.successful} of ${result.total} skills successfully`);
        setSelectedSkills([]);
        setPreview(null);
        
        // Show detailed results
        if (result.failed > 0) {
          const failedSkills = result.results.filter(r => !r.success);
          console.warn('Failed imports:', failedSkills);
        }
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRepositoryColor = (category) => {
    const colors = {
      'Official': 'bg-blue-100 text-blue-800',
      'Team': 'bg-green-100 text-green-800',
      'Examples': 'bg-purple-100 text-purple-800',
      'Community': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skill Import</h1>
          <p className="text-gray-600">
            Discover and import skills from external GitHub repositories
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <p className="font-medium">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Discovery */}
          <div className="lg:col-span-1">
            {/* Repository Discovery */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Discover Skills
              </h2>
              
              <form onSubmit={handleDiscovery} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository Owner
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={discoveryForm.owner}
                    onChange={(e) => setDiscoveryForm(prev => ({ ...prev, owner: e.target.value }))}
                    placeholder="openclaw"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={discoveryForm.repo}
                    onChange={(e) => setDiscoveryForm(prev => ({ ...prev, repo: e.target.value }))}
                    placeholder="skills"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={discoveryForm.branch}
                    onChange={(e) => setDiscoveryForm(prev => ({ ...prev, branch: e.target.value }))}
                    placeholder="main"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Discover Skills
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Popular Repositories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Popular Repositories
              </h3>
              
              <div className="space-y-3">
                {repositories.map((repo, index) => (
                  <button
                    key={index}
                    onClick={() => handlePopularRepo(repo)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <GitBranch className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{repo.owner}/{repo.repo}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRepositoryColor(repo.category)}`}>
                            {repo.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{repo.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Discovered Skills & Import */}
          <div className="lg:col-span-2">
            {/* Discovered Skills */}
            {discoveredSkills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    Discovered Skills ({discoveredSkills.length})
                  </h2>
                  <div className="flex space-x-2">
                    {selectedSkills.length > 0 && (
                      <>
                        <button
                          onClick={previewImport}
                          disabled={loading}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview ({selectedSkills.length})</span>
                        </button>
                        <button
                          onClick={importSkills}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Import ({selectedSkills.length})</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {discoveredSkills.map((skill, index) => {
                    const isSelected = selectedSkills.some(s => s.path === skill.path);
                    
                    return (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSkillSelection(skill, e.target.checked)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {Math.round(skill.size / 1024)}KB
                              </span>
                            </div>
                            
                            <p className="text-gray-700 mb-2">{skill.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Globe className="w-4 h-4 mr-1" />
                                {skill.repository}
                              </span>
                              <span>{skill.path}</span>
                            </div>
                            
                            {skill.content && (
                              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                                <p className="text-gray-600 font-medium mb-1">Preview:</p>
                                <p className="text-gray-700">{skill.content}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Import Preview */}
            {preview && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Import Preview</h2>
                
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{preview.summary.total}</p>
                      <p className="text-sm text-gray-600">Total Skills</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{preview.summary.valid}</p>
                      <p className="text-sm text-gray-600">Valid</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{preview.summary.conflicts}</p>
                      <p className="text-sm text-gray-600">Conflicts</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {preview.preview.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{item.skill}</h3>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <p className="text-xs text-gray-500">
                            {item.sourceRepository} → {item.targetPath}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {item.validation.isValid ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Issues
                            </span>
                          )}
                          {item.conflicts.hasConflict && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Conflict
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!item.validation.isValid && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                          <p className="font-medium text-red-800">Validation Issues:</p>
                          <ul className="list-disc list-inside text-red-700">
                            {item.validation.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && discoveredSkills.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 mb-2">Discover Skills</h2>
                <p className="text-gray-500">
                  Enter a repository to discover skills, or choose from popular repositories
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}