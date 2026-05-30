
import { useState, useEffect } from 'react';
import { expenseReceiptAPI } from '../api';

const CATEGORIES = ['RENT','SALARY','UTILITIES','MARKETING','TRANSPORT','FOOD','OFFICE','OTHER'];
const PAYMENT_MODES = ['CASH','UPI','CARD','BANK_TRANSFER'];

export default function ExpenseScanner() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [confirmForm, setConfirmForm] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedReceipt, setExpandedReceipt] = useState(null);

  useEffect(() => { loadReceipts(); }, []);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const res = await expenseReceiptAPI.getAll();
      setReceipts(res.data.receipts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    try {
      const res = await expenseReceiptAPI.scan(file);
      setScanResult(res.data);
      setConfirmForm({
        vendorName: res.data.merchantName || '',
        amount: res.data.totalAmount || '',
        category: res.data.category || 'OTHER',
        paymentMode: res.data.paymentMode || 'CASH',
        expenseDate: res.data.date || new Date().toISOString().split('T')[0],
        description: res.data.items || '',
      });
      // If 100% confidence, receipt is already auto-confirmed - skip manual review
      if (res.data.confidence >= 1.0) {
        setShowConfirm(false);
        setScanResult(null);
        loadReceipts();
        const fileType = res.data.fileType || 'Image';
        alert(`✅ ${fileType} receipt scanned with 100% accuracy and auto-recorded!`);
      } else {
        setShowConfirm(true);
      }
    } catch (e) { alert('Scan failed: ' + (e.response?.data?.error || e.message)); }
    setScanning(false);
  };

  const confirmReceipt = async () => {
    try {
      await expenseReceiptAPI.confirm(scanResult.id, confirmForm);
      setShowConfirm(false);
      setScanResult(null);
      loadReceipts();
      alert('✅ Receipt confirmed and expense recorded!');
    } catch (e) { alert('Failed to confirm'); }
  };

  const statusBadge = (status) => {
    const colors = { PENDING: '#F59E0B', PROCESSED: '#3B82F6', LINKED: '#10B981', FAILED: '#DC2626' };
    return <span style={{ padding: '2px 8px', borderRadius: 12, background: (colors[status] || '#6B7280') + '20', color: colors[status] || '#6B7280', fontSize: 10, fontWeight: 700 }}>{status}</span>;
  };

  const categoryIcon = (cat) => {
    const icons = { FOOD: '🍽️', GROCERIES: '🛒', TRANSPORT: '🚗', UTILITIES: '💡', OFFICE: '📎', MARKETING: '📣', RENT: '🏠', SALARY: '💰' };
    return icons[cat] || '🧾';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🧾 Expense Receipt Scanner</h2>
      </div>

      {/* Upload Area */}
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 32, border: '2px dashed #D1D5DB', cursor: 'pointer' }}
        onClick={() => document.getElementById('receipt-upload').click()}>
        <input id="receipt-upload" type="file" accept="image/*,.pdf" onChange={handleScan} style={{ display: 'none' }} />
        {scanning ? (
          <div>
            <div style={{ fontSize: 40 }} className="animate-pulse">🔍</div>
            <div style={{ fontWeight: 600, marginTop: 12 }}>Scanning receipt...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 40 }}>📸</div>
            <div style={{ fontWeight: 600, marginTop: 12 }}>Click to Upload Receipt</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Take a photo, upload an image or PDF of your expense bill</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Supports: JPG, PNG, JPEG, PDF • Max 10MB</div>
          </div>
        )}
      </div>

      {/* Confirm Receipt Form */}
      {showConfirm && scanResult && (
        <div className="card animate-slideIn" style={{ marginBottom: 20, borderLeft: '4px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700 }}>✏️ Review & Confirm Receipt</h3>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: scanResult.confidence > 0.85 ? '#10B98120' : '#F59E0B20', color: scanResult.confidence > 0.85 ? '#10B981' : '#F59E0B', fontSize: 12, fontWeight: 700 }}>
              🎯 {Math.round((scanResult.confidence || 0.75) * 100)}% Confidence
            </span>
          </div>
          {scanResult.items && (
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>📦 Detected Items:</div>
              <div style={{ color: '#374151' }}>{scanResult.items}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Vendor Name</label>
              <input value={confirmForm.vendorName} onChange={e => setConfirmForm({...confirmForm, vendorName: e.target.value})} placeholder="e.g. Stationery Shop"
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }} />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Amount (₹)</label>
              <input type="number" value={confirmForm.amount} onChange={e => setConfirmForm({...confirmForm, amount: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Category</label>
              <select value={confirmForm.category} onChange={e => setConfirmForm({...confirmForm, category: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Payment Mode</label>
              <select value={confirmForm.paymentMode} onChange={e => setConfirmForm({...confirmForm, paymentMode: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Date</label>
              <input type="date" value={confirmForm.expenseDate} onChange={e => setConfirmForm({...confirmForm, expenseDate: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Description</label>
              <input value={confirmForm.description} onChange={e => setConfirmForm({...confirmForm, description: e.target.value})} placeholder="Optional note"
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn-primary" onClick={confirmReceipt}>✅ Confirm & Record Expense</button>
            <button className="btn-secondary" onClick={() => { setShowConfirm(false); setScanResult(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Receipts History */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700 }}>📋 Scanned Receipts</h3>
          {receipts.length > 0 && (
            <span style={{ fontSize: 13, color: '#6B7280' }}>{receipts.length} receipt{receipts.length !== 1 ? 's' : ''} found</span>
          )}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#6B7280' }}>Loading...</div>
        ) : receipts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#6B7280' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
            No receipts scanned yet. Upload your first receipt above!
          </div>
        ) : (
          <div>
            {receipts.map(r => (
              <div key={r.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedReceipt(expandedReceipt === r.id ? null : r.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: '#FAFAFA' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{categoryIcon(r.category)}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.vendorName || 'Unknown Vendor'}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{r.expenseDate} • {r.paymentMode ? r.paymentMode.replace('_', ' ') : '—'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>₹{parseFloat(r.amount || 0).toFixed(0)}</span>
                    {statusBadge(r.scanStatus)}
                    <span style={{ fontSize: 10, color: '#9CA3AF', transition: 'transform 0.2s', transform: expandedReceipt === r.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                  </div>
                </div>
                {expandedReceipt === r.id && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Vendor</div>
                        <div style={{ fontSize: 14, marginTop: 2 }}>{r.vendorName || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Amount</div>
                        <div style={{ fontSize: 14, marginTop: 2, fontWeight: 700, color: '#10B981' }}>₹{parseFloat(r.amount || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Category</div>
                        <div style={{ fontSize: 14, marginTop: 2 }}>{r.category || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Payment Mode</div>
                        <div style={{ fontSize: 14, marginTop: 2 }}>{r.paymentMode ? r.paymentMode.replace('_', ' ') : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Date</div>
                        <div style={{ fontSize: 14, marginTop: 2 }}>{r.expenseDate || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Status</div>
                        <div style={{ fontSize: 14, marginTop: 2 }}>{statusBadge(r.scanStatus)}</div>
                      </div>
                    </div>
                    {r.description && (
                      <div style={{ marginTop: 12, padding: 10, background: '#F9FAFB', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>📦 Items / Description</div>
                        <div style={{ fontSize: 13, color: '#374151' }}>{r.description}</div>
                      </div>
                    )}
                    {r.confidence && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF' }}>
                        🎯 Scan Confidence: {Math.round(r.confidence * 100)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
