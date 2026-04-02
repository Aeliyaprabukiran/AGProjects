import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Receipt, LayoutDashboard, Percent, Scale, Hash, Home, QrCode, ImageDown, Dices, GitCompareArrows, GripVertical, Newspaper } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// ─── Default tool order ───
const DEFAULT_NAV_ITEMS = [
  { id: 'jewellery', label: 'Jewellery Billing', icon: Receipt },
  { id: 'dashboard', label: 'Price Dashboard', icon: LayoutDashboard },
  { id: 'interest', label: 'Interest Calc', icon: Percent },
  { id: 'homeloan', label: 'Home Loan Calc', icon: Home },
  { id: 'bmi', label: 'BMI Calculator', icon: Scale },
  { id: 'tags', label: 'Insta Tags', icon: Hash },
  { id: 'qr', label: 'QR Generator', icon: QrCode },
  { id: 'compress', label: 'Image Compress', icon: ImageDown },
  { id: 'jsoncompare', label: 'JSON Compare', icon: GitCompareArrows },
  { id: 'devnews', label: 'Dev News', icon: Newspaper },
  { id: 'random', label: 'Random Picker', icon: Dices }
];

const STORAGE_KEY = '7ya-nav-order';

// ─── Icon lookup for restoring from localStorage ───
const ICON_MAP = {
  jewellery: Receipt, dashboard: LayoutDashboard, interest: Percent,
  homeloan: Home, bmi: Scale, tags: Hash, qr: QrCode,
  compress: ImageDown, jsoncompare: GitCompareArrows, devnews: Newspaper, random: Dices
};

// ─── Load persisted order ───
const loadOrder = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_NAV_ITEMS;
    const ids = JSON.parse(saved);
    // Rebuild from saved IDs, preserving icon references
    const itemMap = {};
    DEFAULT_NAV_ITEMS.forEach(item => { itemMap[item.id] = item; });
    const ordered = ids.map(id => itemMap[id]).filter(Boolean);
    // Append any new tools not in saved order
    DEFAULT_NAV_ITEMS.forEach(item => {
      if (!ordered.find(o => o.id === item.id)) ordered.push(item);
    });
    return ordered;
  } catch {
    return DEFAULT_NAV_ITEMS;
  }
};

const saveOrder = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(i => i.id)));
};

const Sidebar = ({ currentFeature, setCurrentFeature, isDarkMode, setIsDarkMode }) => {
  const [navItems, setNavItems] = useState(loadOrder);

  // ─── Drag state ───
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragNodeRef = useRef(null);
  const touchStartY = useRef(0);
  const touchItemRefs = useRef([]);

  // ─── Reorder logic ───
  const reorder = useCallback((fromIdx, toIdx) => {
    if (fromIdx === toIdx || fromIdx === null || toIdx === null) return;
    setNavItems(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      saveOrder(updated);
      return updated;
    });
  }, []);

  // ═══════════════════════════════════
  //  MOUSE DRAG (HTML5 Drag & Drop)
  // ═══════════════════════════════════
  const handleDragStart = useCallback((e, idx) => {
    setDragIndex(idx);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Ghost image: use the element itself
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    // Slight delay so the dragging class applies after snapshot
    requestAnimationFrame(() => {
      if (dragNodeRef.current) dragNodeRef.current.classList.add('dragging');
    });
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(idx);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null) {
      reorder(dragIndex, overIndex);
    }
    if (dragNodeRef.current) dragNodeRef.current.classList.remove('dragging');
    setDragIndex(null);
    setOverIndex(null);
    dragNodeRef.current = null;
  }, [dragIndex, overIndex, reorder]);

  // ═══════════════════════════════════
  //  TOUCH DRAG (for mobile)
  // ═══════════════════════════════════
  const handleTouchStart = useCallback((e, idx) => {
    // Only activate on the grip handle
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    setDragIndex(idx);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (dragIndex === null) return;
    
    // Determine if we are in horizontal mode (mobile) or vertical (desktop)
    const isMobileNav = window.innerWidth <= 768;
    
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    // Find which item the finger is over
    for (let i = 0; i < touchItemRefs.current.length; i++) {
      const el = touchItemRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      
      let isOver = false;
      if (isMobileNav) {
        // Horizontal check
        isOver = clientX >= rect.left && clientX <= rect.right;
      } else {
        // Vertical check
        isOver = clientY >= rect.top && clientY <= rect.bottom;
      }

      if (isOver) {
        setOverIndex(i);
        // Only prevent default if we've actually moved enough to be "dragging"
        // and we're over a target to avoid blocking scrolling unless intended
        if (e.cancelable) e.preventDefault();
        break;
      }
    }
  }, [dragIndex]);

  const handleTouchEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null) {
      reorder(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, reorder]);

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-circle"></div>
        <h2>7yaTools</h2>
      </div>
      
      <nav
        className="sidebar-nav"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = currentFeature === item.id;
          const isDragging = dragIndex === idx;
          const isOver = overIndex === idx && dragIndex !== null && dragIndex !== idx;

          return (
            <div
              key={item.id}
              ref={el => touchItemRefs.current[idx] = el}
              className={`nav-btn-wrapper ${isDragging ? 'is-dragging' : ''} ${isOver ? 'is-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, idx)}
            >
              <button
                onClick={() => setCurrentFeature(item.id)}
                className={`nav-btn ${isActive ? 'active' : ''}`}
              >
                <GripVertical size={14} className="drag-handle" />
                <Icon size={20} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>
      
      <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      
      <div className="sidebar-footer">
        <p>7yaTools Premium</p>
      </div>
    </aside>
  );
};

export default Sidebar;
