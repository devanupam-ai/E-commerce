
import { useState, useEffect } from 'react';
import { cashFlowAPI } from '../api';

export default function CashFlowTimeline() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('MONTH');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ entryDate: new Date().toISOString().split('T')[0], flowType: 'INFLOW', amount: '', category: 'SALES', description: '' });

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await cashFlowAPI.getTimeline(period);
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addEntry = async () => {
    try {
      await cashFlowAPI.addEntry(form);
      setShowAdd(false);
      setForm({ entryDate: new Date().toISOString().split('T')[0], flowType: 'INFLOW', amount: '', category: 'SALES', description: '' });
      loadData();
    } catch (e) { alert('Failed to add entry'); }
  };

  const CATEGORIES = {
    INFLOW: ['SALES', 'PAYMENT_RECEIVED', 'REFUND', 'OTHER'],
    OUTFLOW: ['EXPENSE', 'SALARY', 'RENT', 'PURCHASE', 'TAX', 'MARKETING', 'TRANSPORT', 'OTHER']
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading cash flow data...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>💰 Cash Flow Timeline</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={loadData}>🔄</button>
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Add Entry</button>
        </div>
      </div>

      {/* Period Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['WEEK','MONTH','QUARTER','YEAR'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: period === p ? '#6C3CE1' : '#E5E7EB', color: period === p ? '#fff' : '#374151', border: 'none', cursor: 'pointer' }}>
            {p}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      {data && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: 160, borderLeft: '4px solid #10B981' }}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Total Inflow</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#10B981', marginTop: 4 }}>₹{parseFloat(data.totalInflow || 0).toFixed(0)}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>Money received</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 160, borderLeft: '4px solid #DC2626' }}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Total Outflow</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>₹{parseFloat(data.totalOutflow || 0).toFixed(0)}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>Money spent</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 160, borderLeft: `4px solid ${parseFloat(data.netCashFlow || 0) >= 0 ? '#10B981' : '#DC2626'}` }}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Net Cash Flow</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: parseFloat(data.netCashFlow || 0) >= 0 ? '#10B981' : '#DC2626', marginTop: 4 }}>
              {parseFloat(data.netCashFlow || 0) >= 0 ? '+' : ''}₹{parseFloat(data.netCashFlow || 0).toFixed(0)}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{parseFloat(data.netCashFlow || 0) >= 0 ? 'Profit ✅' : 'Loss ⚠️'}</div>
          </div>
        </div>
      )}

      {/* Add Entry Form */}
      {showAdd && (
        <div className="card animate-slideIn" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>➕ Add Cash Flow Entry</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Date</label>
              <input type="date" value={form.entryDate} onChange={e => setForm({...form, entryDate: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }} />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Type</label>
              <select value={form.flowType} onChange={e => setForm({...form, flowType: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }}>
                <option value="INFLOW">📥 Inflow</option>
                <option value="OUTFLOW">📤 Outflow</option>
              </select>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Amount (₹)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0"
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }}>
                {CATEGORIES[form.flowType].map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Description</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional note"
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }} />
            </div>
            <button className="btn-primary" onClick={addEntry}>💾 Save</button>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Simple Bar Chart */}
      {data && data.dailyInflow && Object.keys(data.dailyInflow).length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📊 Daily Cash Flow</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
            {Object.entries(data.dailyInflow).map(([date, amt]) => {
              const outAmt = data.dailyOutflow[date] || 0;
              const maxVal = Math.max(...Object.values(data.dailyInflow), ...Object.values(data.dailyOutflow || {}), 1);
              return (
                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 80 }}>
                    <div style={{ width: 8, background: '#10B981', height: `${(amt / maxVal) * 80}px`, borderRadius: '2px 2px 0 0', minHeight: amt > 0 ? 2 : 0 }} />
                    <div style={{ width: 8, background: '#DC2626', height: `${(outAmt / maxVal) * 80}px`, borderRadius: '2px 2px 0 0', minHeight: outAmt > 0 ? 2 : 0 }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>{date.split('-')[2]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, background: '#10B981', borderRadius: 2 }} /><span style={{ fontSize: 11, color: '#6B7280' }}>Inflow</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, background: '#DC2626', borderRadius: 2 }} /><span style={{ fontSize: 11, color: '#6B7280' }}>Outflow</span></div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Transactions</h3>
        {data && data.entries && data.entries.length > 0 ? (
          <div>
            {data.entries.map((e, i) => (
              <div key={i} className="timeline-item">
                <div style={{ position: 'relative' }}>
                  <div className="timeline-dot" style={{ background: e.flowType === 'INFLOW' ? '#10B981' : '#DC2626' }} />
                  {i < data.entries.length - 1 && <div className="timeline-line" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        {e.flowType === 'INFLOW' ? '📥' : '📤'} {e.category?.replace('_',' ')}
                      </span>
                      <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8 }}>{e.description}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 16, color: e.flowType === 'INFLOW' ? '#10B981' : '#DC2626' }}>
                      {e.flowType === 'INFLOW' ? '+' : '-'}₹{parseFloat(e.amount || 0).toFixed(0)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    {e.entryDate} • Balance: ₹{parseFloat(e.runningBalance || 0).toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 30, color: '#6B7280' }}>
            No transactions for this period. Add your first entry!
          </div>
        )}
      </div>

      {/* Upcoming Commitments */}
      {data && data.upcoming && data.upcoming.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>📅 Upcoming Commitments</h3>
          {data.upcoming.map((u, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 13 }}>{u.description}</span>
              <span style={{ fontWeight: 700, color: '#3B82F6' }}>₹{parseFloat(u.amount || 0).toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
