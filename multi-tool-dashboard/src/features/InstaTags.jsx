import React, { useState } from 'react';
import { Copy, Tag, Check, RefreshCw } from 'lucide-react';
import '../Features.css';

const InstaTags = () => {
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock tag generation based on intent mapping
  const tagDb = {
    nature: ['#nature', '#naturephotography', '#landscape', '#outdoors', '#mountains', '#forest', '#wildlife', '#adventure', '#mothernature', '#earth'],
    fitness: ['#fitness', '#gym', '#workout', '#fit', '#fitnessmotivation', '#motivation', '#bodybuilding', '#training', '#health', '#fitfam'],
    food: ['#food', '#foodporn', '#foodie', '#instafood', '#foodphotography', '#foodstagram', '#yummy', '#delicious', '#foodblogger', '#foodlover'],
    travel: ['#travel', '#travelphotography', '#photography', '#nature', '#travelgram', '#love', '#photooftheday', '#instatravel', '#wanderlust', '#trip'],
    fashion: ['#fashion', '#style', '#ootd', '#fashionblogger', '#model', '#fashionista', '#photography', '#beauty', '#beautiful', '#instafashion'],
    default: ['#instagood', '#photooftheday', '#beautiful', '#happy', '#cute', '#tbt', '#like4like', '#followme', '#picoftheday', '#me']
  };

  const generateTags = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setCopied(false);
    
    // Simulate generation delay
    setTimeout(() => {
      const keyword = topic.toLowerCase();
      let selectedTags = tagDb.default;
      
      for (const key of Object.keys(tagDb)) {
        if (keyword.includes(key)) {
          selectedTags = tagDb[key];
          break;
        }
      }
      
      // Mix with general tags
      const mixed = [...new Set([...selectedTags, ...tagDb.default])].sort(() => 0.5 - Math.random()).slice(0, 15);
      
      setTags(mixed);
      setIsGenerating(false);
    }, 600);
  };

  const copyToClipboard = () => {
    if (tags.length === 0) return;
    navigator.clipboard.writeText(tags.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>Hashtag Generator</h1>
        <p>Instantly generate highly-optimized tags for your next Instagram post.</p>
      </div>

      <div className="tags-layout">
        <form onSubmit={generateTags} className="tags-input-section panel glass-panel">
          <div className="input-group">
            <label>Describe your post or topic</label>
            <textarea 
              className="premium-input tags-textarea" 
              placeholder="e.g. A gorgeous sunset over the rocky mountains"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
            />
          </div>
          
          <button 
            type="submit" 
            className="premium-button w-full generate-btn"
            disabled={!topic.trim() || isGenerating}
          >
            {isGenerating ? <RefreshCw className="spin" size={20} /> : <Tag size={20} />}
            <span>{isGenerating ? 'Generating magic...' : 'Generate Tags'}</span>
          </button>
        </form>

        <div className="tags-result-section panel glass-panel">
          <div className="tags-header">
            <h3>Generated Hashtags</h3>
            <button 
              className={`copy-btn ${copied ? 'success' : ''}`}
              onClick={copyToClipboard}
              disabled={tags.length === 0}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Mix'}</span>
            </button>
          </div>
          
          <div className="tags-container">
            {tags.length > 0 ? (
              tags.map((tag, idx) => (
                <span key={idx} className="hashtag animate-fade-in" style={{animationDelay: `${idx * 0.05}s`}}>
                  {tag}
                </span>
              ))
            ) : (
              <div className="empty-tags">
                <p>Generated hashtags will appear here.</p>
              </div>
            )}
          </div>
          {tags.length > 0 && (
            <div className="tags-string-view">
              <p>{tags.join(' ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstaTags;
