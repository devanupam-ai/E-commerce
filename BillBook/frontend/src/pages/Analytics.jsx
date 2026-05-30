import { useState, useEffect } from 'react';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line } from 'recharts';

const COLORS = ['#6C3CE1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(6);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [period]);

  const load = async () => {
    setError(null);
    try {
      const res = await api.get(`/analytics?months=${period}`);
      setData(res.data);
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.response?.statusText || err.message || 'Failed to load analytics');
    }
  };

  if (error) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>⚠️</div>
      <div style={{ color:'#EF4444', fontWeight:600, fontSize:16 }}>Failed to load analytics</div>
      <div style={{ color:'#6B7280', fontSize:13 }}>{error}</div>
      <button onClick={() => load()} style={{ background:'#6C3CE1', color:'#fff', border:'none', borderRadius:10, padding:'8px 20px', cursor:'pointer', fontWeight:600 }}>Retry</button>
    </div>
  );

  if (!data) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#6C3CE1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <p style={{ color: '#6B7280' }}>Loading analytics...</p>
      </div>
    </div>
  );

  const s = data.summary;

  // Merge sales & purchase trend for combined chart
  const combinedTrend = data.salesTrend.map((s, i) => ({
    name: s.name,
    Sales: Number(s.value),
    Purchases: Number(data.purchaseTrend[i]?.value || 0),
    Profit: Number(s.value) - Number(data.purchaseTrend[i]?.value || 0)
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📊 Analytics Dashboard</h2>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>Business insights at a glance</p>
        </div>
        <select value={period} onChange={e => setPeriod(parseInt(e.target.value))}
          style={{ padding: '10px 16px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <option value={3}>Last 3 Months</option>
          <option value={6}>Last 6 Months</option>
          <option value={12}>Last 12 Months</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Sales', value: `₹${Number(s.totalSales).toLocaleString()}`, color: '#6C3CE1', bg: '#F5F3FF', icon: '💰' },
          { label: 'Total Purchases', value: `₹${Number(s.totalPurchases).toLocaleString()}`, color: '#0EA5E9', bg: '#F0F9FF', icon: '🛒' },
          { label: 'Profit', value: `₹${Number(s.profit).toLocaleString()}`, color: Number(s.profit) >= 0 ? '#10B981' : '#EF4444', bg: Number(s.profit) >= 0 ? '#F0FDF4' : '#FEF2F2', icon: '📈' },
          { label: 'Outstanding', value: `₹${Number(s.outstanding).toLocaleString()}`, color: '#EF4444', bg: '#FEF2F2', icon: '⏳' },
          { label: 'Payable', value: `₹${Number(s.payable).toLocaleString()}`, color: '#F59E0B', bg: '#FFFBEB', icon: '📋' },
          { label: 'Customers', value: s.totalCustomers, color: '#10B981', bg: '#F0FDF4', icon: '👥' },
          { label: 'Vendors', value: s.totalVendors, color: '#8B5CF6', bg: '#F5F3FF', icon: '🏭' },
          { label: 'Invoices', value: s.totalInvoices, color: '#0EA5E9', bg: '#F0F9FF', icon: '🧾' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 16, padding: 18, border: `1px solid ${c.color}20` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</span>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Sales vs Purchases Trend + Invoice Status Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Sales vs Purchases Bar Chart */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #6C3CE1, #4F46E5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📊</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Sales vs Purchases</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={combinedTrend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB' }} />
              <Bar dataKey="Sales" fill="#6C3CE1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Purchases" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Pie */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🧾</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Invoice Status</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.invoiceStatusPie.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {data.invoiceStatusPie.filter(d => d.value > 0).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Profit Trend + Purchase Status Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Profit Area Chart */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📈</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Profit Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={combinedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB' }} />
              <Area type="monotone" dataKey="Profit" stroke="#10B981" fill="#10B98120" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Purchase Status Pie */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🛒</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Purchase Status</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.purchaseStatusPie.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {data.purchaseStatusPie.filter(d => d.value > 0).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Payment Mode Pie + Top Customers + Top Vendors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Payment Mode Pie */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💳</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Payment Modes</span>
          </div>
          {data.paymentModePie.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.paymentModePie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {data.paymentModePie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Customers */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👥</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Top Customers</span>
          </div>
          {data.topCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.topCustomers.map((c, i) => {
                const maxVal = Number(data.topCustomers[0]?.value || 1);
                const pct = (Number(c.value) / maxVal) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>₹{Number(c.value).toLocaleString()}</span>
                    </div>
                    <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[i]}, ${COLORS[i]}CC)`, borderRadius: 4, transition: 'width 0.5s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Vendors */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏭</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Top Vendors</span>
          </div>
          {data.topVendors.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.topVendors.map((v, i) => {
                const maxVal = Number(data.topVendors[0]?.value || 1);
                const pct = (Number(v.value) / maxVal) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{v.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6' }}>₹{Number(v.value).toLocaleString()}</span>
                    </div>
                    <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[i+2]}, ${COLORS[i+2]}CC)`, borderRadius: 4, transition: 'width 0.5s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Top Products + Low Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Top Selling Products */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏆</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Top Selling Products</span>
          </div>
          {data.topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#1E293B' }} width={100} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {data.topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock Products */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #EF4444, #DC2626)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚠️</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Low Stock Alert</span>
            <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{data.lowStockProducts.length}</span>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <div style={{ color: '#10B981', fontWeight: 600 }}>All products are well stocked!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.lowStockProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1E293B' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{p.category || 'No category'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: Number(p.stockQuantity) === 0 ? '#DC2626' : '#F59E0B' }}>{Number(p.stockQuantity)}</div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>in stock</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 5: Sales & Purchase Line Trend */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #EC4899, #DB2777)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📉</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Revenue & Expense Trend</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB' }} />
            <Legend />
            <Line type="monotone" dataKey="Sales" stroke="#6C3CE1" strokeWidth={3} dot={{ fill: '#6C3CE1', r: 5 }} />
            <Line type="monotone" dataKey="Purchases" stroke="#0EA5E9" strokeWidth={3} dot={{ fill: '#0EA5E9', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
