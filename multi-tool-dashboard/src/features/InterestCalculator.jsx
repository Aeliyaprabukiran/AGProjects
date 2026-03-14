import React, { useState } from 'react';
import '../Features.css';

const InterestCalculator = () => {
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(5);
  const [time, setTime] = useState(5);
  const [type, setType] = useState('simple'); // simple or compound

  const [result, setResult] = useState(null);

  const calculate = (e) => {
    e.preventDefault();
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(time);

    if (isNaN(p) || isNaN(r) || isNaN(t)) return;

    let interestRaw = 0;
    let totalRaw = 0;

    if (type === 'simple') {
      interestRaw = p * r * t;
      totalRaw = p + interestRaw;
    } else {
      // Compound interest compounded annually
      totalRaw = p * Math.pow(1 + r, t);
      interestRaw = totalRaw - p;
    }

    setResult({
      interest: interestRaw.toFixed(2),
      total: totalRaw.toFixed(2)
    });
  };

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>Interest Calculator</h1>
        <p>Calculate simple or compound interest to forecast your financial growth.</p>
      </div>

      <div className="calc-layout">
        <div className="calc-input-section panel glass-panel">
          <form onSubmit={calculate}>
            <div className="toggle-group">
              <button 
                type="button"
                className={`toggle-btn ${type === 'simple' ? 'active' : ''}`}
                onClick={() => setType('simple')}
              >
                Simple Interest
              </button>
              <button 
                type="button"
                className={`toggle-btn ${type === 'compound' ? 'active' : ''}`}
                onClick={() => setType('compound')}
              >
                Compound Interest
              </button>
            </div>

            <div className="input-group">
              <label>Principal Amount (₹)</label>
              <input 
                type="number" 
                className="premium-input" 
                value={principal} 
                onChange={(e) => setPrincipal(e.target.value)} 
                required 
              />
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label>Annual Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="premium-input" 
                  value={rate} 
                  onChange={(e) => setRate(e.target.value)} 
                  required 
                />
              </div>
              <div className="input-group">
                <label>Time (Years)</label>
                <input 
                  type="number" 
                  className="premium-input" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="premium-button w-full mt-4">
              Calculate Growth
            </button>
          </form>
        </div>

        <div className="calc-result-section panel glass-panel">
          {result ? (
            <div className="result-display animate-fade-in">
              <h3>Calculation Result</h3>
              <div className="result-metric primary">
                <span>Total Balance</span>
                <h2>₹{parseFloat(result.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              </div>
              
              <div className="result-breakdown">
                <div className="breakdown-item">
                  <span>Principal</span>
                  <strong>₹{parseFloat(principal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div className="breakdown-item accent">
                  <span>Interest Earned</span>
                  <strong>+₹{parseFloat(result.interest).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div className="chart-representation">
                <div className="pie-mockup">
                  <div className="pie-center">
                    <span>{type}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <p>Enter your details and click calculate to see your potential growth.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterestCalculator;
