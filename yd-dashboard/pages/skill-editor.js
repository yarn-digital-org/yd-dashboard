import { useState, useEffect } from 'react';
import { Save, FileText, GitCommit, History, Eye, Code, Book, Settings } from 'lucide-react';

export default function SkillEditor() {
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState([]);

  // Load available skills
  const loadSkills = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/github/documents?path=skills');
      const result = await response.json();
      
      if (result.success) {
        // Filter for SKILL.md files and related skill files
        const skillFiles = result.documents.filter(doc => 
          doc.name === 'SKILL.md' || 
          doc.path.includes('/SKILL.md') ||
          doc.name.endsWith('.md') && doc.path.includes('skills/')
        );
        setSkills(skillFiles);
      }
    } catch (error) {
      setError('Failed to load skills: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load skill content
  const loadSkillContent = async (skill) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/github/documents/${encodeURIComponent(skill.path)}`);
      const result = await response.json();
      
      if (result.success) {
        setContent(result.content);
        setSelectedSkill(skill);
        setCommitMessage(`Update ${skill.name}`);
      }
    } catch (error) {
      setError('Failed to load skill content: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Save skill content
  const saveSkill = async () => {
    if (!selectedSkill || !commitMessage.trim()) {
      setError('Please enter a commit message');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/github/documents/${encodeURIComponent(selectedSkill.path)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          message: commitMessage,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Skill saved successfully!');
        setCommitMessage(`Update ${selectedSkill.name}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      setError('Failed to save skill: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load skill history
  const loadHistory = async (skill) => {
    try {
      const response = await fetch(`/api/github/documents/${encodeURIComponent(skill.path)}?action=history`);
      const result = await response.json();
      
      if (result.success) {
        setHistory(result.history);
      }
    } catch (error) {
      setError('Failed to load history: ' + error.message);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getSkillIcon = (filename) => {
    if (filename === 'SKILL.md') return Book;
    if (filename.includes('script')) return Code;
    if (filename.includes('config')) return Settings;
    return FileText;
  };

  const renderPreview = () => {
    // Simple markdown-to-HTML conversion for preview
    let html = content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>');

    // Wrap list items in ul tags
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    return { __html: html };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar - Skills List */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-auto">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Skill Editor</h1>
            
            {loading && skills.length === 0 && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading skills...</p>
              </div>
            )}

            <div className="space-y-2">
              {skills.map(skill => {
                const Icon = getSkillIcon(skill.name);
                return (
                  <button
                    key={skill.path}
                    onClick={() => loadSkillContent(skill)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSkill?.path === skill.path
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{skill.name}</p>
                        <p className="text-sm text-gray-500">{skill.path}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {skills.length === 0 && !loading && (
              <div className="text-center py-8">
                <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No skills found</p>
                <p className="text-sm text-gray-400">Skills should be in the skills/ directory</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {selectedSkill ? (
            <>
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedSkill.name}</h2>
                    <p className="text-sm text-gray-500">{selectedSkill.path}</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                        showPreview 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{showPreview ? 'Edit' : 'Preview'}</span>
                    </button>
                    
                    <button
                      onClick={() => loadHistory(selectedSkill)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 transition-colors"
                    >
                      <History className="w-4 h-4" />
                      <span>History</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor/Preview Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {showPreview ? (
                  // Preview Mode
                  <div className="flex-1 overflow-auto p-6 bg-white">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={renderPreview()}
                    />
                  </div>
                ) : (
                  // Edit Mode
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="flex-1 p-6 border-none resize-none focus:outline-none font-mono text-sm"
                      placeholder="Start editing your skill..."
                    />
                  </div>
                )}
              </div>

              {/* Footer - Commit Controls */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                    {success}
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <GitCommit className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Describe your changes..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={saveSkill}
                    disabled={loading || !commitMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Commit'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            // No Skill Selected
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 mb-2">Select a Skill to Edit</h2>
                <p className="text-gray-500">Choose a skill from the sidebar to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      {history.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">History: {selectedSkill?.name}</h2>
              <button
                onClick={() => setHistory([])}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {history.map(commit => (
                <div key={commit.sha} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{commit.message}</p>
                      <p className="text-sm text-gray-600">
                        by {commit.author} on {formatDate(commit.date)}
                      </p>
                    </div>
                    <a 
                      href={commit.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      View commit →
                    </a>
                  </div>
                  <p className="text-xs font-mono text-gray-500">{commit.sha}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}