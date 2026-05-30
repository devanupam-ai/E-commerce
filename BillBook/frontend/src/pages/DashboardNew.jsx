import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setStats(r.data))
      .catch(err => { console.error('Dashboard error:', err); setError(err.response?.statusText || err.message || 'Failed to load'); });
  }, []);

  if (error) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>⚠️</div>
      <div style={{ color:'#EF4444', fontWeight:600, fontSize:16 }}>Failed to load dashboard</div>
      <div style={{ color:'#6B7280', fontSize:13 }}>{error}</div>
      <button onClick={() => { setError(null); window.location.reload(); }} style={{ background:'#6C3CE1', color:'#fff', border:'none', borderRadius:10, padding:'8px 20px', cursor:'pointer', fontWeight:600 }}>Retry</button>
    </div>
  );

  if (!stats) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div style={{ width:40, height:40, border:'4px solid #E5E7EB', borderTopColor:'#6C3CE1', borderRadius:'50%', animation:'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  const statusColor = s => ({ PAID:'#10b981', UNPAID:'#ef4444', PARTIAL:'#f59e0b', OVERDUE:'#dc2626' }[s] || '#999');

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1E293B' }}>📊 Dashboard</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>Your business at a glance</p>
        </div>
        <div style={{ fontSize:13, color:'#6B7280', background:'#F1F5F9', padding:'8px 16px', borderRadius:10, fontWeight:600 }}>
          📅 {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14, marginBottom:20 }}>
        {[
          { label:"Today's Sales", value:'₹'+Number(stats.todaySales||0).toLocaleString('en-IN'), color:'#6C3CE1', bg:'#F5F3FF', icon:'💰' },
          { label:'Month Sales', value:'₹'+Number(stats.monthSales).toLocaleString('en-IN'), color:'#4F46E5', bg:'#EEF2FF', icon:'📈' },
          { label:'Outstanding', value:'₹'+Number(stats.outstanding).toLocaleString('en-IN'), color:'#EF4444', bg:'#FEF2F2', icon:'⚠️' },
          { label:'Total Payable', value:'₹'+Number(stats.totalPayable||0).toLocaleString('en-IN'), color:'#DC2626', bg:'#FEF2F2', icon:'📤' },
          { label:'Customers', value:stats.totalCustomers, color:'#10B981', bg:'#F0FDF4', icon:'👥' },
          { label:'Vendors', value:stats.totalVendors||0, color:'#8B5CF6', bg:'#F5F3FF', icon:'🏭' },
          { label:'Products', value:stats.totalProducts, color:'#F59E0B', bg:'#FFFBEB', icon:'📦' },
          { label:'Unpaid Invoices', value:stats.unpaidInvoices, color:'#6366F1', bg:'#EEF2FF', icon:'🧾' },
          { label:'Low Stock Items', value:stats.lowStockCount, color:'#EC4899', bg:'#FDF2F8', icon:'📦' },
        ].map(c => (
          <div key={c.label} style={{ background:c.bg, borderRadius:14, padding:18, border:`1px solid ${c.color}20`, transition:'transform 0.2s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</span>
              <span style={{ fontSize:18 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:700, color:c.color, marginTop:6 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Alert Section - Overdue & Low Stock */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* Overdue Invoices Alert */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ background:'#FEF2F2', padding:14, display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #FEE2E2' }}>
            <span style={{ fontSize:18 }}>🔔</span>
            <span style={{ fontWeight:700, color:'#DC2626', fontSize:14 }}>Overdue Invoices ({stats.overdueInvoices?.length || 0})</span>
          </div>
          <div style={{ maxHeight:200, overflowY:'auto' }}>
            {(!stats.overdueInvoices || stats.overdueInvoices.length === 0) && (
              <div style={{ padding:20, textAlign:'center', color:'#10B981', fontWeight:600 }}>✅ No overdue invoices!</div>
            )}
            {stats.overdueInvoices?.slice(0, 5).map(inv => (
              <div key={inv.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:'1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:'#1E293B' }}>{inv.customer?.name || 'Unknown'}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{inv.invoiceNumber} • Due: {inv.dueDate}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:700, color:'#EF4444', fontSize:14 }}>₹{Number(inv.balanceDue).toLocaleString('en-IN')}</div>
                  <span style={{ background:'#FEE2E2', color:'#DC2626', padding:'1px 8px', borderRadius:6, fontSize:10, fontWeight:600 }}>OVERDUE</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ background:'#FDF2F8', padding:14, display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #FCE7F3' }}>
            <span style={{ fontSize:18 }}>📦</span>
            <span style={{ fontWeight:700, color:'#EC4899', fontSize:14 }}>Low Stock Alert ({stats.lowStockItems?.length || 0})</span>
          </div>
          <div style={{ maxHeight:200, overflowY:'auto' }}>
            {(!stats.lowStockItems || stats.lowStockItems.length === 0) && (
              <div style={{ padding:20, textAlign:'center', color:'#10B981', fontWeight:600 }}>✅ All products well stocked!</div>
            )}
            {stats.lowStockItems?.slice(0, 5).map(p => (
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:'1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:'#1E293B' }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{p.category || 'No category'} • {p.unit}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:700, color: Number(p.stockQuantity) <= 0 ? '#EF4444' : '#F59E0B', fontSize:14 }}>{Number(p.stockQuantity)} left</div>
                  <span style={{ background: Number(p.stockQuantity) <= 0 ? '#FEE2E2' : '#FEF3C7', color: Number(p.stockQuantity) <= 0 ? '#DC2626' : '#D97706', padding:'1px 8px', borderRadius:6, fontSize:10, fontWeight:600 }}>
                    {Number(p.stockQuantity) <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:14, borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:700, color:'#1E293B', fontSize:15 }}>🧾 Recent Invoices</span>
          <a href="/invoices" style={{ color:'#6C3CE1', fontSize:13, fontWeight:600, textDecoration:'none' }}>View All →</a>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8FAFC' }}>
              <th style={thStyle}>Invoice #</th>
              <th style={thStyle}>Customer</th>
              <th style={{...thStyle, textAlign:'right'}}>Amount</th>
              <th style={{...thStyle, textAlign:'right'}}>Balance</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentInvoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom:'1px solid #F1F5F9' }}>
                <td style={tdStyle}><strong>{inv.invoiceNumber}</strong></td>
                <td style={tdStyle}>{inv.customer?.name || '-'}</td>
                <td style={{...tdStyle, textAlign:'right', fontWeight:600}}>₹{Number(inv.totalAmount).toLocaleString('en-IN')}</td>
                <td style={{...tdStyle, textAlign:'right', color: Number(inv.balanceDue)>0 ? '#EF4444' : '#10B981', fontWeight:600}}>₹{Number(inv.balanceDue).toLocaleString('en-IN')}</td>
                <td style={tdStyle}>
                  <span style={{ background: statusColor(inv.paymentStatus)+'20', color: statusColor(inv.paymentStatus), padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600 }}>{inv.paymentStatus}</span>
                </td>
                <td style={tdStyle}>{inv.invoiceDate}</td>
              </tr>
            ))}
            {stats.recentInvoices.length === 0 && <tr><td colSpan={6} style={{...tdStyle, textAlign:'center', color:'#9CA3AF', padding:30 }}>No invoices yet</td></tr>}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

const thStyle = { padding:'12px 16px', fontSize:12, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5, textAlign:'left' };
const tdStyle = { padding:'12px 16px', fontSize:13, color:'#374151' };
