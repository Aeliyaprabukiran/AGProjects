import React from 'react';
import { Moon, Sun } from 'lucide-react';
import '../styles/ThemeToggle.css';

const ThemeToggle = ({ isDarkMode, setIsDarkMode }) => {
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun size={20} className="theme-icon" />
      ) : (
        <Moon size={20} className="theme-icon" />
      )}
    </button>
  );
};

export default ThemeToggle;
