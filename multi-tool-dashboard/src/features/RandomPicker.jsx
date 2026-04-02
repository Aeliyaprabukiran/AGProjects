import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Users, RefreshCw, Wand2, Upload as UploadIcon,
  Settings, Trash2, Plus, UsersRound, Settings2,
  Download, Moon, Sun, Copy, Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Papa from 'papaparse';
import '../Features.css';

const TABS = [
  { id: 'spinner', label: 'Spinner', icon: RefreshCw },
  { id: 'instant', label: 'Instant Pick', icon: Wand2 },
  { id: 'teams', label: 'Team Maker', icon: UsersRound },
];

const LOCAL_STORAGE_KEY = '7ya-random-picker-names';

const RandomPicker = () => {
  // ----- State: Core List -----
  const [names, setNames] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['kiran', 'Vijay', 'Madhan', 'Aravind', 'Kishiv'];
    } catch {
      return ['kiran', 'Vijay', 'Madhan', 'Aravind', 'Kishiv'];
    }
  });

  const [inputName, setInputName] = useState('');
  const [activeTab, setActiveTab] = useState('spinner');

  // ----- State: Spinner Mode -----
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const canvasRef = useRef(null);

  // ----- State: Instant Mode -----
  const [instantPick, setInstantPick] = useState(null);
  const [isCycling, setIsCycling] = useState(false);

  // ----- State: Team Mode -----
  const [teamGroupingData, setTeamGroupingData] = useState(2);
  const [teamMode, setTeamMode] = useState('teamCount'); // 'teamCount' or 'playersPerTeam'
  const [generatedTeams, setGeneratedTeams] = useState(null);

  // Save names to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(names));
    drawWheel(); // update wheel when names change
  }, [names]);

  // Handle Resize for canvas
  useEffect(() => {
    window.addEventListener('resize', drawWheel);
    return () => window.removeEventListener('resize', drawWheel);
  }, [names]);

  // ---------- Celebrations ----------
  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ffc0cb', '#ff69b4', '#4169e1', '#00bfff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffc0cb', '#ff69b4', '#4169e1', '#00bfff']
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const popConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      zIndex: 10000
    });
  };

  // ---------- Helpers ----------
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // ---------- List Management ----------
  const handleAddName = (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    const newNames = inputName.split(',').map(n => n.trim()).filter(Boolean);
    setNames([...names, ...newNames]);
    setInputName('');
  };

  const handleRemoveName = (index) => {
    setNames(names.filter((_, i) => i !== index));
    setWinner(null);
  };

  const handleClearNames = () => {
    if (window.confirm('Clear all names?')) {
      setNames([]);
      setWinner(null);
      setGeneratedTeams(null);
    }
  };

  // ---------- CSV Upload ----------
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        // Flatten 2D array and filter empty
        const parsedNames = results.data
          .flat()
          .map(val => (val || '').trim())
          .filter(val => val.length > 0);
        
        if (parsedNames.length > 0) {
          // If first row was a header like "Name", remove it
          if (parsedNames[0].toLowerCase() === 'name') parsedNames.shift();
          
          setNames((prev) => [...prev, ...parsedNames]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: () => {
        alert("Could not read file. Make sure it's a valid CSV/TXT.");
      }
    });
  };

  // ---------- Spinner Feature ----------
  const drawWheel = useCallback(() => {
    if (activeTab !== 'spinner' || !canvasRef.current || names.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Auto-detect size
    const size = Math.min(canvas.parentElement.offsetWidth, 500);
    // For crispness on high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const sliceAngle = (2 * Math.PI) / names.length;

    // Palette
    const colors = [
      '#FF4136', '#FF851B', '#FFDC00', '#2ECC40', '#0074D9',
      '#B10DC9', '#01FF70', '#7FDBFF', '#F012BE', '#39CCCC'
    ];

    ctx.clearRect(0, 0, size, size);

    // Draw slices
    requestAnimationFrame(() => {
      names.forEach((name, i) => {
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();

        // Ensure text is right-side up and visible
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(12, 18 - Math.floor(names.length / 5))}px system-ui, sans-serif`;
        
        // Shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        
        // Truncate long names
        const maxLen = 15;
        const displayName = name.length > maxLen ? name.substring(0, maxLen) + '...' : name;
        ctx.fillText(displayName, radius - 20, 6);
        ctx.restore();
      });

      // Draw middle dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.closePath();
    });
  }, [names, activeTab]);

  // Initial draw
  useEffect(() => { drawWheel(); }, [drawWheel]);

  const spinWheel = () => {
    if (isSpinning || names.length < 2) return;
    setIsSpinning(true);
    setWinner(null);

    // Give it a strong spin (minimum 5 rotations + random angle)
    const extraSpins = 360 * 6; 
    const randomStop = Math.random() * 360;
    const targetRotation = rotation + extraSpins + randomStop;

    setRotation(targetRotation);

    // Wait for CSS transition (4s) to finish
    setTimeout(() => {
      setIsSpinning(false);
      // Calc winner: The marker is at the TOP (270 degrees in canvas space).
      // Canvas starts 0 at right (3 o'clock). Top is -90 deg from 0.
      // Rotation value revolves counter-clockwise in DOM visually depending on transform.
      const normalizedRot = targetRotation % 360;
      // Because we rotate the canvas element, a slice originally at angle A
      // is now at A + offset. The top of the wheel is at 270 deg (or -90 deg).
      // Find the slice that overlaps the top pointer.
      const sliceAngle = 360 / names.length;
      
      // We reverse the rotation to find what's at the top (which is pointer angle 270)
      const offset = (360 - normalizedRot + 270) % 360;
      const winnerIndex = Math.floor(offset / sliceAngle);

      setWinner(names[winnerIndex]);
      triggerConfetti();
    }, 4100);
  };

  // ---------- Instant Mode Feature ----------
  const pickInstant = () => {
    if (names.length === 0 || isCycling) return;
    setIsCycling(true);
    setInstantPick(null);
    setWinner(null);

    // Cycled animation
    let count = 0;
    const maxCycles = 20;
    const interval = setInterval(() => {
      setInstantPick(names[Math.floor(Math.random() * names.length)]);
      count++;
      if (count >= maxCycles) {
        clearInterval(interval);
        // Final pick
        const finalWinner = names[Math.floor(Math.random() * names.length)];
        setInstantPick(finalWinner);
        setWinner(finalWinner);
        setIsCycling(false);
        popConfetti();
      }
    }, 100); // 2 second total animation
  };

  // ---------- Teams Feature ----------
  const generateTeams = () => {
    if (names.length === 0) return;
    const num = Math.max(1, Number(teamGroupingData));
    
    let numberOfTeams;
    if (teamMode === 'teamCount') {
      numberOfTeams = num;
    } else {
      numberOfTeams = Math.ceil(names.length / num);
    }

    const shuffled = shuffleArray(names);
    const newTeams = Array.from({ length: numberOfTeams }, () => []);

    // Distribute evenly
    shuffled.forEach((name, idx) => {
      newTeams[idx % numberOfTeams].push(name);
    });

    setGeneratedTeams(newTeams);
    popConfetti();
  };

  // ========== RENDER ==========
  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>Random Generator</h1>
        <p>Pick a random person, spin the wheel, or create balanced teams instantly.</p>
      </div>

      <div className="rp-workspace">
        {/* Left: Input Sidebar */}
        <div className="rp-sidebar panel glass-panel">
          <div className="rp-sidebar-header">
            <h3>Paticipants ({names.length})</h3>
            <div className="rp-actions">
              <button className="rp-icon-btn text-danger" onClick={handleClearNames} title="Clear All">
                <Trash2 size={16} />
              </button>
              <button className="rp-icon-btn text-primary" onClick={() => fileInputRef.current?.click()} title="Import CSV/TXT">
                <UploadIcon size={16} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.txt" hidden />
            </div>
          </div>

          <form className="rp-add-form" onSubmit={handleAddName}>
            <input
              type="text"
              className="premium-input rp-input"
              placeholder="Enter name(s) separated by comma..."
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
            />
            <button type="submit" className="rp-add-btn">
              <Plus size={18} />
            </button>
          </form>

          <div className="rp-list custom-scrollbar">
            {names.length === 0 ? (
              <div className="rp-empty">
                <Users size={32} />
                <p>No participants yet.<br />Add names to get started.</p>
              </div>
            ) : (
              names.map((name, idx) => (
                <div key={idx} className="rp-list-item">
                  <span className="rp-item-num">{idx + 1}.</span>
                  <span className="rp-item-name">{name}</span>
                  <button className="rp-del-btn" onClick={() => handleRemoveName(idx)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Active Feature Area */}
        <div className="rp-main panel glass-panel">
          
          {/* Tabs */}
          <div className="rp-tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`rp-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setWinner(null);
                  }}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="rp-content">
            
            {/* SPINNER MODE */}
            {activeTab === 'spinner' && (
              <div className="rp-spinner-mode">
                <div className="rp-wheel-container">
                  <div className="rp-pointer"></div>
                  <canvas
                    ref={canvasRef}
                    className="rp-wheel-canvas"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none',
                    }}
                  />
                  {names.length === 0 && (
                    <div className="rp-wheel-overlay">
                      <p>Add names to spin</p>
                    </div>
                  )}
                </div>

                <div className="rp-controls">
                  <button 
                    className={`premium-button generate-btn rp-huge-btn ${isSpinning || names.length < 2 ? 'disabled' : ''}`}
                    onClick={spinWheel}
                    disabled={isSpinning || names.length < 2}
                  >
                    {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL!'}
                  </button>
                </div>

                {winner && !isSpinning && (
                  <div className="rp-winner-alert scale-in">
                    <Trophy size={28} className="text-warning" />
                    <div className="rp-winner-details">
                      <h4>Winner Selected!</h4>
                      <h2>{winner}</h2>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* INSTANT MODE */}
            {activeTab === 'instant' && (
              <div className="rp-instant-mode">
                <div className="rp-instant-display">
                  {instantPick ? (
                    <h2 className={`rp-instant-name ${isCycling ? 'cycling' : 'winner-pulse'}`}>
                      {instantPick}
                    </h2>
                  ) : (
                    <h2 className="rp-instant-placeholder">
                      {names.length > 0 ? "Ready to pick?" : "Add names first"}
                    </h2>
                  )}
                </div>

                <button 
                  className={`premium-button generate-btn rp-huge-btn ${isCycling || names.length === 0 ? 'disabled' : ''}`}
                  onClick={pickInstant}
                  disabled={isCycling || names.length === 0}
                >
                  <Wand2 size={24} /> 
                  {isCycling ? 'Selecting...' : 'PICK RANDOM PERSON'}
                </button>

                {winner && !isCycling && (
                  <div className="rp-winner-alert mt-4 bounce-in">
                    <Trophy size={28} className="text-warning" />
                    <div className="rp-winner-details">
                      <h4>We have a winner!</h4>
                      <h2>{winner}</h2>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEAMS MODE */}
            {activeTab === 'teams' && (
              <div className="rp-teams-mode">
                <div className="rp-team-settings">
                  <select 
                    className="premium-input rp-select"
                    value={teamMode} 
                    onChange={(e) => setTeamMode(e.target.value)}
                  >
                    <option value="teamCount">Number of Teams</option>
                    <option value="playersPerTeam">Players per Team</option>
                  </select>
                  
                  <input
                    type="number"
                    className="premium-input rp-number"
                    min="1"
                    max={Math.max(1, names.length)}
                    value={teamGroupingData}
                    onChange={(e) => setTeamGroupingData(Number(e.target.value))}
                  />

                  <button 
                    className="premium-button generate-btn" 
                    onClick={generateTeams}
                    disabled={names.length === 0}
                  >
                    <UsersRound size={18} /> GENERATE TEAMS
                  </button>
                </div>

                {generatedTeams && (
                  <div className="rp-teams-grid fade-in">
                    {generatedTeams.map((team, idx) => (
                      <div key={idx} className="rp-team-card">
                        <div className="rp-team-header">
                          <h4>Team {String.fromCharCode(65 + idx)}</h4>
                          <span className="rp-team-count">{team.length} members</span>
                        </div>
                        <ul className="rp-team-members custom-scrollbar">
                          {team.length === 0 ? (
                            <li className="rp-no-members">No members</li>
                          ) : (
                            team.map((member, i) => (
                              <li key={i}>{member}</li>
                            ))
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {names.length === 0 && !generatedTeams && (
                  <div className="rp-empty-state">
                    <UsersRound size={48} className="text-secondary opacity-50 mb-4" />
                    <h3>No participants</h3>
                    <p>Add some people to the list on the left to start building teams.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default RandomPicker;
