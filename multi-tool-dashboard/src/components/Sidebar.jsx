import React from 'react';
import { LayoutDashboard, Percent, Scale, Hash, Home, QrCode, ImageDown, Dices } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Sidebar = ({ currentFeature, setCurrentFeature, isDarkMode, setIsDarkMode }) => {
  const navItems = [
    { id: 'dashboard', label: 'Price Dashboard', icon: LayoutDashboard },
    { id: 'interest', label: 'Interest Calc', icon: Percent },
    { id: 'homeloan', label: 'Home Loan Calc', icon: Home },
    { id: 'bmi', label: 'BMI Calculator', icon: Scale },
    { id: 'tags', label: 'Insta Tags', icon: Hash },
    { id: 'qr', label: 'QR Generator', icon: QrCode },
    { id: 'compress', label: 'Image Compress', icon: ImageDown },
    { id: 'random', label: 'Random Picker', icon: Dices }
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-circle"></div>
        <h2>7yaTools</h2>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentFeature === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentFeature(item.id)}
              className={`nav-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} className="nav-icon" />
              <span>{item.label}</span>
            </button>
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
