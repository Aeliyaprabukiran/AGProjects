import React, { useState } from 'react';
import '../Features.css';

const BmiCalculator = () => {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [bmi, setBmi] = useState(null);

  const calculateBmi = () => {
    // height in cm -> m
    const h = height / 100;
    const computedBmi = weight / (h * h);
    setBmi(computedBmi.toFixed(1));
  };

  const getStatus = () => {
    if (!bmi) return { label: 'Unknown', color: 'gray' };
    if (bmi < 18.5) return { label: 'Underweight', color: 'var(--accent-warning)', progress: 25 };
    if (bmi < 25) return { label: 'Normal Weight', color: 'var(--accent-success)', progress: 50 };
    if (bmi < 30) return { label: 'Overweight', color: 'var(--accent-warning)', progress: 75 };
    return { label: 'Obese', color: 'var(--accent-danger)', progress: 100 };
  };

  const status = getStatus();

  return (
    <div className="feature-wrapper">
      <div className="tool-header">
        <h1>BMI Calculator</h1>
        <p>Determine your Body Mass Index with an interactive gauge.</p>
      </div>

      <div className="bmi-layout">
        <div className="bmi-input-section panel glass-panel">
          <div className="slider-group">
            <div className="slider-header">
              <label>Weight</label>
              <div className="slider-value">{weight} <span className="unit">kg</span></div>
            </div>
            <input 
              type="range" 
              min="30" 
              max="200" 
              value={weight} 
              onChange={(e) => { setWeight(e.target.value); calculateBmi(); }}
              className="premium-slider weight-slider"
            />
          </div>

          <div className="slider-group mt-6">
            <div className="slider-header">
              <label>Height</label>
              <div className="slider-value">{height} <span className="unit">cm</span></div>
            </div>
            <input 
              type="range" 
              min="100" 
              max="250" 
              value={height} 
              onChange={(e) => { setHeight(e.target.value); calculateBmi(); }}
              className="premium-slider height-slider"
            />
          </div>
        </div>

        <div className="bmi-result-section panel glass-panel">
          {bmi ? (
            <div className="bmi-display animate-fade-in">
              <div className="bmi-ring" style={{ '--progress': `${status.progress}%`, '--ring-color': status.color }}>
                <div className="bmi-circle">
                  <h2>{bmi}</h2>
                  <span>BMI</span>
                </div>
              </div>
              <div className="bmi-status" style={{ color: status.color }}>
                <h3>{status.label}</h3>
              </div>
              <p className="bmi-info">
                A normal BMI ranges between 18.5 and 24.9. Maintaining a healthy weight helps lower the risk of many health issues.
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <p>Adjust the sliders to see your BMI calculation live.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BmiCalculator;
