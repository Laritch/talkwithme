import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './GlossaryManager.css';

/**
 * GlossaryManager Component
 *
 * Manages domain-specific terminology for more accurate translations.
 * This helps maintain consistency in specialized content.
 */
const GlossaryManager = () => {
  const { languages, currentLanguage } = useLanguage();
  const [glossaries, setGlossaries] = useState([]);
  const [currentGlossary, setCurrentGlossary] = useState(null);
  const [terms, setTerms] = useState([]);
  const [newGlossaryName, setNewGlossaryName] = useState('');
  const [newTerm, setNewTerm] = useState({ source: '', target: '', notes: '' });
  const [editingTerm, setEditingTerm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load glossaries from localStorage on component mount
  useEffect(() => {
    loadGlossaries();
  }, []);

  // Load glossary terms when current glossary changes
  useEffect(() => {
    if (currentGlossary) {
      loadTerms(currentGlossary.id);
    } else {
      setTerms([]);
    }
  }, [currentGlossary]);

  // Load glossaries from localStorage
  const loadGlossaries = () => {
    try {
      const savedGlossaries = JSON.parse(localStorage.getItem('glossaries')) || [];
      setGlossaries(savedGlossaries);

      // Set the first glossary as current if available
      if (savedGlossaries.length > 0 && !currentGlossary) {
        setCurrentGlossary(savedGlossaries[0]);
      }
    } catch (error) {
      console.error('Failed to load glossaries:', error);
      setMessage({ text: 'Failed to load glossaries', type: 'error' });
    }
  };

  // Load terms for a specific glossary
  const loadTerms = (glossaryId) => {
    try {
      const savedTerms = JSON.parse(localStorage.getItem(`glossary_terms_${glossaryId}`)) || [];
      setTerms(savedTerms);
    } catch (error) {
      console.error('Failed to load glossary terms:', error);
      setMessage({ text: 'Failed to load glossary terms', type: 'error' });
    }
  };

  // Save glossaries to localStorage
  const saveGlossaries = (updatedGlossaries) => {
    try {
      localStorage.setItem('glossaries', JSON.stringify(updatedGlossaries));
      setGlossaries(updatedGlossaries);
    } catch (error) {
      console.error('Failed to save glossaries:', error);
      setMessage({ text: 'Failed to save glossaries', type: 'error' });
    }
  };

  // Save terms for a specific glossary
  const saveTerms = (glossaryId, updatedTerms) => {
    try {
      localStorage.setItem(`glossary_terms_${glossaryId}`, JSON.stringify(updatedTerms));
      setTerms(updatedTerms);
    } catch (error) {
      console.error('Failed to save glossary terms:', error);
      setMessage({ text: 'Failed to save glossary terms', type: 'error' });
    }
  };

  // Create a new glossary
  const createGlossary = () => {
    if (!newGlossaryName.trim()) {
      setMessage({ text: 'Please enter a glossary name', type: 'error' });
      return;
    }

    const glossaryExists = glossaries.some(g => g.name.toLowerCase() === newGlossaryName.toLowerCase());
    if (glossaryExists) {
      setMessage({ text: 'A glossary with this name already exists', type: 'error' });
      return;
    }

    const newGlossary = {
      id: `glossary_${Date.now()}`,
      name: newGlossaryName,
      targetLanguage: currentLanguage,
      sourceLanguage: 'en',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      termCount: 0
    };

    const updatedGlossaries = [...glossaries, newGlossary];
    saveGlossaries(updatedGlossaries);
    setCurrentGlossary(newGlossary);
    setNewGlossaryName('');
    setMessage({ text: 'Glossary created successfully', type: 'success' });
  };

  // Delete a glossary
  const deleteGlossary = (glossaryId) => {
    if (!confirm('Are you sure you want to delete this glossary? This action cannot be undone.')) {
      return;
    }

    const updatedGlossaries = glossaries.filter(g => g.id !== glossaryId);
    saveGlossaries(updatedGlossaries);

    // Remove glossary terms from localStorage
    localStorage.removeItem(`glossary_terms_${glossaryId}`);

    // Reset current glossary if it was the one deleted
    if (currentGlossary && currentGlossary.id === glossaryId) {
      setCurrentGlossary(updatedGlossaries.length > 0 ? updatedGlossaries[0] : null);
    }

    setMessage({ text: 'Glossary deleted successfully', type: 'success' });
  };

  // Add a new term to the current glossary
  const addTerm = () => {
    if (!currentGlossary) {
      setMessage({ text: 'Please select or create a glossary first', type: 'error' });
      return;
    }

    if (!newTerm.source.trim() || !newTerm.target.trim()) {
      setMessage({ text: 'Please enter both source and target terms', type: 'error' });
      return;
    }

    const termExists = terms.some(t => t.source.toLowerCase() === newTerm.source.toLowerCase());
    if (termExists) {
      setMessage({ text: 'This term already exists in the glossary', type: 'error' });
      return;
    }

    const newTermWithId = {
      ...newTerm,
      id: `term_${Date.now()}`,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    const updatedTerms = [...terms, newTermWithId];
    saveTerms(currentGlossary.id, updatedTerms);

    // Update glossary term count
    const updatedGlossaries = glossaries.map(g => {
      if (g.id === currentGlossary.id) {
        return { ...g, termCount: updatedTerms.length, updated: new Date().toISOString() };
      }
      return g;
    });
    saveGlossaries(updatedGlossaries);

    // Update currentGlossary reference
    setCurrentGlossary({ ...currentGlossary, termCount: updatedTerms.length });
    setNewTerm({ source: '', target: '', notes: '' });
    setMessage({ text: 'Term added successfully', type: 'success' });
  };

  // Update an existing term
  const updateTerm = () => {
    if (!editingTerm) return;

    const updatedTerms = terms.map(term => {
      if (term.id === editingTerm.id) {
        return {
          ...editingTerm,
          updated: new Date().toISOString()
        };
      }
      return term;
    });

    saveTerms(currentGlossary.id, updatedTerms);
    setEditingTerm(null);
    setMessage({ text: 'Term updated successfully', type: 'success' });
  };

  // Delete a term
  const deleteTerm = (termId) => {
    if (!confirm('Are you sure you want to delete this term?')) {
      return;
    }

    const updatedTerms = terms.filter(term => term.id !== termId);
    saveTerms(currentGlossary.id, updatedTerms);

    // Update glossary term count
    const updatedGlossaries = glossaries.map(g => {
      if (g.id === currentGlossary.id) {
        return { ...g, termCount: updatedTerms.length, updated: new Date().toISOString() };
      }
      return g;
    });
    saveGlossaries(updatedGlossaries);

    // Update currentGlossary reference
    setCurrentGlossary({ ...currentGlossary, termCount: updatedTerms.length });
    setMessage({ text: 'Term deleted successfully', type: 'success' });
  };

  // Import glossary from file
  const importGlossary = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let importedTerms = [];

        // Try to parse as JSON
        try {
          const jsonData = JSON.parse(content);

          if (Array.isArray(jsonData)) {
            importedTerms = jsonData;
          } else if (jsonData.terms && Array.isArray(jsonData.terms)) {
            importedTerms = jsonData.terms;

            // If JSON has glossary metadata, create a new glossary
            if (jsonData.name) {
              const newGlossary = {
                id: `glossary_${Date.now()}`,
                name: jsonData.name,
                targetLanguage: jsonData.targetLanguage || currentLanguage,
                sourceLanguage: jsonData.sourceLanguage || 'en',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                termCount: importedTerms.length
              };

              const updatedGlossaries = [...glossaries, newGlossary];
              saveGlossaries(updatedGlossaries);
              setCurrentGlossary(newGlossary);
              saveTerms(newGlossary.id, importedTerms);
              setMessage({ text: `Glossary "${jsonData.name}" imported with ${importedTerms.length} terms`, type: 'success' });
              setIsLoading(false);
              return;
            }
          }
        } catch (jsonError) {
          // Not valid JSON, try CSV format
          const lines = content.split('\n');
          importedTerms = lines
            .filter(line => line.trim().length > 0)
            .map((line, index) => {
              const [source, target, notes] = line.split(',').map(item => item.trim());
              return {
                id: `term_${Date.now()}_${index}`,
                source: source || '',
                target: target || '',
                notes: notes || '',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
              };
            })
            .filter(term => term.source && term.target);
        }

        if (importedTerms.length === 0) {
          setMessage({ text: 'No valid terms found in the file', type: 'error' });
          setIsLoading(false);
          return;
        }

        if (!currentGlossary) {
          // Create a new glossary for the imported terms
          const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
          const newGlossary = {
            id: `glossary_${Date.now()}`,
            name: `Imported from ${fileName}`,
            targetLanguage: currentLanguage,
            sourceLanguage: 'en',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            termCount: importedTerms.length
          };

          const updatedGlossaries = [...glossaries, newGlossary];
          saveGlossaries(updatedGlossaries);
          setCurrentGlossary(newGlossary);
          saveTerms(newGlossary.id, importedTerms);
        } else {
          // Add to current glossary
          const combinedTerms = [...terms];

          // Check for duplicates and add only unique terms
          let addedCount = 0;
          importedTerms.forEach(term => {
            const exists = combinedTerms.some(t => t.source.toLowerCase() === term.source.toLowerCase());
            if (!exists) {
              combinedTerms.push(term);
              addedCount++;
            }
          });

          saveTerms(currentGlossary.id, combinedTerms);

          // Update glossary term count
          const updatedGlossaries = glossaries.map(g => {
            if (g.id === currentGlossary.id) {
              return { ...g, termCount: combinedTerms.length, updated: new Date().toISOString() };
            }
            return g;
          });
          saveGlossaries(updatedGlossaries);

          // Update currentGlossary reference
          setCurrentGlossary({ ...currentGlossary, termCount: combinedTerms.length });
          setMessage({ text: `Added ${addedCount} terms to glossary (${importedTerms.length - addedCount} duplicates skipped)`, type: 'success' });
        }
      } catch (error) {
        console.error('Failed to import glossary:', error);
        setMessage({ text: 'Failed to import glossary: ' + error.message, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      setMessage({ text: 'Error reading file', type: 'error' });
    };

    reader.readAsText(file);

    // Reset the file input
    event.target.value = '';
  };

  // Export glossary to JSON
  const exportGlossary = () => {
    if (!currentGlossary) {
      setMessage({ text: 'Please select a glossary to export', type: 'error' });
      return;
    }

    const glossaryData = {
      name: currentGlossary.name,
      sourceLanguage: currentGlossary.sourceLanguage,
      targetLanguage: currentGlossary.targetLanguage,
      created: currentGlossary.created,
      updated: currentGlossary.updated,
      terms: terms
    };

    const jsonString = JSON.stringify(glossaryData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentGlossary.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage({ text: 'Glossary exported successfully', type: 'success' });
  };

  // Filter terms based on search query
  const filteredTerms = terms.filter(term => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return term.source.toLowerCase().includes(query) ||
           term.target.toLowerCase().includes(query) ||
           term.notes.toLowerCase().includes(query);
  });

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(currentLanguage, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="glossary-manager">
      <h2 className="glossary-manager-title">Translation Glossary Manager</h2>
      <p className="glossary-manager-description">
        Manage domain-specific terminology for more accurate and consistent translations.
      </p>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button
            className="dismiss-btn"
            onClick={() => setMessage({ text: '', type: '' })}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <div className="glossary-layout">
        {/* Sidebar with glossary list */}
        <div className="glossary-sidebar">
          <div className="create-glossary">
            <h3>Create New Glossary</h3>
            <div className="glossary-form">
              <input
                type="text"
                placeholder="Glossary name"
                value={newGlossaryName}
                onChange={(e) => setNewGlossaryName(e.target.value)}
              />
              <button onClick={createGlossary}>Create</button>
            </div>
          </div>

          <div className="import-export">
            <h3>Import/Export</h3>
            <div className="import-export-buttons">
              <label className="import-btn">
                Import
                <input
                  type="file"
                  accept=".json,.csv,.txt"
                  onChange={importGlossary}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                className="export-btn"
                onClick={exportGlossary}
                disabled={!currentGlossary}
              >
                Export
              </button>
            </div>
          </div>

          <div className="glossary-list">
            <h3>Your Glossaries</h3>
            {glossaries.length === 0 ? (
              <p className="no-glossaries">No glossaries yet. Create one to get started.</p>
            ) : (
              <ul>
                {glossaries.map(glossary => (
                  <li
                    key={glossary.id}
                    className={currentGlossary && currentGlossary.id === glossary.id ? 'active' : ''}
                  >
                    <div
                      className="glossary-item"
                      onClick={() => setCurrentGlossary(glossary)}
                    >
                      <div className="glossary-info">
                        <span className="glossary-name">{glossary.name}</span>
                        <div className="glossary-meta">
                          <span className="glossary-language">
                            {languages[glossary.targetLanguage]?.flag} {languages[glossary.targetLanguage]?.name}
                          </span>
                          <span className="glossary-count">{glossary.termCount} terms</span>
                        </div>
                      </div>
                      <button
                        className="delete-glossary-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGlossary(glossary.id);
                        }}
                        aria-label={`Delete ${glossary.name}`}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Terms manager */}
        <div className="glossary-terms-container">
          {!currentGlossary ? (
            <div className="no-glossary-selected">
              <p>Select or create a glossary to manage terms</p>
            </div>
          ) : (
            <>
              <div className="glossary-terms-header">
                <h3>{currentGlossary.name} Terms</h3>
                <div className="terms-actions">
                  <input
                    type="text"
                    placeholder="Search terms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-terms"
                  />
                </div>
              </div>

              <div className="add-term-form">
                <div className="form-group">
                  <label htmlFor="source-term">Source term (English)</label>
                  <input
                    id="source-term"
                    type="text"
                    placeholder="Original term"
                    value={newTerm.source}
                    onChange={(e) => setNewTerm({ ...newTerm, source: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="target-term">
                    Target term ({languages[currentGlossary.targetLanguage]?.name})
                  </label>
                  <input
                    id="target-term"
                    type="text"
                    placeholder="Translated term"
                    value={newTerm.target}
                    onChange={(e) => setNewTerm({ ...newTerm, target: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="term-notes">Notes (optional)</label>
                  <input
                    id="term-notes"
                    type="text"
                    placeholder="Context or usage notes"
                    value={newTerm.notes}
                    onChange={(e) => setNewTerm({ ...newTerm, notes: e.target.value })}
                  />
                </div>
                <button
                  className="add-term-btn"
                  onClick={addTerm}
                >
                  Add Term
                </button>
              </div>

              {filteredTerms.length === 0 ? (
                <div className="no-terms">
                  {searchQuery ? 'No terms match your search' : 'No terms added yet'}
                </div>
              ) : (
                <div className="terms-table">
                  <div className="terms-header">
                    <div className="source-column">Source (English)</div>
                    <div className="target-column">
                      Target ({languages[currentGlossary.targetLanguage]?.name})
                    </div>
                    <div className="notes-column">Notes</div>
                    <div className="actions-column">Actions</div>
                  </div>
                  <div className="terms-body">
                    {filteredTerms.map(term => (
                      <div key={term.id} className="term-row">
                        <div className="source-column">
                          {editingTerm && editingTerm.id === term.id ? (
                            <input
                              type="text"
                              value={editingTerm.source}
                              onChange={(e) => setEditingTerm({ ...editingTerm, source: e.target.value })}
                            />
                          ) : (
                            term.source
                          )}
                        </div>
                        <div className="target-column">
                          {editingTerm && editingTerm.id === term.id ? (
                            <input
                              type="text"
                              value={editingTerm.target}
                              onChange={(e) => setEditingTerm({ ...editingTerm, target: e.target.value })}
                            />
                          ) : (
                            term.target
                          )}
                        </div>
                        <div className="notes-column">
                          {editingTerm && editingTerm.id === term.id ? (
                            <input
                              type="text"
                              value={editingTerm.notes}
                              onChange={(e) => setEditingTerm({ ...editingTerm, notes: e.target.value })}
                            />
                          ) : (
                            term.notes || <span className="no-notes">-</span>
                          )}
                        </div>
                        <div className="actions-column">
                          {editingTerm && editingTerm.id === term.id ? (
                            <>
                              <button
                                className="save-btn"
                                onClick={updateTerm}
                              >
                                Save
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={() => setEditingTerm(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="edit-btn"
                                onClick={() => setEditingTerm({ ...term })}
                              >
                                Edit
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => deleteTerm(term.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Processing...</div>
        </div>
      )}
    </div>
  );
};

export default GlossaryManager;
