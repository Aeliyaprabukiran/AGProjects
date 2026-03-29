import React, { useState, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, RefreshCw, Link, UserRound } from 'lucide-react';
import '../Features.css';

const COLOR_PRESETS = [
  { name: 'Classic', fg: '#ffffff', bg: 'transparent' },
  { name: 'Ocean', fg: '#0ea5e9', bg: 'transparent' },
  { name: 'Emerald', fg: '#10b981', bg: 'transparent' },
  { name: 'Sunset', fg: '#f97316', bg: 'transparent' },
  { name: 'Rose', fg: '#f43f5e', bg: 'transparent' },
  { name: 'Violet', fg: '#8b5cf6', bg: 'transparent' },
];

const EMPTY_CONTACT = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  organization: '',
  title: '',
  website: '',
  address: '',
};

/** Build a vCard 3.0 string from contact fields */
const buildVCard = (c) => {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
  ];
  if (c.firstName || c.lastName) {
    lines.push(`N:${c.lastName};${c.firstName};;;`);
    lines.push(`FN:${[c.firstName, c.lastName].filter(Boolean).join(' ')}`);
  }
  if (c.organization) lines.push(`ORG:${c.organization}`);
  if (c.title) lines.push(`TITLE:${c.title}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`);
  if (c.email) lines.push(`EMAIL:${c.email}`);
  if (c.website) lines.push(`URL:${c.website}`);
  if (c.address) lines.push(`ADR;TYPE=HOME:;;${c.address};;;;`);
  lines.push('END:VCARD');
  return lines.join('\n');
};

