import React, { useState, useRef, useCallback } from 'react';
import { GitCompareArrows, Download, Copy, RefreshCw, Upload, ChevronRight, ChevronDown, Check, FileJson, Clipboard } from 'lucide-react';

// ─── Sample JSON for quick testing ───
const SAMPLE_A = JSON.stringify({
  name: "Aarav Sharma",
  age: 28,
  address: { city: "Chennai", state: "Tamil Nadu", pin: 600001 },
  skills: ["React", "Node.js", "Python"],
  experience: 5,
  active: true,
  metadata: { created: "2024-01-15", role: "developer" }
}, null, 2);

const SAMPLE_B = JSON.stringify({
  name: "Aarav Sharma",
  age: 29,
  address: { city: "Bengaluru", state: "Karnataka", pin: 560001 },
  skills: ["React", "Node.js", "Go"],
  active: true,
  salary: 1200000,
  metadata: { created: "2024-01-15", role: "senior-developer", team: "platform" }
}, null, 2);

// ─── Diff status constants ───
const DIFF = { ADDED: 'added', REMOVED: 'removed', MODIFIED: 'modified', UNCHANGED: 'unchanged' };

// ─── Deep compare engine ───
const deepCompare = (a, b, strictOrder = false) => {
  const results = [];

  const compare = (valA, valB, path = '$') => {
    const typeA = valA === null ? 'null' : Array.isArray(valA) ? 'array' : typeof valA;
    const typeB = valB === null ? 'null' : Array.isArray(valB) ? 'array' : typeof valB;

    // Both undefined (shouldn't happen in normal flow)
    if (valA === undefined && valB === undefined) return;

    // Added
    if (valA === undefined) {
      results.push({ path, status: DIFF.ADDED, valueB: valB, type: typeB });
      return;
    }

    // Removed
    if (valB === undefined) {
      results.push({ path, status: DIFF.REMOVED, valueA: valA, type: typeA });
      return;
    }

    // Type mismatch
    if (typeA !== typeB) {
      results.push({ path, status: DIFF.MODIFIED, valueA: valA, valueB: valB, type: 'type-change', typeA, typeB });
      return;
    }

    // Primitives + null
    if (typeA !== 'object' && typeA !== 'array') {
      if (valA !== valB) {
        results.push({ path, status: DIFF.MODIFIED, valueA: valA, valueB: valB, type: typeA });
      }
      return;
    }

    // Arrays
    if (typeA === 'array') {
      const maxLen = Math.max(valA.length, valB.length);
      let arrayDifferent = false;
      for (let i = 0; i < maxLen; i++) {
        const childPath = `${path}[${i}]`;
        const prevLen = results.length;
        compare(valA[i], valB[i], childPath);
        if (results.length > prevLen) arrayDifferent = true;
      }
      return;
    }

    // Objects
    const keysA = Object.keys(valA);
    const keysB = Object.keys(valB);
    const allKeys = [...new Set([...keysA, ...keysB])];

    // If strict mode, also compare key order
    if (strictOrder && keysA.length === keysB.length) {
      for (let i = 0; i < keysA.length; i++) {
        if (keysA[i] !== keysB[i]) {
          results.push({
            path: `${path}.__keyOrder__`,
            status: DIFF.MODIFIED,
            valueA: keysA,
            valueB: keysB,
            type: 'key-order'
          });
          break;
        }
      }
    }

    for (const key of allKeys) {
      compare(valA[key], valB[key], `${path}.${key}`);
    }
  };

  compare(a, b);
  return results;
};

