import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
const PriceDashboard = ({ prices, isLoading, lastUpdate }) => {
  const generateHistoricalData = (baseRate24k) => {
    const result = [];
    const today = new Date();
    
    // Fixed offsets (simulating a known market trend shape for demo)
    const offsets = [
      { k24: 0, k22: 0 },
      { k24: 251, k22: 230 },
      { k24: 87, k22: 80 },
      { k24: -273, k22: -250 },
      { k24: 381, k22: 350 },
      { k24: -97, k22: -90 },
      { k24: -305, k22: -280 },
      { k24: 0, k22: 0 },
      { k24: -360, k22: -330 },
      { k24: 54, k22: 50 },
    ];
  
    let current24k = Math.round(baseRate24k) || 14902;
    
    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const current22k = Math.round(current24k * (22/24));
      
      result.push({
        id: i,
        date: dateStr,
        rate24k: current24k,
        change24k: offsets[i].k24,
        rate22k: current22k,
        change22k: offsets[i].k22
      });
      
      // Compute previous day's price for the next loop
      current24k = current24k - offsets[i].k24;
    }
    
    return result;
  };

  const [historyWeight, setHistoryWeight] = useState(1);

  const Card = ({ title, data, symbol }) => (
    <div className="price-card">
      <div className="card-header">
        <h3>{title}</h3>
        {symbol}
      </div>
      <div className="card-body">
        <h2 className="current-price">
          ₹{data.current ? data.current.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
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

      <div className="history-table-container panel glass-panel mt-8">
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)'}}>
            Gold Rate in Metro City for Last 10 Days ({historyWeight} gram{historyWeight > 1 ? 's' : ''})
          </h3>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <select 
              className="premium-input" 
              style={{padding: '6px 12px', width: 'auto', minWidth: '100px'}}
              value={historyWeight}
              onChange={(e) => setHistoryWeight(Number(e.target.value))}
            >
              <option value={1}>1 Gram</option>
              <option value={8}>8 Grams (1 Sov)</option>
              <option value={10}>10 Grams</option>
            </select>
            {lastUpdate && <span className="text-secondary" style={{fontSize: '0.85rem'}}>Live Sync: {lastUpdate}</span>}
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="gold-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>24K</th>
                <th>22K</th>
              </tr>
            </thead>
            <tbody>
              {generateHistoricalData(prices.gold24k.current).map(row => {
                const r24 = row.rate24k * historyWeight;
                const c24 = row.change24k * historyWeight;
                const r22 = row.rate22k * historyWeight;
                const c22 = row.change22k * historyWeight;

                return (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>
                    ₹{r24.toLocaleString('en-IN')} 
                    <span className={`hist-change ${c24 > 0 ? 'hist-up' : c24 < 0 ? 'hist-down' : 'hist-flat'}`}>
                      ({c24 > 0 ? '+' : ''}{c24.toLocaleString('en-IN')})
                    </span>
                  </td>
                  <td>
                    ₹{r22.toLocaleString('en-IN')} 
                    <span className={`hist-change ${c22 > 0 ? 'hist-up' : c22 < 0 ? 'hist-down' : 'hist-flat'}`}>
                      ({c22 > 0 ? '+' : ''}{c22.toLocaleString('en-IN')})
                    </span>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PriceDashboard;
