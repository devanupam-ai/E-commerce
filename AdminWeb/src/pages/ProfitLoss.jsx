
import { useState, useEffect } from 'react';
import { profitLossAPI } from '../api';

export default function ProfitLoss() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('MONTHLY');

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await profitLossAPI.get(period);
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}><div className="animate-pulse" style={{ fontSize: 40 }}>💰</div><div style={{ marginTop: 12 }}>Loading P&L data...</div></div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 60 }}>Failed to load data</div>;

  const maxVal = Math.max(...data.monthly.map(m => Math.max(m.revenue, m.expenses, m.profit)));
  const chartHeight = 250;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>💰 Profit & Loss Dashboard</h2>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Revenue vs Expenses with monthly comparison</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['MONTHLY', 'QUARTERLY', 'YEARLY'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: period === p ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: period === p ? '#EFF6FF' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: period === p ? 700 : 400,
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>TOTAL REVENUE</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: '#10B981' }}>₹{data.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid #DC2626' }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>TOTAL EXPENSES</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: '#DC2626' }}>₹{data.totalExpenses.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: `4px solid ${data.netProfit >= 0 ? '#3B82F6' : '#DC2626'}` }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>NET PROFIT</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: data.netProfit >= 0 ? '#3B82F6' : '#DC2626' }}>
            {data.netProfit >= 0 ? '+' : ''}₹{data.netProfit.toLocaleString()}
          </div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>PROFIT MARGIN</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: '#8B5CF6' }}>{data.profitMargin}%</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 20 }}>📊 Revenue vs Expenses vs Profit</h3>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, padding: '0 20px', minWidth: data.monthly.length * 120 }}>
            {data.monthly.map((m, i) => {
              const revH = (m.revenue / maxVal) * chartHeight;
              const expH = (m.expenses / maxVal) * chartHeight;
              const profH = (Math.abs(m.profit) / maxVal) * chartHeight;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    ₹{(m.revenue / 1000).toFixed(0)}K
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: chartHeight }}>
                    <div style={{ width: 24, height: revH, background: 'linear-gradient(180deg, #10B981, #34D399)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} title={`Revenue: ₹${m.revenue.toLocaleString()}`}></div>
                    <div style={{ width: 24, height: expH, background: 'linear-gradient(180deg, #DC2626, #F87171)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} title={`Expenses: ₹${m.expenses.toLocaleString()}`}></div>
                    <div style={{ width: 24, height: profH, background: m.profit >= 0 ? 'linear-gradient(180deg, #3B82F6, #60A5FA)' : 'linear-gradient(180deg, #F59E0B, #FBBF24)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} title={`Profit: ₹${m.profit.toLocaleString()}`}></div>
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 6, fontWeight: 600 }}>{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
            <div style={{ width: 12, height: 12, background: '#10B981', borderRadius: 3 }}></div> Revenue
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
            <div style={{ width: 12, height: 12, background: '#DC2626', borderRadius: 3 }}></div> Expenses
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
            <div style={{ width: 12, height: 12, background: '#3B82F6', borderRadius: 3 }}></div> Profit
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📂 Expense Breakdown</h3>
          {data.expenseBreakdown.map((e, i) => {
            const pct = data.totalExpenses > 0 ? (e.amount / data.totalExpenses * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{e.category}</span>
                  <span style={{ color: '#6B7280' }}>₹{e.amount.toLocaleString()} ({pct.toFixed(1)}%)</span>
                </div>
                <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: e.color || '#3B82F6', borderRadius: 4, transition: 'width 0.5s' }}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📈 Revenue Sources</h3>
          {data.revenueBreakdown.map((r, i) => {
            const pct = data.totalRevenue > 0 ? (r.amount / data.totalRevenue * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{r.source}</span>
                  <span style={{ color: '#6B7280' }}>₹{r.amount.toLocaleString()} ({pct.toFixed(1)}%)</span>
                </div>
                <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: r.color || '#10B981', borderRadius: 4, transition: 'width 0.5s' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Detail Table */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Monthly Breakdown</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F3F4F6', textAlign: 'left' }}>
              {['Period', 'Revenue', 'Expenses', 'Profit', 'Margin'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.monthly.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{m.month}</td>
                <td style={{ padding: 12, color: '#10B981', fontWeight: 600 }}>₹{m.revenue.toLocaleString()}</td>
                <td style={{ padding: 12, color: '#DC2626', fontWeight: 600 }}>₹{m.expenses.toLocaleString()}</td>
                <td style={{ padding: 12, fontWeight: 700, color: m.profit >= 0 ? '#3B82F6' : '#F59E0B' }}>
                  {m.profit >= 0 ? '+' : ''}₹{m.profit.toLocaleString()}
                </td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, background: m.margin >= 20 ? '#D1FAE5' : m.margin >= 10 ? '#FEF3C7' : '#FEE2E2', color: m.margin >= 20 ? '#059669' : m.margin >= 10 ? '#D97706' : '#DC2626', fontSize: 11, fontWeight: 700 }}>
                    {m.margin}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