// ─── TreeNode: collapsible diff node ───
const TreeNode = ({ diff, depth = 0 }) => {
  const [collapsed, setCollapsed] = useState(depth > 2);
  const isComplex = (diff.valueA && typeof diff.valueA === 'object') || (diff.valueB && typeof diff.valueB === 'object');
  const pathParts = diff.path.split('.');
  const key = pathParts[pathParts.length - 1].replace(/^\$/, 'root');

  const statusClass = `jc-diff-${diff.status}`;
  const statusBadge = {
    [DIFF.ADDED]: { label: 'ADDED', emoji: '+' },
    [DIFF.REMOVED]: { label: 'REMOVED', emoji: '−' },
    [DIFF.MODIFIED]: { label: 'CHANGED', emoji: '~' },
  }[diff.status];

  const formatVal = (v) => {
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'string') return `"${v}"`;
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v);
  };

  return (
    <div className={`jc-tree-node ${statusClass}`} style={{ paddingLeft: `${depth * 16}px` }}>
      <div className="jc-tree-row" onClick={() => isComplex && setCollapsed(!collapsed)}>
        <span className="jc-tree-toggle">
          {isComplex ? (collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />) : <span className="jc-tree-dot">•</span>}
        </span>
        <code className="jc-tree-key">{key}</code>
        {statusBadge && <span className={`jc-badge ${diff.status}`}>{statusBadge.emoji} {statusBadge.label}</span>}
      </div>
      {!collapsed && (
        <div className="jc-tree-values">
          {diff.status === DIFF.ADDED && (
            <div className="jc-val-line added">
              <span className="jc-val-prefix">+</span>
              <pre>{formatVal(diff.valueB)}</pre>
            </div>
          )}
          {diff.status === DIFF.REMOVED && (
            <div className="jc-val-line removed">
              <span className="jc-val-prefix">−</span>
              <pre>{formatVal(diff.valueA)}</pre>
            </div>
          )}
          {diff.status === DIFF.MODIFIED && (
            <>
              <div className="jc-val-line removed">
                <span className="jc-val-prefix">−</span>
                <pre>{formatVal(diff.valueA)}</pre>
              </div>
              <div className="jc-val-line added">
                <span className="jc-val-prefix">+</span>
                <pre>{formatVal(diff.valueB)}</pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───
const JsonComparator = () => {
  const [jsonA, setJsonA] = useState('');
  const [jsonB, setJsonB] = useState('');
  const [diffs, setDiffs] = useState(null);
  const [error, setError] = useState('');
  const [strictMode, setStrictMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('all'); // all | added | removed | modified
  const fileRefA = useRef(null);
  const fileRefB = useRef(null);

  // ─── File upload handler ───
  const handleFileUpload = useCallback((side) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      // Validate JSON
      try {
        JSON.parse(text);
        side === 'a' ? setJsonA(text) : setJsonB(text);
        setError('');
      } catch {
        setError(`Invalid JSON in uploaded file "${file.name}"`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset for re-upload
  }, []);

  // ─── Compare ───
  const handleCompare = useCallback(() => {
    setError('');
    setDiffs(null);
    setCopied(false);

    if (!jsonA.trim() || !jsonB.trim()) {
      setError('Please paste or upload JSON in both panels.');
      return;
    }

    let parsedA, parsedB;
    try { parsedA = JSON.parse(jsonA); } catch { setError('Invalid JSON in Panel A.'); return; }
    try { parsedB = JSON.parse(jsonB); } catch { setError('Invalid JSON in Panel B.'); return; }

    const results = deepCompare(parsedA, parsedB, strictMode);
    setDiffs(results);
  }, [jsonA, jsonB, strictMode]);

  // ─── Clear ───
  const handleClear = () => { setJsonA(''); setJsonB(''); setDiffs(null); setError(''); setCopied(false); };

  // ─── Load sample ───
  const handleLoadSample = () => { setJsonA(SAMPLE_A); setJsonB(SAMPLE_B); setDiffs(null); setError(''); };

  // ─── Format / pretty print ───
  const handleFormat = (side) => {
    try {
      if (side === 'a') setJsonA(JSON.stringify(JSON.parse(jsonA), null, 2));
      else setJsonB(JSON.stringify(JSON.parse(jsonB), null, 2));
    } catch { setError(`Invalid JSON in Panel ${side.toUpperCase()}.`); }
  };

  // ─── Copy result ───
  const handleCopy = () => {
    if (!diffs) return;
    const text = JSON.stringify(diffs, null, 2);
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // ─── Download diff ───
  const handleDownload = (format) => {
    if (!diffs) return;
    const payload = format === 'json'
      ? JSON.stringify({ timestamp: new Date().toISOString(), strict: strictMode, differences: diffs }, null, 2)
      : diffs.map(d => `[${d.status.toUpperCase()}] ${d.path}: ${d.valueA !== undefined ? JSON.stringify(d.valueA) : ''} → ${d.valueB !== undefined ? JSON.stringify(d.valueB) : ''}`).join('\n');

    const blob = new Blob([payload], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `json-diff-${Date.now()}.${format === 'json' ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ─── Stat counts ───
  const counts = diffs ? {
    added: diffs.filter(d => d.status === DIFF.ADDED).length,
    removed: diffs.filter(d => d.status === DIFF.REMOVED).length,
    modified: diffs.filter(d => d.status === DIFF.MODIFIED).length,
  } : null;

  const filteredDiffs = diffs ? (filter === 'all' ? diffs : diffs.filter(d => d.status === filter)) : [];

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>JSON Compare Tool</h1>
        <p>Deep-compare two JSON objects — view added, removed, and modified fields in a tree diff.</p>
      </div>

      {/* ── Error bar ── */}
      {error && (
        <div className="jc-error-bar">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="jc-toolbar glass-panel">
        <div className="jc-toolbar-left">
          <label className="jc-switch-label">
            <input type="checkbox" checked={strictMode} onChange={e => setStrictMode(e.target.checked)} />
            <span className="jc-switch-slider"></span>
            Strict Mode
          </label>
          <button className="jc-text-btn" onClick={handleLoadSample}>
            <FileJson size={15} /> Load Sample
          </button>
        </div>
        <div className="jc-toolbar-right">
          <button className="premium-button jc-compare-btn" onClick={handleCompare}>
            <GitCompareArrows size={18} /> Compare
          </button>
          <button className="jc-outline-btn" onClick={handleClear}>
            <RefreshCw size={16} /> Clear
          </button>
        </div>
      </div>

      {/* ── Editor panels ── */}
      <div className="jc-panels">
        {/* Panel A */}
        <div className="jc-panel glass-panel">
          <div className="jc-panel-header">
            <h3>JSON A</h3>
            <div className="jc-panel-actions">
              <button className="jc-icon-btn" onClick={() => handleFormat('a')} title="Format JSON">{ }</button>
              <button className="jc-icon-btn" onClick={() => fileRefA.current?.click()} title="Upload JSON file">
                <Upload size={15} />
              </button>
              <input type="file" ref={fileRefA} accept=".json,.txt" style={{ display: 'none' }} onChange={handleFileUpload('a')} />
            </div>
          </div>
          <textarea
            className="jc-editor"
            value={jsonA}
            onChange={e => setJsonA(e.target.value)}
            placeholder='{\n  "name": "value",\n  ...\n}'
            spellCheck={false}
          />
        </div>

        {/* Panel B */}
        <div className="jc-panel glass-panel">
          <div className="jc-panel-header">
            <h3>JSON B</h3>
            <div className="jc-panel-actions">
              <button className="jc-icon-btn" onClick={() => handleFormat('b')} title="Format JSON">{ }</button>
              <button className="jc-icon-btn" onClick={() => fileRefB.current?.click()} title="Upload JSON file">
                <Upload size={15} />
              </button>
              <input type="file" ref={fileRefB} accept=".json,.txt" style={{ display: 'none' }} onChange={handleFileUpload('b')} />
            </div>
          </div>
          <textarea
            className="jc-editor"
            value={jsonB}
            onChange={e => setJsonB(e.target.value)}
            placeholder='{\n  "name": "other-value",\n  ...\n}'
            spellCheck={false}
          />
        </div>
      </div>

      {/* ── Results ── */}
      {diffs && (
        <div className="jc-results glass-panel">
          {/* Summary bar */}
          <div className="jc-results-header">
            <h3>Diff Results</h3>
            <div className="jc-stats">
              <button className={`jc-stat added ${filter === 'added' ? 'active' : ''}`} onClick={() => setFilter(f => f === 'added' ? 'all' : 'added')}>
                + {counts.added} Added
              </button>
              <button className={`jc-stat removed ${filter === 'removed' ? 'active' : ''}`} onClick={() => setFilter(f => f === 'removed' ? 'all' : 'removed')}>
                − {counts.removed} Removed
              </button>
              <button className={`jc-stat modified ${filter === 'modified' ? 'active' : ''}`} onClick={() => setFilter(f => f === 'modified' ? 'all' : 'modified')}>
                ~ {counts.modified} Modified
              </button>
            </div>
            <div className="jc-results-actions">
              <button className="jc-icon-btn" onClick={handleCopy} title="Copy to clipboard">
                {copied ? <Check size={16} /> : <Clipboard size={16} />}
              </button>
              <button className="jc-icon-btn" onClick={() => handleDownload('json')} title="Download as JSON">
                <Download size={16} />
              </button>
              <button className="jc-text-btn small" onClick={() => handleDownload('txt')}>
                .txt
              </button>
            </div>
          </div>

          {/* Diff tree */}
          <div className="jc-diff-tree">
            {filteredDiffs.length === 0 ? (
              <div className="jc-no-diff">
                {diffs.length === 0
                  ? '✅ JSON objects are identical — no differences found.'
                  : `No ${filter} differences.`}
              </div>
            ) : (
              filteredDiffs.map((d, i) => <TreeNode key={d.path + i} diff={d} depth={d.path.split('.').length - 1} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonComparator;
