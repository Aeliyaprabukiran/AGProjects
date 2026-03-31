import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import JewelleryCalculator from './features/JewelleryCalculator';
import PriceDashboard from './features/PriceDashboard';
import InterestCalculator from './features/InterestCalculator';
import HomeLoanCalculator from './features/HomeLoanCalculator';
import BmiCalculator from './features/BmiCalculator';
import InstaTags from './features/InstaTags';
import QrGenerator from './features/QrGenerator';
import ImageCompressor from './features/ImageCompressor';
import JsonComparator from './features/JsonComparator';
import DevNews from './features/DevNews';
import RandomPicker from './features/RandomPicker';
import './Features.css';
import './App.css';

function App() {
  const [currentFeature, setCurrentFeature] = useState('jewellery');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [marketPrices, setMarketPrices] = useState({
    gold24k: { current: 6250.50, change: 'Live', isUp: true },
    gold22k: { current: 5720.00, change: 'Live', isUp: true },
    silver: { current: 74.80, change: 'Live', isUp: false },
    dollar: { current: 83.20, change: 'Live', isUp: true }
  });
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  // Initialize theme from localStorage and apply to document
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    setIsDarkMode(initialDarkMode);
    applyTheme(initialDarkMode);
  }, []);

  // Update theme when isDarkMode changes
  useEffect(() => {
    applyTheme(isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Global Market Price Fetcher
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsLoadingPrices(true);
        const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        const inrRate = data.usd.inr;
        const xauRate = data.usd.xau; 
        const xagRate = data.usd.xag; 
        const gramsPerOz = 31.1034768;
        
        const gold1gInr = (inrRate / xauRate) / gramsPerOz;
        const silver1gInr = (inrRate / xagRate) / gramsPerOz;
        const gold22kInr = gold1gInr * (22 / 24);

        setMarketPrices(prev => ({
          gold24k: {
            current: gold1gInr,
            change: prev.gold24k.current ? (((gold1gInr - prev.gold24k.current) / prev.gold24k.current) * 100).toFixed(2) + '%' : 'Live',
            isUp: prev.gold24k.current ? gold1gInr >= prev.gold24k.current : true
          },
          gold22k: {
            current: gold22kInr,
            change: prev.gold22k.current ? (((gold22kInr - prev.gold22k.current) / prev.gold22k.current) * 100).toFixed(2) + '%' : 'Live',
            isUp: prev.gold22k.current ? gold22kInr >= prev.gold22k.current : true
          },
          silver: {
            current: silver1gInr,
            change: prev.silver.current ? (((silver1gInr - prev.silver.current) / prev.silver.current) * 100).toFixed(2) + '%' : 'Live',
            isUp: prev.silver.current ? silver1gInr >= prev.silver.current : true
          },
          dollar: {
            current: inrRate,
            change: prev.dollar.current ? (((inrRate - prev.dollar.current) / prev.dollar.current) * 100).toFixed(2) + '%' : 'Live',
            isUp: prev.dollar.current ? inrRate >= prev.dollar.current : true
          }
        }));

        setLastUpdate(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Failed to fetch market data:", error);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const applyTheme = (darkMode) => {
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  };

  const renderFeature = () => {
    switch(currentFeature) {
      case 'jewellery': return <JewelleryCalculator liveGoldPrice24k={marketPrices.gold24k.current} />;
      case 'dashboard': return <PriceDashboard prices={marketPrices} isLoading={isLoadingPrices} lastUpdate={lastUpdate} />;
      case 'interest': return <InterestCalculator />;
      case 'homeloan': return <HomeLoanCalculator />;
      case 'bmi': return <BmiCalculator />;
      case 'tags': return <InstaTags />;
      case 'qr': return <QrGenerator />;
      case 'compress': return <ImageCompressor />;
      case 'jsoncompare': return <JsonComparator />;
      case 'devnews': return <DevNews />;
      case 'random': return <RandomPicker />;
      default: return <PriceDashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        currentFeature={currentFeature} 
        setCurrentFeature={setCurrentFeature}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <main className="main-content">
        <div className="feature-container animate-fade-in" key={currentFeature}>
          {renderFeature()}
        </div>
      </main>
      
      {/* Right Sidebar for Google Ads */}
      <aside className="ads-sidebar">
        <div className="ad-box glass-panel">
          <p className="ad-placeholder">Google AdSense<br/>(300x600 px)</p>
          {/* Insert Google AdSense <ins> tag here */}
        </div>
      </aside>
    </div>
  );
}

export default App;
