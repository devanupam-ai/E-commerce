import { useState, useEffect } from 'react';
import { cashRegisterAPI } from '../api';

const INR = (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '₹0';
const DENOMINATIONS = [
  { key: 'denom2000', label: '₹2000', value: 2000 },
  { key: 'denom500', label: '₹500', value: 500 },
  { key: 'denom200', label: '₹200', value: 200 },
  { key: 'denom100', label: '₹100', value: 100 },
  { key: 'denom50', label: '₹50', value: 50 },
  { key: 'denom20', label: '₹20', value: 20 },
  { key: 'denom10', label: '₹10', value: 10 },
  { key: 'denom5', label: '₹5', value: 5 },
  { key: 'denom2', label: '₹2', value: 2 },
  { key: 'denom1', label: '₹1', value: 1 },
];

function playShortBeep(expected, received) {
  if (expected && Number(received) < Number(expected)) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 200);
    } catch (err) {}
  }
}

export default function CashRegister() {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today'); // today, history, analysis
  const [history, setHistory] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // Open day form
  const [openForm, setOpenForm] = useState({ openingCash: '', denominations: {} });
  const [showOpenModal, setShowOpenModal] = useState(false);

  // Quick entry form
  const [quickForm, setQuickForm] = useState({
    entryType: 'CASH_SALE', amount: '', paymentMode: 'CASH',
    description: '', customerName: '', expectedAmount: '', shortReason: ''
  });
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  // Close day form
  const [closeForm, setCloseForm] = useState({ actualCash: '', denominations: {}, notes: '' });
  const [showCloseModal, setShowCloseModal] = useState(false);

  const [alert, setAlert] = useState(null);
  const [changeConfirmed, setChangeConfirmed] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => { fetchToday(); }, []);

  const fetchToday = async () => {
    try {
      const res = await cashRegisterAPI.getToday();
      setTodayData(res.data);
      setConnectionError(false);
    } catch (e) {
      console.error(e);
      setConnectionError(true);
      setTodayData({ status: 'NOT_OPENED' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDay = async () => {
    try {
      const denoms = {};
      DENOMINATIONS.forEach(d => {
        const count = parseInt(openForm.denominations[d.key]) || 0;
        if (count > 0) denoms[d.key] = count;
      });
      const res = await cashRegisterAPI.openDay({
        openingCash: openForm.openingCash || 0,
        denominations: denoms
      });
      setAlert({ type: 'success', msg: res.data.message });
      setShowOpenModal(false);
      fetchToday();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.error || 'Failed to open day' });
    }
  };

  const handleQuickEntry = async () => {
    try {
      const payload = {
        entryType: quickForm.entryType,
        amount: quickForm.amount,
        paymentMode: quickForm.paymentMode,
        description: quickForm.description,
        customerName: quickForm.customerName,
      };
      if (quickForm.expectedAmount) {
        payload.expectedAmount = quickForm.expectedAmount;
        payload.shortReason = quickForm.shortReason;
      }
      const res = await cashRegisterAPI.quickEntry(payload);
      setAlert({ type: 'success', msg: res.data.message });
      if (res.data.alert) {
        setAlert({ type: 'warning', msg: res.data.alert });
      }
      setQuickForm({ entryType: 'CASH_SALE', amount: '', paymentMode: 'CASH', description: '', customerName: '', expectedAmount: '', shortReason: '' });
      setShowQuickEntry(false);
      fetchToday();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.error || 'Failed to add entry' });
    }
  };

  const handleCloseDay = async () => {
    try {
      const denoms = {};
      DENOMINATIONS.forEach(d => {
        const count = parseInt(closeForm.denominations[d.key]) || 0;
        if (count > 0) denoms[d.key] = count;
      });
      const res = await cashRegisterAPI.closeDay({
        actualCash: closeForm.actualCash || 0,
        denominations: denoms,
        notes: closeForm.notes
      });
      setAlert({ type: res.data.difference < 0 ? 'warning' : 'success', msg: res.data.verdict });
      setShowCloseModal(false);
      fetchToday();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.error || 'Failed to close day' });
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await cashRegisterAPI.history();
      setHistory(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchAnalysis = async () => {
    try {
      const res = await cashRegisterAPI.mismatchAnalysis();
      setAnalysis(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (tab === 'history' && !history) fetchHistory();
    if (tab === 'analysis' && !analysis) fetchAnalysis();
  }, [tab]);

  const calcDenomTotal = (denoms) => {
    return DENOMINATIONS.reduce((sum, d) => sum + (parseInt(denoms[d.key]) || 0) * d.value, 0);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1.2rem' }}>Loading Cash Register...</div>;

  const registerStatus = todayData?.status || 'NOT_OPENED';

  return (
    <div style={s.container}>
      {/* Connection Error Banner */}
      {connectionError && (
        <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626' }}>Cannot connect to server!</div>
          <div style={{ fontSize: '0.9rem', color: '#991b1b', marginTop: '0.25rem' }}>Make sure the backend is running on port 9999</div>
        </div>
      )}

      {/* Alert */}
      {alert && (
        <div style={{ ...s.alertBar, background: alert.type === 'error' ? '#fef2f2' : alert.type === 'warning' ? '#fffbeb' : '#f0fdf4', borderLeft: alert.type === 'error' ? '4px solid #ef4444' : alert.type === 'warning' ? '4px solid #f59e0b' : '4px solid #22c55e' }}>
          <span>{alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : '✅'} {alert.msg}</span>
          <button onClick={() => setAlert(null)} style={s.alertClose}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>💰 Cash Register</h1>
        <div style={s.headerActions}>
          {registerStatus === 'OPEN' && (
            <>
              <button onClick={() => { setShowQuickEntry(true); setChangeConfirmed(false); }} style={s.quickBtn}>🏃 RUSH MODE</button>
              <button onClick={() => setShowCloseModal(true)} style={s.closeBtn}>🔒 Close Day</button>
            </>
          )}
          {registerStatus === 'NOT_OPENED' && (
            <button onClick={() => setShowOpenModal(true)} style={s.openBtn}>🔓 Open Day</button>
          )}
          {registerStatus === 'CLOSED' && (
            <span style={{ background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px', color: '#64748b', fontWeight: 600 }}>🔒 Day Closed</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {['today', 'history', 'analysis'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={tab === t ? s.activeTab : s.tab}>
            {t === 'today' ? '📋 Today' : t === 'history' ? '📅 History' : '🔍 Mismatch Analysis'}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === 'today' && (
        <div>
          {registerStatus === 'NOT_OPENED' ? (
            <div style={s.notOpened}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
              <h2>Today's Register Not Opened Yet</h2>
              <p style={{ color: '#64748b' }}>Open the day to start tracking cash transactions</p>
              <button onClick={() => setShowOpenModal(true)} style={s.openBtn}>🔓 Open Day</button>
            </div>
          ) : registerStatus === 'CLOSED' ? (
            <div style={s.notOpened}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2>Today's Register is Closed</h2>
              <p style={{ color: '#64748b' }}>Check History tab for details</p>
            </div>
          ) : (
            <>
              {/* Status Cards */}
              <div style={s.cardGrid}>
                <div style={{ ...s.card, borderLeft: '4px solid #22c55e' }}>
                  <div style={s.cardLabel}>Opening Cash</div>
                  <div style={s.cardValue}>{INR(todayData?.openingCash)}</div>
                </div>
                <div style={{ ...s.card, borderLeft: '4px solid #3b82f6' }}>
                  <div style={s.cardLabel}>Cash Sales</div>
                  <div style={s.cardValue}>{INR(todayData?.totalCashSales)}</div>
                </div>
                <div style={{ ...s.card, borderLeft: '4px solid #8b5cf6' }}>
                  <div style={s.cardLabel}>UPI Sales</div>
                  <div style={s.cardValue}>{INR(todayData?.totalUpiSales)}</div>
                </div>
                <div style={{ ...s.card, borderLeft: '4px solid #f59e0b' }}>
                  <div style={s.cardLabel}>Total All Sales</div>
                  <div style={s.cardValue}>{INR(todayData?.totalAllSales)}</div>
                </div>
                <div style={{ ...s.card, borderLeft: '4px solid #ef4444' }}>
                  <div style={s.cardLabel}>Cash Expenses</div>
                  <div style={s.cardValue}>{INR(todayData?.totalCashExpenses)}</div>
                </div>
                <div style={{ ...s.card, borderLeft: '4px solid #06b6d4' }}>
                  <div style={s.cardLabel}>Cash Received (Khata)</div>
                  <div style={s.cardValue}>{INR(todayData?.totalCashReceived)}</div>
                </div>
                <div style={{ ...s.card, borderLeft: '4px solid #ec4899' }}>
                  <div style={s.cardLabel}>Cash Paid Out</div>
                  <div style={s.cardValue}>{INR(todayData?.totalCashPaidOut)}</div>
                </div>
                <div style={{ ...s.card, borderLeft: '4px solid #10b981', background: '#f0fdf4' }}>
                  <div style={s.cardLabel}>Expected in Drawer</div>
                  <div style={{ ...s.cardValue, color: '#059669' }}>{INR(todayData?.expectedCashInDrawer)}</div>
                </div>
              </div>

              {/* Short Payment Alert */}
              {todayData?.totalShortAmount > 0 && (
                <div style={s.shortAlert}>
                  ⚠️ <strong>Short Payments Today: {INR(todayData.totalShortAmount)}</strong>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                    ({todayData.shortPayments?.length} customer(s) paid less than billed)
                  </span>
                </div>
              )}

              {/* Today's Entries */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>📝 Today's Entries ({todayData?.entries?.length || 0})</h3>
                {todayData?.entries?.length > 0 ? (
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={s.th}>Time</th>
                          <th style={s.th}>Type</th>
                          <th style={s.th}>Amount</th>
                          <th style={s.th}>Mode</th>
                          <th style={s.th}>Customer</th>
                          <th style={s.th}>Description</th>
                          <th style={s.th}>Short</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayData.entries.map((e, i) => (
                          <tr key={i} style={e.shortAmount > 0 ? { background: '#fef2f2' } : {}}>
                            <td style={s.td}>{new Date(e.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td style={s.td}><span style={s.badge(e.entryType)}>{e.entryType.replace(/_/g, ' ')}</span></td>
                            <td style={{ ...s.td, fontWeight: 600 }}>{INR(e.amount)}</td>
                            <td style={s.td}>{e.paymentMode}</td>
                            <td style={s.td}>{e.customerName || '-'}</td>
                            <td style={s.td}>{e.description || '-'}</td>
                            <td style={s.td}>{e.shortAmount > 0 ? <span style={{ color: '#ef4444', fontWeight: 700 }}>-{INR(e.shortAmount)}</span> : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={s.empty}>No entries yet. Use Quick Entry to record transactions.</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>📅 Cash Register History</h3>
          {history?.registers?.length > 0 ? (
            <>
              <div style={s.summaryBar}>
                <div style={s.summaryItem}>
                  <span style={s.summaryLabel}>Total Days</span>
                  <span style={s.summaryValue}>{history.totalDays}</span>
                </div>
                <div style={s.summaryItem}>
                  <span style={s.summaryLabel}>Days with Shortage</span>
                  <span style={{ ...s.summaryValue, color: '#ef4444' }}>{history.daysWithShortage}</span>
                </div>
                <div style={s.summaryItem}>
                  <span style={s.summaryLabel}>Total Shortage</span>
                  <span style={{ ...s.summaryValue, color: '#ef4444' }}>{INR(history.totalShortage)}</span>
                </div>
                <div style={s.summaryItem}>
                  <span style={s.summaryLabel}>Total Excess</span>
                  <span style={{ ...s.summaryValue, color: '#22c55e' }}>{INR(history.totalExcess)}</span>
                </div>
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Date</th>
                      <th style={s.th}>Opening</th>
                      <th style={s.th}>Cash Sales</th>
                      <th style={s.th}>UPI Sales</th>
                      <th style={s.th}>Expenses</th>
                      <th style={s.th}>Expected</th>
                      <th style={s.th}>Actual</th>
                      <th style={s.th}>Difference</th>
                      <th style={s.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.registers.map((r, i) => (
                      <tr key={i} style={r.difference < 0 ? { background: '#fef2f2' } : r.difference > 0 ? { background: '#f0fdf4' } : {}}>
                        <td style={s.td}>{r.date}</td>
                        <td style={s.td}>{INR(r.openingCash)}</td>
                        <td style={s.td}>{INR(r.totalCashSales)}</td>
                        <td style={s.td}>{INR(r.totalUpiSales)}</td>
                        <td style={s.td}>{INR(r.totalCashExpenses)}</td>
                        <td style={s.td}>{INR(r.expectedCashInDrawer)}</td>
                        <td style={s.td}>{INR(r.closingCashActual)}</td>
                        <td style={{ ...s.td, fontWeight: 700, color: r.difference < 0 ? '#ef4444' : r.difference > 0 ? '#22c55e' : '#64748b' }}>
                          {r.difference < 0 ? '' : r.difference > 0 ? '+' : ''}{INR(r.difference)}
                        </td>
                        <td style={s.td}><span style={r.status === 'CLOSED' ? s.closedBadge : s.openBadge}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={s.empty}>No register history yet. Start by opening a day.</div>
          )}
        </div>
      )}

      {/* ANALYSIS TAB */}
      {tab === 'analysis' && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>🔍 Cash Mismatch Analysis</h3>
          {analysis ? (
            <>
              <div style={s.analysisGrid}>
                <div style={{ ...s.card, borderLeft: '4px solid #ef4444', background: '#fef2f2' }}>
                  <div style={s.cardLabel}>Total Cash Loss</div>
                  <div style={{ ...s.cardValue, color: '#dc2626', fontSize: '2rem' }}>{INR(analysis.totalLoss)}</div>
                </div>
                <div style={{ ...s.card, borderLeft: '4px solid #f59e0b' }}>
                  <div style={s.cardLabel}>Average Daily Loss</div>
                  <div style={{ ...s.cardValue, color: '#d97706' }}>{INR(analysis.averageDailyLoss)}</div>
                </div>
                <div style={{ ...s.card, borderLeft: '4px solid #8b5cf6' }}>
                  <div style={s.cardLabel}>Recommendation</div>
                  <div style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>{analysis.recommendation}</div>
                </div>
              </div>

              {/* Day of Week Pattern */}
              {analysis.dayOfWeekPattern && Object.keys(analysis.dayOfWeekPattern).length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>📊 Loss by Day of Week</h4>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {Object.entries(analysis.dayOfWeekPattern).map(([day, amount]) => (
                      <div key={day} style={{ ...s.card, minWidth: '120px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{day}</div>
                        <div style={{ fontWeight: 700, color: '#ef4444' }}>{INR(amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mismatch Days Detail */}
              {analysis.mismatchDays?.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>📋 Mismatch Details</h4>
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={s.th}>Date</th>
                          <th style={s.th}>Expected</th>
                          <th style={s.th}>Actual</th>
                          <th style={s.th}>Difference</th>
                          <th style={s.th}>Short Payments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.mismatchDays.map((d, i) => (
                          <tr key={i} style={{ background: d.difference < 0 ? '#fef2f2' : '#f0fdf4' }}>
                            <td style={s.td}>{d.date}</td>
                            <td style={s.td}>{INR(d.systemCash)}</td>
                            <td style={s.td}>{INR(d.actualCash)}</td>
                            <td style={{ ...s.td, fontWeight: 700, color: d.difference < 0 ? '#ef4444' : '#22c55e' }}>
                              {d.difference < 0 ? '' : '+'}{INR(d.difference)}
                            </td>
                            <td style={s.td}>{INR(d.totalShortFromPayments)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={s.empty}>Loading analysis...</div>
          )}
        </div>
      )}

      {/* ========== MODALS ========== */}

      {/* Floating RUSH MODE button — Always visible when register is open */}
      {registerStatus === 'OPEN' && !showQuickEntry && (
        <button onClick={() => { setShowQuickEntry(true); setChangeConfirmed(false); }} style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999,
          background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff',
          border: 'none', padding: '1rem 1.5rem', borderRadius: '50px',
          fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'pulse 2s infinite'
        }}>
          🏃 RUSH MODE
        </button>
      )}

      {/* Open Day Modal */}
      {showOpenModal && (
        <div style={s.modalOverlay} onClick={() => setShowOpenModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>🔓 Open Day - {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>

            <div style={s.formGroup}>
              <label style={s.label}>Opening Cash in Drawer</label>
              <input type="number" value={openForm.openingCash} onChange={e => setOpenForm({ ...openForm, openingCash: e.target.value })}
                placeholder="Enter opening cash amount" style={s.input} />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Denomination Breakdown (Optional)</label>
              <div style={s.denomGrid}>
                {DENOMINATIONS.map(d => (
                  <div key={d.key} style={s.denomRow}>
                    <span style={s.denomLabel}>{d.label} ×</span>
                    <input type="number" min="0" value={openForm.denominations[d.key] || ''}
                      onChange={e => setOpenForm({ ...openForm, denominations: { ...openForm.denominations, [d.key]: e.target.value } })}
                      style={s.denomInput} placeholder="0" />
                    <span style={s.denomTotal}>= {INR((parseInt(openForm.denominations[d.key]) || 0) * d.value)}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
                Denomination Total: {INR(calcDenomTotal(openForm.denominations))}
              </div>
            </div>

            <div style={s.modalActions}>
              <button onClick={() => setShowOpenModal(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleOpenDay} style={s.openBtn}>🔓 Open Day</button>
            </div>
          </div>
        </div>
      )}

      {/* Rush Mode Modal */}
      {showQuickEntry && (
        <div style={s.modalOverlay} onClick={() => setShowQuickEntry(false)}>
          <div style={{ ...s.modal, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2 style={{ ...s.modalTitle, marginBottom: 0 }}>🏃 RUSH MODE</h2>
              <div style={{ background: todayData?.totalShortAmount > 0 ? '#fef2f2' : '#f0fdf4', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: todayData?.totalShortAmount > 0 ? '#dc2626' : '#16a34a' }}>
                Today: {INR(todayData?.totalAllSales)} | {todayData?.totalShortAmount > 0 ? '⚠️ Short ' + INR(todayData.totalShortAmount) : '✅ No shortage'}
              </div>
            </div>

            {todayData?.totalShortAmount > 500 && (
              <div style={{ background: '#7f1d1d', color: '#fff', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                🚨 DAILY SHORTAGE CROSSED ₹500! Slow down & verify every payment!
              </div>
            )}

            {/* Step 1: Bill Amount */}
            <div style={s.formGroup}>
              <label style={{ ...s.label, fontSize: '1rem' }}>🧾 Bill Amount (What customer should pay)</label>
              <input type="number" value={quickForm.expectedAmount} 
                onChange={e => setQuickForm({ ...quickForm, expectedAmount: e.target.value, entryType: 'CASH_SALE' })}
                placeholder="Enter bill total" 
                style={{ ...s.input, fontSize: '2rem', fontWeight: 700, textAlign: 'center', border: '2px solid #3b82f6' }} 
                autoFocus />
            </div>

            {/* Step 2: Cash Received */}
            <div style={s.formGroup}>
              <label style={{ ...s.label, fontSize: '1rem' }}>💵 Cash Received (What customer actually gave)</label>
              <input type="number" value={quickForm.amount} 
                onChange={e => { setQuickForm({ ...quickForm, amount: e.target.value }); playShortBeep(quickForm.expectedAmount, e.target.value); }}
                placeholder="Enter cash received" 
                style={{ ...s.input, fontSize: '2rem', fontWeight: 700, textAlign: 'center',
                  border: quickForm.expectedAmount && quickForm.amount && Number(quickForm.amount) < Number(quickForm.expectedAmount) 
                    ? '3px solid #ef4444' : '2px solid #22c55e' 
                }} />
              {/* Quick Note Buttons - One tap for common notes */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {[100, 200, 500, 1000, 2000].map(note => (
                  <button key={note} onClick={() => { setQuickForm({ ...quickForm, amount: String(note) }); playShortBeep(quickForm.expectedAmount, note); }}
                    style={{
                      flex: 1, minWidth: '55px', padding: '0.5rem 0.25rem', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '0.95rem', fontWeight: 700, border: quickForm.amount === String(note) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      background: quickForm.amount === String(note) ? '#dbeafe' : '#f8fafc', color: '#1e293b'
                    }}>
                    ₹{note}
                  </button>
                ))}
              </div>
            </div>

            {/* AUTO CALCULATION — The Key Feature! */}
            {quickForm.expectedAmount && quickForm.amount && (() => {
              const billAmt = Number(quickForm.expectedAmount);
              const rcvAmt = Number(quickForm.amount);
              const diff = rcvAmt - billAmt; // positive = customer paid more, negative = customer paid less
              const isShort = diff < 0;
              const isOver = diff > 0;
              const isExact = diff === 0;

              // Suggest denomination breakdown for change
              const changeAmt = isOver ? diff : 0;
              const suggestDenoms = [];
              if (changeAmt > 0) {
                let remaining = changeAmt;
                const notes = [500, 200, 100, 50, 20, 10, 5, 2, 1];
                for (const n of notes) {
                  const count = Math.floor(remaining / n);
                  if (count > 0) { suggestDenoms.push({ note: n, count }); remaining -= count * n; }
                }
              }

              return (
              <div style={{
                padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', textAlign: 'center',
                background: isShort ? '#fef2f2' : isExact ? '#f0fdf4' : '#eff6ff',
                border: isShort ? '3px solid #ef4444' : isExact ? '2px solid #22c55e' : '3px solid #3b82f6',
                animation: isShort ? 'pulse 1s infinite' : 'none'
              }}>
                {isExact ? (
                  <>
                    <div style={{ fontSize: '2.5rem' }}>✅</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#16a34a' }}>EXACT AMOUNT — NO CHANGE</div>
                    <div style={{ fontSize: '1rem', color: '#15803d', marginTop: '0.25rem' }}>
                      Bill {INR(billAmt)} = Received {INR(rcvAmt)} ✔️
                    </div>
                  </>
                ) : isOver ? (
                  <>
                    <div style={{ fontSize: '2.5rem' }}>💰🔄</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.25rem' }}>
                      RETURN CHANGE TO CUSTOMER
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1d4ed8', background: '#dbeafe', borderRadius: '12px', padding: '0.5rem 1rem', display: 'inline-block' }}>
                      ₹{changeAmt}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#3b82f6', marginTop: '0.5rem' }}>
                      Bill: {INR(billAmt)} | Received: {INR(rcvAmt)} | Return: {INR(changeAmt)}
                    </div>
                    {suggestDenoms.length > 0 && (
                      <div style={{ marginTop: '0.75rem', background: '#fff', borderRadius: '8px', padding: '0.75rem', display: 'inline-block' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>📋 GIVE THESE NOTES:</div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {suggestDenoms.map((d, i) => (
                            <span key={i} style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                              ₹{d.note} × {d.count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '2.5rem' }}>🚨</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.25rem' }}>
                      CUSTOMER PAID LESS!
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#dc2626', background: '#fee2e2', borderRadius: '12px', padding: '0.5rem 1rem', display: 'inline-block' }}>
                      SHORT BY ₹{Math.abs(diff)}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#991b1b', marginTop: '0.5rem' }}>
                      Bill: {INR(billAmt)} | Received: {INR(rcvAmt)} | Missing: {INR(Math.abs(diff))}
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>
                      <select value={quickForm.shortReason} onChange={e => setQuickForm({ ...quickForm, shortReason: e.target.value })}
                        style={{ ...s.input, maxWidth: '300px', fontSize: '0.9rem' }}>
                        <option value="">-- Reason (optional) --</option>
                        <option value="NO_CHANGE">No change available</option>
                        <option value="CUSTOMER_RUSH">Customer in rush, paid less</option>
                        <option value="ROUNDED_OFF">Rounded off</option>
                        <option value="DISPUTE">Price dispute</option>
                        <option value="PARTIAL_CASH">Partial cash, rest later</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              );
            })()}

            {/* Payment Mode - Quick Toggle */}
            <div style={s.formGroup}>
              <label style={s.label}>Payment Mode</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { val: 'CASH', icon: '💵', label: 'Cash' },
                  { val: 'UPI', icon: '📱', label: 'UPI' },
                  { val: 'CARD', icon: '💳', label: 'Card' },
                ].map(m => (
                  <button key={m.val} onClick={() => setQuickForm({ ...quickForm, paymentMode: m.val })}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 600,
                      border: quickForm.paymentMode === m.val ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      background: quickForm.paymentMode === m.val ? '#eff6ff' : '#fff',
                      color: quickForm.paymentMode === m.val ? '#2563eb' : '#64748b'
                    }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Name - Quick */}
            <div style={s.formGroup}>
              <input type="text" value={quickForm.customerName} onChange={e => setQuickForm({ ...quickForm, customerName: e.target.value })}
                placeholder="Customer name (optional, press Enter to skip)" style={s.input} />
            </div>

            {/* Change Returned Confirmation */}
            {quickForm.expectedAmount && quickForm.amount && Number(quickForm.amount) > Number(quickForm.expectedAmount) && !changeConfirmed && (
              <div style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>
                  ✋ Did you return {INR(Number(quickForm.amount) - Number(quickForm.expectedAmount))} change to customer?
                </div>
                <button onClick={() => setChangeConfirmed(true)}
                  style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
                  ✅ Yes, Change Returned
                </button>
              </div>
            )}

            <div style={s.modalActions}>
              <button onClick={() => setShowQuickEntry(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleQuickEntry} 
                disabled={!quickForm.amount || (quickForm.expectedAmount && quickForm.amount && Number(quickForm.amount) > Number(quickForm.expectedAmount) && !changeConfirmed)}
                style={{ ...s.saveBtn, fontSize: '1.1rem', padding: '0.85rem 2rem', opacity: quickForm.amount && !(quickForm.expectedAmount && quickForm.amount && Number(quickForm.amount) > Number(quickForm.expectedAmount) && !changeConfirmed) ? 1 : 0.5 }}>
                💾 Save & Next Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Day Modal */}
      {showCloseModal && (
        <div style={s.modalOverlay} onClick={() => setShowCloseModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>🔒 Close Day</h2>

            <div style={{ ...s.card, background: '#f0fdf4', marginBottom: '1rem' }}>
              <div style={s.cardLabel}>Expected Cash in Drawer (System)</div>
              <div style={{ ...s.cardValue, color: '#059669' }}>{INR(todayData?.expectedCashInDrawer)}</div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Actual Cash Counted in Drawer</label>
              <input type="number" value={closeForm.actualCash} onChange={e => setCloseForm({ ...closeForm, actualCash: e.target.value })}
                placeholder="Count and enter actual cash" style={{ ...s.input, fontSize: '1.5rem', fontWeight: 700 }} />
            </div>

            {closeForm.actualCash && todayData?.expectedCashInDrawer != null && (
              <div style={{
                padding: '1rem', borderRadius: '8px', marginBottom: '1rem',
                background: Number(closeForm.actualCash) - Number(todayData.expectedCashInDrawer) === 0 ? '#f0fdf4' :
                            Number(closeForm.actualCash) - Number(todayData.expectedCashInDrawer) < 0 ? '#fef2f2' : '#fffbeb',
                border: Number(closeForm.actualCash) - Number(todayData.expectedCashInDrawer) === 0 ? '1px solid #86efac' :
                        Number(closeForm.actualCash) - Number(todayData.expectedCashInDrawer) < 0 ? '1px solid #fca5a5' : '1px solid #fde68a'
              }}>
                <strong>
                  {Number(closeForm.actualCash) - Number(todayData.expectedCashInDrawer) === 0 ? '✅ PERFECT MATCH!' :
                   Number(closeForm.actualCash) - Number(todayData.expectedCashInDrawer) < 0 ? `⚠️ SHORTAGE: ${INR(Math.abs(Number(closeForm.actualCash) - Number(todayData.expectedCashInDrawer)))}` :
                   `💰 EXCESS: ${INR(Number(closeForm.actualCash) - Number(todayData.expectedCashInDrawer))}`}
                </strong>
              </div>
            )}

            <div style={s.formGroup}>
              <label style={s.label}>Denomination Breakdown (Optional)</label>
              <div style={s.denomGrid}>
                {DENOMINATIONS.map(d => (
                  <div key={d.key} style={s.denomRow}>
                    <span style={s.denomLabel}>{d.label} ×</span>
                    <input type="number" min="0" value={closeForm.denominations[d.key] || ''}
                      onChange={e => setCloseForm({ ...closeForm, denominations: { ...closeForm.denominations, [d.key]: e.target.value } })}
                      style={s.denomInput} placeholder="0" />
                    <span style={s.denomTotal}>= {INR((parseInt(closeForm.denominations[d.key]) || 0) * d.value)}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
                Denomination Total: {INR(calcDenomTotal(closeForm.denominations))}
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Notes</label>
              <textarea value={closeForm.notes} onChange={e => setCloseForm({ ...closeForm, notes: e.target.value })}
                placeholder="Any notes about today's cash..." style={{ ...s.input, minHeight: '80px' }} />
            </div>

            <div style={s.modalActions}>
              <button onClick={() => setShowCloseModal(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleCloseDay} style={s.closeBtn}>🔒 Close Day</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { maxWidth: '1200px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  headerActions: { display: 'flex', gap: '0.75rem' },
  openBtn: { background: '#22c55e', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' },
  quickBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' },
  closeBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' },
  tab: { background: 'none', border: 'none', padding: '0.75rem 1.25rem', cursor: 'pointer', color: '#64748b', fontWeight: 500, borderRadius: '8px 8px 0 0' },
  activeTab: { background: '#eff6ff', border: 'none', padding: '0.75rem 1.25rem', cursor: 'pointer', color: '#2563eb', fontWeight: 700, borderRadius: '8px 8px 0 0', borderBottom: '3px solid #2563eb' },
  notOpened: { textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  card: { background: '#fff', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  cardLabel: { fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' },
  cardValue: { fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' },
  shortAlert: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', color: '#991b1b', fontWeight: 500 },
  section: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  badge: (type) => ({ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
    background: type === 'CASH_SALE' ? '#dcfce7' : type === 'UPI_SALE' ? '#dbeafe' : type === 'SHORT_PAYMENT' ? '#fee2e2' : type === 'EXPENSE' ? '#fef3c7' : type === 'CASH_RECEIVED' ? '#e0e7ff' : type === 'CASH_PAID_OUT' ? '#fce7f3' : '#f1f5f9',
    color: type === 'CASH_SALE' ? '#166534' : type === 'UPI_SALE' ? '#1e40af' : type === 'SHORT_PAYMENT' ? '#991b1b' : type === 'EXPENSE' ? '#92400e' : type === 'CASH_RECEIVED' ? '#3730a3' : type === 'CASH_PAID_OUT' ? '#9d174d' : '#475569' }),
  empty: { textAlign: 'center', padding: '2rem', color: '#94a3b8' },
  summaryBar: { display: 'flex', gap: '2rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' },
  summaryItem: { display: 'flex', flexDirection: 'column' },
  summaryLabel: { fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' },
  summaryValue: { fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' },
  analysisGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  closedBadge: { padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b' },
  openBadge: { padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' },
  // Modal styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' },
  formGroup: { marginBottom: '1rem' },
  formRow: { display: 'flex', gap: '1rem' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' },
  input: { width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' },
  denomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  denomRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  denomLabel: { fontSize: '0.85rem', fontWeight: 500, color: '#475569', minWidth: '60px' },
  denomInput: { width: '60px', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'center' },
  denomTotal: { fontSize: '0.85rem', color: '#64748b', minWidth: '70px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' },
  cancelBtn: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
  saveBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
  alertBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
  alertClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#64748b' },
};
