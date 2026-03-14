import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import '../Features.css';

const PriceDashboard = () => {
  const [prices, setPrices] = useState({
    gold24k: { current: 6250.50, change: '+12.30', isUp: true },
    gold22k: { current: 5720.00, change: '+10.50', isUp: true },
    silver: { current: 74.80, change: '-0.15', isUp: false }, // 1 gram
    dollar: { current: 83.20, change: '+0.15', isUp: true }
  });

  // Mocking real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => ({
        gold24k: {
          current: prev.gold24k.current + (Math.random() - 0.5) * 5,
          change: prev.gold24k.change,
          isUp: prev.gold24k.isUp
        },
        gold22k: {
          current: prev.gold22k.current + (Math.random() - 0.5) * 4.5,
          change: prev.gold22k.change,
          isUp: prev.gold22k.isUp
        },
        silver: {
          current: prev.silver.current + (Math.random() - 0.5) * 0.1,
          change: prev.silver.change,
          isUp: prev.silver.isUp
        },
        dollar: {
          current: prev.dollar.current + (Math.random() - 0.5) * 0.2,
          change: prev.dollar.change,
          isUp: prev.dollar.isUp
        }
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const Card = ({ title, data, symbol }) => (
    <div className="price-card">
      <div className="card-header">
        <h3>{title}</h3>
        {symbol}
      </div>
      <div className="card-body">
        <h2 className="current-price">
          ₹{data.current.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <div className={`price-change ${data.isUp ? 'positive' : 'negative'}`}>
          {data.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{data.change}</span>
        </div>
      </div>
      <div className="mini-chart">
        {/* Mock visual sparkline */}
        <svg viewBox="0 0 100 30" className={`sparkline ${data.isUp ? 'up' : 'down'}`}>
          <path d="M0,25 Q10,10 20,20 T40,15 T60,25 T80,10 T100,5" fill="none" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>Market Dashboard</h1>
        <p>Live tracking of 1g Gold (22k/24k), 1g Silver, and USD to INR prices.</p>
      </div>
      
      <div className="cards-grid gold-split">
        <Card title="Gold 24K (1g INR)" data={prices.gold24k} symbol={<span className="symbol gold">Au</span>} />
        <Card title="Gold 22K (1g INR)" data={prices.gold22k} symbol={<span className="symbol gold">Au</span>} />
        <Card title="Silver (1g INR)" data={prices.silver} symbol={<span className="symbol silver">Ag</span>} />
        <Card title="US Dollar (USD/INR)" data={prices.dollar} symbol={<DollarSign className="symbol usd" size={24} />} />
      </div>

      <div className="market-overview panel glass-panel mt-8">
        <h3>Market Overview</h3>
        <p>Market sentiment is currently bullish on precious metals amidst steady Dollar movement. Prices update every 3 seconds to simulate a live market feed.</p>
        <div className="mock-chart-large">
          <div className="chart-bars">
            <div className="bar" style={{height: '40%'}}></div>
            <div className="bar" style={{height: '60%'}}></div>
            <div className="bar" style={{height: '35%'}}></div>
            <div className="bar" style={{height: '80%'}}></div>
            <div className="bar" style={{height: '65%'}}></div>
            <div className="bar" style={{height: '90%'}}></div>
            <div className="bar" style={{height: '75%'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceDashboard;
