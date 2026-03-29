import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import PriceDashboard from './features/PriceDashboard';
import InterestCalculator from './features/InterestCalculator';
import HomeLoanCalculator from './features/HomeLoanCalculator';
import BmiCalculator from './features/BmiCalculator';
import InstaTags from './features/InstaTags';
import QrGenerator from './features/QrGenerator';
import ImageCompressor from './features/ImageCompressor';
import RandomPicker from './features/RandomPicker';
import './App.css';

function App() {
  const [currentFeature, setCurrentFeature] = useState('dashboard');

  const renderFeature = () => {
    switch(currentFeature) {
      case 'dashboard': return <PriceDashboard />;
      case 'interest': return <InterestCalculator />;
      case 'homeloan': return <HomeLoanCalculator />;
      case 'bmi': return <BmiCalculator />;
      case 'tags': return <InstaTags />;
      case 'qr': return <QrGenerator />;
      case 'compress': return <ImageCompressor />;
      case 'random': return <RandomPicker />;
      default: return <PriceDashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar currentFeature={currentFeature} setCurrentFeature={setCurrentFeature} />
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