const QrGenerator = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'contact'

  // Text mode
  const [text, setText] = useState('');

  // Contact mode
  const [contact, setContact] = useState({ ...EMPTY_CONTACT });

  // Shared
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrPayload, setQrPayload] = useState(''); // what was encoded
  const [copied, setCopied] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customFg, setCustomFg] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState('M');
  const [qrSize, setQrSize] = useState(280);
  const canvasRef = useRef(null);

  /** Core generate function */
  const generateQR = useCallback(async (value, presetIdx, fgOverride, errLvl, size) => {
    const input = value ?? (activeTab === 'text' ? text : buildVCard(contact));

    if (!input.trim()) {
      setQrDataUrl(null);
      setQrPayload('');
      return;
    }

    const fg = fgOverride ?? customFg;
    const level = errLvl ?? errorLevel;
    const dim = size ?? qrSize;
    const pIdx = presetIdx ?? selectedPreset;

    try {
      const foreground = pIdx === 0 ? fg : COLOR_PRESETS[pIdx].fg;

      const url = await QRCode.toDataURL(input, {
        width: dim,
        margin: 2,
        color: {
          dark: foreground,
          light: '#00000000',
        },
        errorCorrectionLevel: level,
      });
      setQrDataUrl(url);
      setQrPayload(input);
    } catch (err) {
      console.error(err);
    }
  }, [text, contact, activeTab, selectedPreset, customFg, errorLevel, qrSize]);

  const handleGenerate = () => generateQR();

  /** Check if current input is valid for generation */
  const canGenerate = () => {
    if (activeTab === 'text') return text.trim().length > 0;
    // Contact: at least a name or phone
    return (contact.firstName.trim() || contact.lastName.trim() || contact.phone.trim());
  };

  /** Preview label for the QR */
  const previewLabel = () => {
    if (activeTab === 'text') {
      return text.length > 60 ? text.slice(0, 60) + '…' : text;
    }
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    return name || contact.phone || 'Contact Card';
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    const suffix = activeTab === 'contact' ? 'contact' : 'code';
    link.download = `qr-${suffix}-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleCopy = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(qrPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePresetChange = (idx) => {
    setSelectedPreset(idx);
    if (canGenerate()) generateQR(undefined, idx);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setQrDataUrl(null);
    setQrPayload('');
  };

  const updateContact = (field, value) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>QR Generator</h1>
        <p>Generate beautiful QR codes for links, text, or contact cards instantly.</p>
      </div>

      <div className="qr-layout">
        {/* Left: Input */}
        <div className="qr-input-section panel glass-panel">

          {/* ── Tab Toggle ── */}
          <div className="toggle-group qr-tab-toggle">
            <button
              className={`toggle-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('text')}
            >
              <Link size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Text / URL
            </button>
            <button
              className={`toggle-btn ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('contact')}
            >
              <UserRound size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Contact Card
            </button>
          </div>

          {/* ── Text Mode ── */}
          {activeTab === 'text' && (
            <div className="input-group">
              <label htmlFor="qr-text-input">Content</label>
              <textarea
                id="qr-text-input"
                className="premium-input qr-textarea"
                placeholder="Enter URL, text, email, phone number…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
                }}
                rows={4}
              />
            </div>
          )}

          {/* ── Contact Card Mode ── */}
          {activeTab === 'contact' && (
            <div className="qr-contact-form">
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="qr-fname">First Name</label>
                  <input
                    id="qr-fname"
                    type="text"
                    className="premium-input"
                    placeholder="John"
                    value={contact.firstName}
                    onChange={(e) => updateContact('firstName', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="qr-lname">Last Name</label>
                  <input
                    id="qr-lname"
                    type="text"
                    className="premium-input"
                    placeholder="Doe"
                    value={contact.lastName}
                    onChange={(e) => updateContact('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="qr-phone">Phone Number</label>
                  <input
                    id="qr-phone"
                    type="tel"
                    className="premium-input"
                    placeholder="+91 98765 43210"
                    value={contact.phone}
                    onChange={(e) => updateContact('phone', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="qr-email">Email</label>
                  <input
                    id="qr-email"
                    type="email"
                    className="premium-input"
                    placeholder="john@example.com"
                    value={contact.email}
                    onChange={(e) => updateContact('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="qr-org">Organization</label>
                  <input
                    id="qr-org"
                    type="text"
                    className="premium-input"
                    placeholder="Company Name"
                    value={contact.organization}
                    onChange={(e) => updateContact('organization', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="qr-title">Job Title</label>
                  <input
                    id="qr-title"
                    type="text"
                    className="premium-input"
                    placeholder="Software Engineer"
                    value={contact.title}
                    onChange={(e) => updateContact('title', e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="qr-website">Website</label>
                <input
                  id="qr-website"
                  type="url"
                  className="premium-input"
                  placeholder="https://example.com"
                  value={contact.website}
                  onChange={(e) => updateContact('website', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="qr-address">Address</label>
                <input
                  id="qr-address"
                  type="text"
                  className="premium-input"
                  placeholder="123 Main Street, City, Country"
                  value={contact.address}
                  onChange={(e) => updateContact('address', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── Color Presets ── */}
          <div className="qr-presets-group">
            <label>Color Theme</label>
            <div className="qr-presets">
              {COLOR_PRESETS.map((p, idx) => (
                <button
                  key={p.name}
                  className={`qr-preset-btn ${selectedPreset === idx ? 'active' : ''}`}
                  onClick={() => handlePresetChange(idx)}
                  title={p.name}
                >
                  <span className="qr-preset-swatch" style={{ background: p.fg }} />
                  <span className="qr-preset-label">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedPreset === 0 && (
            <div className="input-group mt-4">
              <label htmlFor="qr-custom-color">Custom Foreground Color</label>
              <div className="qr-color-picker-row">
                <input
                  id="qr-custom-color"
                  type="color"
                  value={customFg}
                  onChange={(e) => {
                    setCustomFg(e.target.value);
                    if (canGenerate()) generateQR(undefined, 0, e.target.value);
                  }}
                  className="qr-color-input"
                />
                <span className="qr-color-hex">{customFg}</span>
              </div>
            </div>
          )}

          {/* ── Error Correction + Size ── */}
          <div className="input-row mt-4">
            <div className="input-group">
              <label htmlFor="qr-error-level">Error Correction</label>
              <select
                id="qr-error-level"
                className="premium-input"
                value={errorLevel}
                onChange={(e) => {
                  setErrorLevel(e.target.value);
                  if (canGenerate()) generateQR(undefined, selectedPreset, customFg, e.target.value);
                }}
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Size: {qrSize}px</label>
              <input
                type="range"
                min="150"
                max="500"
                value={qrSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQrSize(val);
                  if (canGenerate()) generateQR(undefined, selectedPreset, customFg, errorLevel, val);
                }}
                className="premium-slider"
              />
            </div>
          </div>

          <button
            id="qr-generate-btn"
            className="premium-button generate-btn w-full mt-6"
            onClick={handleGenerate}
            disabled={!canGenerate()}
          >
            <RefreshCw size={18} />
            Generate QR Code
          </button>
        </div>

        {/* Right: Preview */}
        <div className="qr-result-section panel glass-panel">
          {qrDataUrl ? (
            <div className="qr-preview-area animate-fade-in">
              <div className="qr-canvas-wrapper">
                <img
                  src={qrDataUrl}
                  alt="Generated QR Code"
                  className="qr-preview-img"
                  ref={canvasRef}
                />
                <div className="qr-glow" />
              </div>

              <p className="qr-preview-text">{previewLabel()}</p>

              {activeTab === 'contact' && (
                <div className="qr-contact-badge">
                  <UserRound size={14} />
                  <span>vCard Contact</span>
                </div>
              )}

              <div className="qr-actions">
                <button className="premium-button qr-action-btn" onClick={handleDownload}>
                  <Download size={16} />
                  Download PNG
                </button>
                <button
                  className={`copy-btn qr-action-btn ${copied ? 'success' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="qr-empty-icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="8" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                  <rect x="48" y="8" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                  <rect x="8" y="48" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                  <rect x="14" y="14" width="12" height="12" rx="2" fill="currentColor" opacity="0.15"/>
                  <rect x="54" y="14" width="12" height="12" rx="2" fill="currentColor" opacity="0.15"/>
                  <rect x="14" y="54" width="12" height="12" rx="2" fill="currentColor" opacity="0.15"/>
                  <rect x="48" y="48" width="6" height="6" fill="currentColor" opacity="0.2"/>
                  <rect x="58" y="48" width="6" height="6" fill="currentColor" opacity="0.2"/>
                  <rect x="48" y="58" width="6" height="6" fill="currentColor" opacity="0.2"/>
                  <rect x="68" y="58" width="6" height="6" fill="currentColor" opacity="0.2"/>
                  <rect x="58" y="68" width="6" height="6" fill="currentColor" opacity="0.2"/>
                </svg>
              </div>
              <p>
                {activeTab === 'text'
                  ? <>Enter some text or URL and hit <strong>Generate</strong> to create a QR code.</>
                  : <>Fill in the contact details and hit <strong>Generate</strong> to create a scannable contact card.</>
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrGenerator;
