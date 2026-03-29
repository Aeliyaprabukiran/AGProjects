import React, { useState, useRef } from 'react';
import { Compare2, Download, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';

const JsonComparator = () => {
  const [jsonA, setJsonA] = useState('{\n  "name": "Product",\n  "price": 100\n}');
  const [jsonB, setJsonB] = useState('{\n  "name": "Product",\n  "price": 120,\n  "color": "red"\n}');
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState('');
  const [strictMode, setStrictMode] = useState(false);
  const [ignoreOrder, setIgnoreOrder] = useState(false);
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const resultsRef = useRef(null);

  // Deep comparison function
  const deepCompare = (obj1, obj2, strict = false) => {
    const added = {};
    const removed = {};
    const modified = {};

    const compareObjects = (a, b, path = '') => {
      // Handle null/undefined
      if (a === null || b === null) {
        if (a !== b) {
          modified[path || 'root'] = {
            old: a,
            new: b,
            type: 'value'
          };
        }
        return;
      }

      // Get all keys
      const keysA = Object.keys(a || {});
      const keysB = Object.keys(b || {});
      const allKeys = new Set([...keysA, ...keysB]);

      allKeys.forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        const valueA = a?.[key];
        const valueB = b?.[key];

        // Key added
        if (!(key in (a || {})) && key in (b || {})) {
          added[newPath] = valueB;
        }
        // Key removed
        else if (key in (a || {}) && !(key in (b || {}))) {
          removed[newPath] = valueA;
        }
        // Both exist - compare values
        else if (key in (a || {}) && key in (b || {})) {
          const typeA = typeof valueA;
          const typeB = typeof valueB;

          if (typeA !== typeB) {
            modified[newPath] = {
              old: valueA,
              new: valueB,
              type: 'type-change'
            };
          } else if (typeA === 'object') {
            if (Array.isArray(valueA) && Array.isArray(valueB)) {
              // Array comparison
              if (JSON.stringify(valueA) !== JSON.stringify(valueB)) {
                modified[newPath] = {
                  old: valueA,
                  new: valueB,
                  type: 'array'
                };
              }
            } else if (valueA !== null && valueB !== null) {
              // Nested object
              compareObjects(valueA, valueB, newPath);
            }
          } else if (valueA !== valueB) {
            // Primitive value comparison
            if (strict || typeA !== 'string' || typeA !== 'number') {
              modified[newPath] = {
                old: valueA,
                new: valueB,
                type: 'value'
              };
            } else if (!strict && valueA !== valueB) {
              modified[newPath] = {
                old: valueA,
                new: valueB,
                type: 'value'
              };
            }
          }
        }
      });
    };

    try {
      compareObjects(obj1, obj2);
      return { added, removed, modified };
    } catch (err) {
      throw new Error(`Comparison error: ${err.message}`);
    }
  };

  // Validate and compare
  const handleCompare = () => {
    setError('');
    setComparison(null);

    try {
      const parsedA = JSON.parse(jsonA);
      const parsedB = JSON.parse(jsonB);

      const result = deepCompare(parsedA, parsedB, strictMode);
      
      const hasChanges = Object.keys(result.added).length > 0 ||
                        Object.keys(result.removed).length > 0 ||
                        Object.keys(result.modified).length > 0;

      setComparison({
        ...result,
        hasChanges,
        total: Object.keys(result.added).length + 
               Object.keys(result.removed).length + 
               Object.keys(result.modified).length
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Download comparison result
  const handleDownload = () => {
    if (!comparison) return;

    const downloadData = {
      timestamp: new Date().toISOString(),
      mode: strictMode ? 'strict' : 'loose',
      comparison
    };

    const dataStr = JSON.stringify(downloadData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `json-comparison-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy result to clipboard
  const handleCopyResult = () => {
    if (!comparison) return;
    const text = JSON.stringify(comparison, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert('Comparison result copied to clipboard!');
    });
  };

  // Pretty print JSON
  const handlePrettyPrintA = () => {
    try {
      const parsed = JSON.parse(jsonA);
      setJsonA(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setError('Invalid JSON in A');
    }
  };

  const handlePrettyPrintB = () => {
    try {
      const parsed = JSON.parse(jsonB);
      setJsonB(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setError('Invalid JSON in B');
    }
  };

  // Reset all
  const handleReset = () => {
    setJsonA('{}');
    setJsonB('{}');
    setComparison(null);
    setError('');
  };

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1><Compare2 size={32} /> JSON Comparator</h1>
        <p>Compare two JSON objects and identify differences</p>
      </div>

      {error && (
        <div className="error-box">
          <span>❌ {error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="jcomp-controls glass-panel">
        <div className="jcomp-controls-row">
          <label className="jcomp-checkbox">
            <input type="checkbox" checked={strictMode} onChange={(e) => setStrictMode(e.target.checked)} />
            Strict Mode (Type Sensitive)
          </label>
          <label className="jcomp-checkbox">
            <input type="checkbox" checked={ignoreOrder} onChange={(e) => setIgnoreOrder(e.target.checked)} />
            Ignore Key Order
          </label>
          <label className="jcomp-checkbox">
            <input type="checkbox" checked={prettyPrint} onChange={(e) => setPrettyPrint(e.target.checked)} />
            Pretty Print
          </label>
        </div>

        <div className="jcomp-button-group">
          <button className="premium-button" onClick={handleCompare}>
            <Compare2 size={18} /> Compare
          </button>
          <button className="secondary-button" onClick={handleReset}>
            <RefreshCw size={18} /> Reset
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="jcomp-grid">
        {/* JSON A */}
        <div className="jcomp-editor-section">
          <div className="jcomp-editor-header">
            <h3>JSON A</h3>
            <button className="jcomp-small-btn" onClick={handlePrettyPrintA} title="Pretty Print">
              ✨ Format
            </button>
          </div>
          <textarea
            className="jcomp-editor"
            value={jsonA}
            onChange={(e) => setJsonA(e.target.value)}
            placeholder="Paste JSON A here..."
            spellCheck="false"
          />
        </div>

        {/* JSON B */}
        <div className="jcomp-editor-section">
          <div className="jcomp-editor-header">
            <h3>JSON B</h3>
            <button className="jcomp-small-btn" onClick={handlePrettyPrintB} title="Pretty Print">
              ✨ Format
            </button>
          </div>
          <textarea
            className="jcomp-editor"
            value={jsonB}
            onChange={(e) => setJsonB(e.target.value)}
            placeholder="Paste JSON B here..."
            spellCheck="false"
          />
        </div>
      </div>

      {/* Results Section */}
      {comparison && (
        <div className="jcomp-results glass-panel" ref={resultsRef}>
          <div className="jcomp-results-header">
            <h3>Comparison Results</h3>
            <div className="jcomp-summary">
              <span className="jcomp-summary-item added">✓ {Object.keys(comparison.added).length} Added</span>
              <span className="jcomp-summary-item removed">✖ {Object.keys(comparison.removed).length} Removed</span>
              <span className="jcomp-summary-item modified">⚠ {Object.keys(comparison.modified).length} Modified</span>
            </div>
            <div className="jcomp-results-actions">
              <button className="jcomp-small-btn" onClick={handleCopyResult} title="Copy Result">
                <Copy size={16} /> Copy
              </button>
              <button className="jcomp-small-btn" onClick={handleDownload} title="Download Result">
                <Download size={16} /> Download
              </button>
              <button className="jcomp-small-btn" onClick={() => setShowRaw(!showRaw)} title="Toggle Raw View">
                <Eye size={16} /> {showRaw ? 'Pretty' : 'Raw'}
              </button>
            </div>
          </div>

          {showRaw ? (
            // Raw JSON view
            <div className="jcomp-raw-result">
              <pre>{JSON.stringify(comparison, null, 2)}</pre>
            </div>
          ) : (
            // Formatted view
            <div className="jcomp-formatted-result">
              {comparison.total === 0 ? (
                <div className="jcomp-no-changes">✓ No differences found - JSON objects are identical!</div>
              ) : (
                <>
                  {/* Added */}
                  {Object.keys(comparison.added).length > 0 && (
                    <div className="jcomp-section">
                      <h4 className="jcomp-section-title added">🟢 Added Keys ({Object.keys(comparison.added).length})</h4>
                      <div className="jcomp-items">
                        {Object.entries(comparison.added).map(([key, value]) => (
                          <div key={key} className="jcomp-item added">
                            <code className="jcomp-key">{key}</code>
                            <code className="jcomp-value">{JSON.stringify(value)}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Removed */}
                  {Object.keys(comparison.removed).length > 0 && (
                    <div className="jcomp-section">
                      <h4 className="jcomp-section-title removed">🔴 Removed Keys ({Object.keys(comparison.removed).length})</h4>
                      <div className="jcomp-items">
                        {Object.entries(comparison.removed).map(([key, value]) => (
                          <div key={key} className="jcomp-item removed">
                            <code className="jcomp-key">{key}</code>
                            <code className="jcomp-value">{JSON.stringify(value)}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modified */}
                  {Object.keys(comparison.modified).length > 0 && (
                    <div className="jcomp-section">
                      <h4 className="jcomp-section-title modified">🟡 Modified Keys ({Object.keys(comparison.modified).length})</h4>
                      <div className="jcomp-items">
                        {Object.entries(comparison.modified).map(([key, diff]) => (
                          <div key={key} className="jcomp-item modified">
                            <div className="jcomp-modified-content">
                              <code className="jcomp-key">{key}</code>
                              <div className="jcomp-diff-pair">
                                <div className="jcomp-old">
                                  <span className="jcomp-label">Old:</span>
                                  <code>{JSON.stringify(diff.old)}</code>
                                </div>
                                <div className="jcomp-arrow">→</div>
                                <div className="jcomp-new">
                                  <span className="jcomp-label">New:</span>
                                  <code>{JSON.stringify(diff.new)}</code>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonComparator;
