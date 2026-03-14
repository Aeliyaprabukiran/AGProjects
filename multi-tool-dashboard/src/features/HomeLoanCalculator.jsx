import React, { useState } from 'react';
import '../Features.css';

const HomeLoanCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);

  const [result, setResult] = useState(null);

  const calculateEMI = (e) => {
    e.preventDefault();
    const p = parseFloat(loanAmount);
    const r = parseFloat(interestRate) / 12 / 100; // Monthly interest rate
    const n = parseFloat(loanTenure) * 12; // Tenure in months

    if (isNaN(p) || isNaN(r) || isNaN(n) || p <= 0 || r <= 0 || n <= 0) return;

    // EMI formula: P x R x (1+R)^N / [(1+R)^N-1]
    const emiRaw = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalAmountRaw = emiRaw * n;
    const totalInterestRaw = totalAmountRaw - p;

    setResult({
      emi: emiRaw.toFixed(0),
      totalInterest: totalInterestRaw.toFixed(0),
      totalAmount: totalAmountRaw.toFixed(0)
    });
  };

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>Home Loan EMI Calculator</h1>
        <p>Estimate your monthly payments, total interest, and total payable amount.</p>
      </div>

      <div className="calc-layout">
        <div className="calc-input-section panel glass-panel">
          <form onSubmit={calculateEMI}>
            <div className="input-group">
              <label>Home Loan Amount (₹)</label>
              <input 
                type="number" 
                className="premium-input" 
                value={loanAmount} 
                onChange={(e) => setLoanAmount(e.target.value)} 
                required 
              />
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label>Interest Rate (p.a %)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="premium-input" 
                  value={interestRate} 
                  onChange={(e) => setInterestRate(e.target.value)} 
                  required 
                />
              </div>
              <div className="input-group">
                <label>Loan Tenure (Years)</label>
                <input 
                  type="number" 
                  className="premium-input" 
                  value={loanTenure} 
                  onChange={(e) => setLoanTenure(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="premium-button w-full mt-4">
              Calculate EMI
            </button>
          </form>
        </div>

        <div className="calc-result-section panel glass-panel">
          {result ? (
            <div className="result-display animate-fade-in w-full text-left">
              <h3>Loan Breakdown</h3>
              <div className="result-metric primary">
                <span>Monthly EMI</span>
                <h2>₹{parseFloat(result.emi).toLocaleString('en-IN')}</h2>
              </div>
              
              <div className="result-breakdown">
                <div className="breakdown-item">
                  <span>Principal Amount</span>
                  <strong>₹{parseFloat(loanAmount).toLocaleString('en-IN')}</strong>
                </div>
                <div className="breakdown-item accent">
                  <span>Total Interest</span>
                  <strong>₹{parseFloat(result.totalInterest).toLocaleString('en-IN')}</strong>
                </div>
                <div className="breakdown-item mb-2">
                  <span>Total Payable</span>
                  <strong>₹{parseFloat(result.totalAmount).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <p>Enter your loan details to see your monthly EMI and interest schedule.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeLoanCalculator;
