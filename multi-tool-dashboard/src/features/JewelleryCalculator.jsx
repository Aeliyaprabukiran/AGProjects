import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Download, Receipt, Settings2, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';

const LOCAL_STORAGE_KEY = '7ya-jewellery-calc';

const JewelleryCalculator = ({ liveGoldPrice24k }) => {
  const [useLivePrice, setUseLivePrice] = useState(true);

  // Default values
  const [billData, setBillData] = useState(() => {
    const defaultState = {
      calcMode: 'weight',
      itemType: 'jewellery',
      amount: '',
      shopName: '7yaTools Jewellers',
      customerName: '',
      weight: '',
      purity: '22',
      rateInput: '',
      wastagePercent: '10',
      makingMode: 'percent',
      makingValue: '0',
      gstPercent: '3',
    };
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  const billRef = useRef(null);
  const [isCalculated, setIsCalculated] = useState(false);

  // Sync live rate if toggle is on and update when purity changes
  useEffect(() => {
    if (useLivePrice && liveGoldPrice24k) {
      const liveVal = billData.purity === '22' ? liveGoldPrice24k * (22/24) : liveGoldPrice24k;
      setBillData(prev => ({ ...prev, rateInput: Math.round(liveVal) }));
    }
  }, [liveGoldPrice24k, useLivePrice, billData.purity]);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(billData));
  }, [billData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'itemType') {
        if (value === 'jewellery') {
          next.makingMode = 'percent';
          next.makingValue = '15';
          next.wastagePercent = '10';
        } else if (value === 'coins') {
          next.makingMode = 'percent';
          next.makingValue = '2';
          next.wastagePercent = '0';
        }
      }
      return next;
    });
    if (name === 'rateInput') setUseLivePrice(false);
    
    // Trigger tiny animation flag
    setIsCalculated(false);
    setTimeout(() => setIsCalculated(true), 50);
  };

  const handleReset = () => {
    setBillData({
      calcMode: 'weight',
      itemType: 'jewellery',
      amount: '',
      shopName: '7yaTools Jewellers',
      customerName: '',
      weight: '',
      purity: '22',
      rateInput: Math.round((liveGoldPrice24k || 0) * (22/24)),
      wastagePercent: '10',
      makingMode: 'percent',
      makingValue: '0',
      gstPercent: '3',
    });
    setUseLivePrice(true);
  };

  const downloadBill = async () => {
    if (!billRef.current) return;
    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 3, // High resolution
        backgroundColor: '#1E232E', // Match dark theme container
        logging: false
      });
      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      a.download = `Jewellery_Bill_${new Date().getTime()}.png`;
      a.click();
    } catch (error) {
      console.error("Error generating bill image:", error);
    }
  };

  // --- Calculations ---
  const effectiveRate = parseFloat(billData.rateInput) || 0;
  
  let weight = 0;
  if (billData.calcMode === 'budget') {
    const amount = parseFloat(billData.amount) || 0;
    if (amount > 0 && effectiveRate > 0) {
      const wPct = (parseFloat(billData.wastagePercent) || 0) / 100;
      let mPct = 0;
      let mVal = 0;
      if (billData.makingMode === 'percent') {
        mPct = (parseFloat(billData.makingValue) || 0) / 100;
      } else if (billData.makingMode === 'perGram') {
        mVal = parseFloat(billData.makingValue) || 0;
      }
      const gstPct = (parseFloat(billData.gstPercent) || 0) / 100;
      
      const subtotalTarget = amount / (1 + gstPct);
      
      if (billData.makingMode === 'percent') {
        weight = subtotalTarget / (effectiveRate * (1 + wPct + mPct));
      } else if (billData.makingMode === 'perGram') {
        weight = subtotalTarget / (effectiveRate * (1 + wPct) + mVal);
      } else if (billData.makingMode === 'fixed') {
        const fixedMVal = parseFloat(billData.makingValue) || 0;
        weight = (subtotalTarget - fixedMVal) / (effectiveRate * (1 + wPct));
        if (weight < 0) weight = 0;
      }
    }
  } else {
    weight = parseFloat(billData.weight) || 0;
  }
  
  // 1. Base Gold Value
  const baseValue = weight * effectiveRate;
  
  // 3. Wastage
  const wastageWeight = weight * ((parseFloat(billData.wastagePercent) || 0) / 100);
  const wastageValue = wastageWeight * effectiveRate;
  
  // 4. Making Charges
  let makingCharges = 0;
  const makingVal = parseFloat(billData.makingValue) || 0;
  if (billData.makingMode === 'percent') {
    makingCharges = baseValue * (makingVal / 100);
  } else if (billData.makingMode === 'perGram') {
    makingCharges = weight * makingVal;
  } else {
    makingCharges = makingVal;
  }
  
  // 5. Subtotal
  const subtotal = baseValue + wastageValue + makingCharges;
  
  // 6. GST
  const gstAmount = subtotal * ((parseFloat(billData.gstPercent) || 0) / 100);
  
  // 7. Grand Total
  const grandTotal = subtotal + gstAmount;

  const formatCurrency = (amount) => {
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="jc-wrapper mt-8">
      <div className="tool-header">
        <h1>Jewellery Billing</h1>
        <p>Professional Indian-standard jewellery billing with accurate wastage and GST logic.</p>
      </div>

      <div className="jc-grid">
        {/* Controls Section */}
        <div className="jc-controls panel glass-panel">
          <div className="jc-header-flex">
            <h3><Settings2 size={18} /> Calculator Settings</h3>
            <button className="jc-reset-btn" onClick={handleReset} title="Reset Fields">
              <RefreshCw size={14} /> Reset
            </button>
          </div>

          <div className="jc-toggle-group mb-4">
            <button 
              className={billData.calcMode !== 'budget' ? 'active' : ''} 
              onClick={() => handleInputChange({ target: { name: 'calcMode', value: 'weight'} })}
            >By Weight</button>
            <button 
              className={billData.calcMode === 'budget' ? 'active' : ''} 
              onClick={() => handleInputChange({ target: { name: 'calcMode', value: 'budget'} })}
            >By Amount (Budget)</button>
          </div>

          <div className="jc-form-group-row">
            {billData.calcMode === 'budget' ? (
              <div className="jc-input-group">
                <label>Budget Amount (₹)</label>
                <input type="number" name="amount" value={billData.amount} onChange={handleInputChange} placeholder="e.g. 50000" min="0" />
              </div>
            ) : (
              <div className="jc-input-group">
                <label>Weight (grams)</label>
                <input type="number" name="weight" value={billData.weight} onChange={handleInputChange} placeholder="e.g. 15.5" min="0" step="0.01" />
              </div>
            )}
            {billData.calcMode === 'budget' && (
              <div className="jc-input-group">
                <label>Item Type</label>
                <select name="itemType" value={billData.itemType} onChange={handleInputChange}>
                  <option value="jewellery">Jewellery</option>
                  <option value="coins">Coins</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="jc-input-group mt-3">
            <label>Purity</label>
            <select name="purity" value={billData.purity} onChange={handleInputChange}>
              <option value="22">22 Karat</option>
              <option value="24">24 Karat</option>
            </select>
          </div>

          <div className="jc-input-group mt-3">
            <div className="jc-label-row">
              <label>{billData.purity}K Gold Rate (per gram) {useLivePrice && <span className="live-badge">Live</span>}</label>
            </div>
            <input type="number" name="rateInput" value={billData.rateInput} onChange={handleInputChange} placeholder="Manual rate" min="0" step="1" />
          </div>

          <div className="jc-form-group-row mt-3">
            <div className="jc-input-group">
              <label>Wastage (%)</label>
              <input type="number" name="wastagePercent" value={billData.wastagePercent} onChange={handleInputChange} min="0" step="0.1" />
            </div>
            <div className="jc-input-group">
              <label>GST (%)</label>
              <input type="number" name="gstPercent" value={billData.gstPercent} onChange={handleInputChange} min="0" step="0.1" />
            </div>
          </div>

          <div className="jc-divider"></div>

          <div className="jc-input-group">
            <label>Making Charges</label>
            <div className="jc-toggle-group mb-2">
              <button className={billData.makingMode === 'percent' ? 'active' : ''} onClick={() => handleInputChange({ target: { name: 'makingMode', value: 'percent'} })}>% of Base</button>
              <button className={billData.makingMode === 'perGram' ? 'active' : ''} onClick={() => handleInputChange({ target: { name: 'makingMode', value: 'perGram'} })}>₹ / Gram</button>
              <button className={billData.makingMode === 'fixed' ? 'active' : ''} onClick={() => handleInputChange({ target: { name: 'makingMode', value: 'fixed'} })}>Fixed ₹</button>
            </div>
            <input 
              type="number" 
              name="makingValue" 
              value={billData.makingValue} 
              onChange={handleInputChange} 
              placeholder={`Enter ${billData.makingMode === 'percent' ? '%' : '₹'}`} 
              min="0" step="0.1" 
            />
          </div>

          <div className="jc-divider"></div>

          <div className="jc-input-group">
            <label>Shop Name</label>
            <input type="text" name="shopName" value={billData.shopName} readOnly className="readonly-input" title="Shop Name is officially fixed" />
          </div>
          <div className="jc-input-group mt-3">
            <label>Customer Name (Optional)</label>
            <input type="text" name="customerName" value={billData.customerName} onChange={handleInputChange} placeholder="Walk-in Customer" />
          </div>
        </div>

        {/* Bill Preview Section */}
        <div className="jc-preview-area">
          <div className="jc-bill-card" ref={billRef}>
            {/* Bill Header */}
            <div className="jc-bill-header">
              <h1>{billData.shopName || "Jewellery Shop"}</h1>
              <p className="jc-date">Date: {currentDate}</p>
              {billData.customerName && <p className="jc-customer">Billed To: <strong>{billData.customerName}</strong></p>}
            </div>

            {/* Item Primary Math */}
            <div className="jc-bill-item-details">
              <div className="jc-item-row">
                <span>Gold Weight</span>
                <strong>{weight.toFixed(3)} g</strong>
              </div>
              <div className="jc-item-row">
                <span>Purity</span>
                <strong>{billData.purity}K</strong>
              </div>
              <div className="jc-item-row">
                <span>Effective Rate ({billData.purity}K)</span>
                <strong>{formatCurrency(effectiveRate)} /g</strong>
              </div>
            </div>

            {/* Bill Breakdown */}
            <div className="jc-bill-breakdown">
              <div className="jc-breakdown-row">
                <span>Base Gold Value</span>
                <span>{formatCurrency(baseValue)}</span>
              </div>
              <div className="jc-breakdown-row text-secondary">
                <span>+ Wastage ({billData.wastagePercent}%) <small>| {wastageWeight.toFixed(3)}g</small></span>
                <span>{formatCurrency(wastageValue)}</span>
              </div>
              <div className="jc-breakdown-row text-secondary">
                <span>+ Making Charges 
                  <small>
                    {billData.makingMode === 'percent' && ` (${billData.makingValue}%)`}
                    {billData.makingMode === 'perGram' && ` (₹${billData.makingValue}/g)`}
                    {billData.makingMode === 'fixed' && ' (Fixed)'}
                  </small>
                </span>
                <span>{formatCurrency(makingCharges)}</span>
              </div>
              
              <div className="jc-subtotal-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="jc-breakdown-row text-warning">
                <span>+ GST ({billData.gstPercent}%)</span>
                <span>{formatCurrency(gstAmount)}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className={`jc-grand-total ${isCalculated ? 'pulse-total' : ''}`}>
              <span>GRANT TOTAL</span>
              <h2>{formatCurrency(Math.round(grandTotal))}</h2>
            </div>
            
            <div className="jc-bill-footer">
              <p>Thank you for shopping with us!</p>
              <p><small>Total is rounded to nearest Rupee. This is a computer generated estimate.</small></p>
            </div>
          </div>

          <button className="premium-button generate-btn jc-download-btn mt-4" onClick={downloadBill}>
            <Download size={18} /> Download Bill as Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default JewelleryCalculator;
