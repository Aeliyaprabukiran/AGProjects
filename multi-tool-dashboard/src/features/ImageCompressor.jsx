import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Download, Image as ImageIcon, ArrowRight, Maximize2,
  Lock, Unlock, RotateCcw, Trash2, Zap, FileImage, ChevronDown
} from 'lucide-react';
import '../Features.css';

const OUTPUT_FORMATS = [
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
];

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const ImageCompressor = () => {
  // File state
  const [originalFile, setOriginalFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ w: 0, h: 0 });
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressedBlob, setCompressedBlob] = useState(null);

  // Settings
  const [quality, setQuality] = useState(80);
  const [compressionMode, setCompressionMode] = useState('quality');
  const [targetSizeKB, setTargetSizeKB] = useState('');
  const [outputFormat, setOutputFormat] = useState('image/jpeg');
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [lockAspect, setLockAspect] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Drag-and-drop
  const [isDragging, setIsDragging] = useState(false);

  // Comparison slider
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const fileInputRef = useRef(null);
  const comparisonRef = useRef(null);

  // ---------- File handling ----------

  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setOriginalFile(file);
    setCompressedUrl(null);
    setCompressedSize(0);
    setCompressedBlob(null);
    setSliderPos(50);

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    const img = new window.Image();
    img.onload = () => {
      setOriginalDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      setResizeWidth(String(img.naturalWidth));
      setResizeHeight(String(img.naturalHeight));
    };
    img.src = url;
  }, []);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleClear = () => {
    setOriginalFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setOriginalUrl(null);
    setCompressedUrl(null);
    setCompressedSize(0);
    setCompressedBlob(null);
    setResizeWidth('');
    setResizeHeight('');
    setSliderPos(50);
    setTargetSizeKB('');
    setCompressionMode('quality');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------- Aspect ratio lock ----------

  const handleWidthChange = (val) => {
    setResizeWidth(val);
    if (lockAspect && originalDimensions.w > 0 && val) {
      const ratio = originalDimensions.h / originalDimensions.w;
      setResizeHeight(String(Math.round(Number(val) * ratio)));
    }
  };

  const handleHeightChange = (val) => {
    setResizeHeight(val);
    if (lockAspect && originalDimensions.h > 0 && val) {
      const ratio = originalDimensions.w / originalDimensions.h;
      setResizeWidth(String(Math.round(Number(val) * ratio)));
    }
  };

  const resetDimensions = () => {
    setResizeWidth(String(originalDimensions.w));
    setResizeHeight(String(originalDimensions.h));
  };

  // ---------- Compression ----------

  const compressImage = useCallback(async () => {
    if (!originalUrl) return;
    setIsProcessing(true);

    // Small delay so spinner shows
    await new Promise((r) => setTimeout(r, 100));

    const img = new window.Image();
    img.src = originalUrl;
    await new Promise((r) => { img.onload = r; });

    const canvas = document.createElement('canvas');
    const w = Number(resizeWidth) || img.naturalWidth;
    const h = Number(resizeHeight) || img.naturalHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    const onBlobReady = (blob) => {
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
      setCompressedSize(blob.size);
      setCompressedBlob(blob);
      setIsProcessing(false);
    };

    if (compressionMode === 'target' && targetSizeKB && outputFormat !== 'image/png') {
      const targetBytes = Number(targetSizeKB) * 1024;
      let minQ = 0.01;
      let maxQ = 1.0;
      let bestBlob = null;
      let bestDiff = Infinity;

      for (let i = 0; i < 8; i++) {
        const q = (minQ + maxQ) / 2;
        const blob = await new Promise((r) => canvas.toBlob(r, outputFormat, q));
        if (!blob) break;

        const diff = Math.abs(blob.size - targetBytes);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestBlob = blob;
        }

        if (blob.size > targetBytes) {
          maxQ = q - 0.05;
        } else {
          minQ = q + 0.05;
        }
      }

      if (bestBlob) {
        onBlobReady(bestBlob);
      } else {
        canvas.toBlob(onBlobReady, outputFormat, 0.8);
      }
    } else {
      const q = outputFormat === 'image/png' ? undefined : quality / 100;
      canvas.toBlob(onBlobReady, outputFormat, q);
    }
  }, [originalUrl, resizeWidth, resizeHeight, quality, outputFormat, compressedUrl, compressionMode, targetSizeKB]);

  // ---------- Download ----------

  const handleDownload = () => {
    if (!compressedBlob) return;
    const fmt = OUTPUT_FORMATS.find((f) => f.value === outputFormat);
    const ext = fmt?.ext || 'jpg';
    const baseName = originalFile?.name?.replace(/\.[^.]+$/, '') || 'compressed';
    const link = document.createElement('a');
    link.download = `${baseName}-compressed.${ext}`;
    link.href = compressedUrl;
    link.click();
  };

  // ---------- Comparison slider mouse/touch ----------

  const handleSliderMove = useCallback((clientX) => {
    if (!comparisonRef.current) return;
    const rect = comparisonRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  useEffect(() => {
    if (!isDraggingSlider) return;
    const onMove = (e) => handleSliderMove(e.touches ? e.touches[0].clientX : e.clientX);
    const onUp = () => setIsDraggingSlider(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDraggingSlider, handleSliderMove]);

  // ---------- Stats ----------

  const savings = originalFile && compressedSize
    ? Math.round((1 - compressedSize / originalFile.size) * 100)
    : 0;

  const savingsColor = savings > 0
    ? 'var(--accent-success)'
    : savings < 0
      ? 'var(--accent-danger)'
      : 'var(--text-secondary)';

  // ---------- Render ----------

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>Image Compressor</h1>
        <p>Compress, resize & convert images instantly — 100% client-side, your files never leave your device.</p>
      </div>

      {/* ── No file: Dropzone ── */}
      {!originalFile && (
        <div
          className={`ic-dropzone ${isDragging ? 'ic-dropzone--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          id="ic-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            hidden
          />
          <div className="ic-dropzone-icon">
            <Upload size={40} strokeWidth={1.5} />
          </div>
          <h3>Drop your image here</h3>
          <p>or <span className="ic-link">browse files</span></p>
          <span className="ic-dropzone-hint">Supports JPEG, PNG, WebP, GIF, BMP, SVG</span>
        </div>
      )}

      {/* ── File loaded: Controls + Preview ── */}
      {originalFile && (
        <div className="ic-workspace">
          {/* Left Controls */}
          <div className="ic-controls panel glass-panel">
            {/* File info pill */}
            <div className="ic-file-info">
              <FileImage size={18} />
              <span className="ic-file-name">{originalFile.name}</span>
              <span className="ic-file-size">{formatBytes(originalFile.size)}</span>
              <button className="ic-clear-btn" onClick={handleClear} title="Remove image">
                <Trash2 size={15} />
              </button>
            </div>

            {/* Output Format */}
            <div className="input-group">
              <label>Output Format</label>
              <div className="ic-format-pills">
                {OUTPUT_FORMATS.map((f) => (
                  <button
                    key={f.value}
                    className={`ic-format-pill ${outputFormat === f.value ? 'active' : ''}`}
                    onClick={() => {
                      setOutputFormat(f.value);
                      if (f.value === 'image/png' && compressionMode === 'target') {
                        setCompressionMode('quality');
                      }
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compression Mode */}
            <div className="input-group mt-4">
              <label>Compression Mode</label>
              <div className="ic-format-pills">
                <button
                  className={`ic-format-pill ${compressionMode === 'quality' ? 'active' : ''}`}
                  onClick={() => setCompressionMode('quality')}
                >
                  By Quality
                </button>
                <button
                  className={`ic-format-pill ${compressionMode === 'target' ? 'active' : ''}`}
                  onClick={() => {
                    setCompressionMode('target');
                    if (outputFormat === 'image/png') setOutputFormat('image/jpeg');
                  }}
                >
                  Target Size
                </button>
              </div>
            </div>

            {/* Quality or Target Size Input */}
            {compressionMode === 'quality' ? (
              <div className="input-group mt-4">
                <div className="ic-slider-header">
                  <label>Quality</label>
                  <span className="ic-slider-val">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="premium-slider"
                  disabled={outputFormat === 'image/png'}
                />
                {outputFormat === 'image/png' && (
                  <span className="ic-hint">PNG is lossless — quality slider disabled</span>
                )}
              </div>
            ) : (
              <div className="input-group mt-4">
                <div className="ic-slider-header">
                  <label>Target Size (KB)</label>
                </div>
                <input
                  type="number"
                  className="premium-input"
                  placeholder="e.g. 500"
                  value={targetSizeKB}
                  onChange={(e) => setTargetSizeKB(e.target.value)}
                  min="1"
                />
                <span className="ic-hint">Auto-adjusts quality to hit target size.</span>
              </div>
            )}

            {/* Resize */}
            <div className="input-group">
              <div className="ic-slider-header">
                <label><Maximize2 size={14} style={{ marginRight: 6 }} />Resize (px)</label>
                <button className="ic-mini-btn" onClick={resetDimensions} title="Reset to original">
                  <RotateCcw size={13} />
                </button>
              </div>
              <div className="ic-resize-row">
                <div className="ic-resize-field">
                  <span className="ic-resize-label">W</span>
                  <input
                    type="number"
                    className="premium-input ic-resize-input"
                    value={resizeWidth}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    min="1"
                  />
                </div>
                <button
                  className={`ic-lock-btn ${lockAspect ? 'locked' : ''}`}
                  onClick={() => setLockAspect(!lockAspect)}
                  title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                >
                  {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <div className="ic-resize-field">
                  <span className="ic-resize-label">H</span>
                  <input
                    type="number"
                    className="premium-input ic-resize-input"
                    value={resizeHeight}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Compress button */}
            <button
              className="premium-button generate-btn w-full mt-4"
              onClick={compressImage}
              disabled={isProcessing}
              id="ic-compress-btn"
            >
              {isProcessing ? (
                <><Zap size={18} className="spin" /> Processing…</>
              ) : (
                <><Zap size={18} /> Compress &amp; Convert</>
              )}
            </button>

            {/* Replace image */}
            <button
              className="ic-replace-btn mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} /> Upload different image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              hidden
            />
          </div>

          {/* Right: Preview / Comparison */}
          <div className="ic-preview panel glass-panel">
            {compressedUrl ? (
              /* ── Before/After comparison ── */
              <div className="ic-comparison-wrap">
                {/* Stats bar */}
                <div className="ic-stats-bar">
                  <div className="ic-stat">
                    <span className="ic-stat-label">Original</span>
                    <span className="ic-stat-value">{formatBytes(originalFile.size)}</span>
                  </div>
                  <div className="ic-stat ic-stat-arrow">
                    <ArrowRight size={20} />
                  </div>
                  <div className="ic-stat">
                    <span className="ic-stat-label">Compressed</span>
                    <span className="ic-stat-value">{formatBytes(compressedSize)}</span>
                  </div>
                  <div className="ic-stat ic-stat-savings" style={{ color: savingsColor }}>
                    <span className="ic-stat-label">Saved</span>
                    <span className="ic-stat-value ic-savings-num">
                      {savings > 0 ? `−${savings}%` : savings < 0 ? `+${Math.abs(savings)}%` : '0%'}
                    </span>
                  </div>
                </div>

                {/* Comparison slider */}
                <div
                  className="ic-comparison"
                  ref={comparisonRef}
                  onMouseDown={(e) => { setIsDraggingSlider(true); handleSliderMove(e.clientX); }}
                  onTouchStart={(e) => { setIsDraggingSlider(true); handleSliderMove(e.touches[0].clientX); }}
                >
                  {/* Compressed (background) */}
                  <img src={compressedUrl} alt="Compressed" className="ic-comp-img ic-comp-img--full" draggable={false} />

                  {/* Original (clipped) */}
                  <div className="ic-comp-clip" style={{ width: `${sliderPos}%` }}>
                    <img src={originalUrl} alt="Original" className="ic-comp-img" draggable={false} />
                    <span className="ic-comp-label ic-comp-label--left">Original</span>
                  </div>

                  {/* Slider handle */}
                  <div className="ic-slider-line" style={{ left: `${sliderPos}%` }}>
                    <div className="ic-slider-handle">
                      <ChevronDown size={12} style={{ transform: 'rotate(90deg)' }} />
                      <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                    </div>
                  </div>

                  <span className="ic-comp-label ic-comp-label--right">Compressed</span>
                </div>

                {/* Download */}
                <button className="premium-button generate-btn w-full mt-4" onClick={handleDownload}>
                  <Download size={18} />
                  Download Compressed Image
                </button>
              </div>
            ) : (
              /* ── Original preview ── */
              <div className="ic-original-preview">
                <img src={originalUrl} alt="Original preview" className="ic-preview-img" />
                <div className="ic-preview-badge">
                  <ImageIcon size={14} />
                  {originalDimensions.w} × {originalDimensions.h}px
                </div>
                <p className="ic-preview-hint">Adjust settings and hit <strong>Compress & Convert</strong></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
