
import { useState } from 'react';
import api from '../api';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('profit-loss');
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [partyType, setPartyType] = useState('customer');
  const [partyId, setPartyId] = useState('');
  const [parties, setParties] = useState([]);
  const [dayDate, setDayDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '';
      if (activeTab === 'profit-loss') url = `/reports/profit-loss?from=${from}&to=${to}`;
      else if (activeTab === 'gst') url = `/reports/gst?from=${from}&to=${to}`;
      else if (activeTab === 'party-ledger') url = `/reports/party-ledger?type=${partyType}&partyId=${partyId}`;
      else if (activeTab === 'day-book') url = `/reports/day-book?date=${dayDate}`;
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setData(null);
    }
    setLoading(false);
  };

  const loadParties = async (type) => {
    setPartyType(type);
    try {
      const res = await api.get('/customers');
      const filtered = type === 'customer' ? res.data.filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH') : res.data.filter(c => c.type === 'VENDOR' || c.type === 'BOTH');
      setParties(filtered);
    } catch { setParties([]); }
  };

  const tabs = [
    { id:'profit-loss', icon:'📊', label:'Profit & Loss' },
    { id:'gst', icon:'🧾', label:'GST Report' },
    { id:'party-ledger', icon:'📒', label:'Party Ledger' },
    { id:'day-book', icon:'📅', label:'Day Book' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1E293B' }}>📑 Reports</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>Business insights & financial reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setData(null); }} style={{
            background: activeTab===t.id ? '#6C3CE1' : '#F1F5F9', color: activeTab===t.id ? '#fff' : '#475569',
            border:'none', borderRadius:10, padding:'10px 18px', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s'
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Date Filters */}
      <div style={{ background:'#fff', borderRadius:14, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        {(activeTab === 'profit-loss' || activeTab === 'gst') && (
          <>
            <input style={inputStyle} type="date" value={from} onChange={e => setFrom(e.target.value)} />
            <span style={{ color:'#6B7280', fontWeight:600 }}>to</span>
            <input style={inputStyle} type="date" value={to} onChange={e => setTo(e.target.value)} />
          </>
        )}
        {activeTab === 'party-ledger' && (
          <>
            <select style={inputStyle} value={partyType} onChange={e => loadParties(e.target.value)}>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
            <select style={inputStyle} value={partyId} onChange={e => setPartyId(e.target.value)}>
              <option value="">Select {partyType}</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </>
        )}
        {activeTab === 'day-book' && (
          <input style={inputStyle} type="date" value={dayDate} onChange={e => setDayDate(e.target.value)} />
        )}
        <button onClick={fetchReport} style={btnPrimary} disabled={loading}>
          {loading ? 'Loading...' : '🔍 Generate Report'}
        </button>
      </div>

      {/* Report Content */}
      {!data && !loading && (
        <div style={{ textAlign:'center', padding:60, color:'#9CA3AF' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📑</div>
          <div style={{ fontWeight:600, fontSize:16 }}>Select filters and generate report</div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ width:40, height:40, border:'4px solid #E5E7EB', borderTopColor:'#6C3CE1', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }}></div>
        </div>
      )}

      {/* Profit & Loss */}
      {activeTab === 'profit-loss' && data && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:14, marginBottom:20 }}>
            {[
              { label:'Total Sales', value:data.totalSales, color:'#6C3CE1', bg:'#F5F3FF' },
              { label:'Total Purchases', value:data.totalPurchases, color:'#0EA5E9', bg:'#F0F9FF' },
              { label:'Gross Profit', value:data.grossProfit, color:'#10B981', bg:'#F0FDF4' },
              { label:'Total Expenses', value:data.totalExpenses, color:'#EF4444', bg:'#FEF2F2' },
              { label:'Net Profit', value:data.netProfit, color: Number(data.netProfit)>=0 ? '#10B981' : '#EF4444', bg: Number(data.netProfit)>=0 ? '#F0FDF4' : '#FEF2F2' },
            ].map(c => (
              <div key={c.label} style={{ background:c.bg, borderRadius:14, padding:16, border:`1px solid ${c.color}20` }}>
                <div style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</div>
                <div style={{ fontSize:20, fontWeight:700, color:c.color, marginTop:4 }}>₹{Number(c.value).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Monthly Breakdown */}
          {data.monthly && data.monthly.length > 0 && (
            <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ padding:16, borderBottom:'1px solid #F1F5F9', fontWeight:700, color:'#1E293B' }}>📅 Monthly Breakdown</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    <th style={thStyle}>Month</th>
                    <th style={{...thStyle, textAlign:'right'}}>Sales</th>
                    <th style={{...thStyle, textAlign:'right'}}>Purchases</th>
                    <th style={{...thStyle, textAlign:'right'}}>Gross Profit</th>
                    <th style={{...thStyle, textAlign:'right'}}>Expenses</th>
                    <th style={{...thStyle, textAlign:'right'}}>Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly.map((m, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                      <td style={tdStyle}><strong>{m.name}</strong></td>
                      <td style={{...tdStyle, textAlign:'right'}}>₹{Number(m.sales).toLocaleString()}</td>
                      <td style={{...tdStyle, textAlign:'right'}}>₹{Number(m.purchases).toLocaleString()}</td>
                      <td style={{...tdStyle, textAlign:'right', color: Number(m.grossProfit)>=0 ? '#10B981' : '#EF4444', fontWeight:600}}>₹{Number(m.grossProfit).toLocaleString()}</td>
                      <td style={{...tdStyle, textAlign:'right'}}>₹{Number(m.expenses).toLocaleString()}</td>
                      <td style={{...tdStyle, textAlign:'right', color: Number(m.netProfit)>=0 ? '#10B981' : '#EF4444', fontWeight:700}}>₹{Number(m.netProfit).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GST Report */}
      {activeTab === 'gst' && data && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
            {/* Sales GST */}
            <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop:0, fontSize:16, fontWeight:700, color:'#6C3CE1' }}>📤 Sales GST (GSTR-1)</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                {[
                  ['Taxable Value', data.salesGst?.totalTaxable],
                  ['CGST', data.salesGst?.cgst],
                  ['SGST', data.salesGst?.sgst],
                  ['IGST', data.salesGst?.igst],
                  ['Total Tax', data.salesGst?.totalTax],
                ].map(([l, v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                    <span style={{ fontSize:13, color:'#6B7280' }}>{l}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>₹{Number(v || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Purchase GST */}
            <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop:0, fontSize:16, fontWeight:700, color:'#0EA5E9' }}>📥 Purchase GST (GSTR-2)</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                {[
                  ['Taxable Value', data.purchaseGst?.totalTaxable],
                  ['CGST', data.purchaseGst?.cgst],
                  ['SGST', data.purchaseGst?.sgst],
                  ['IGST', data.purchaseGst?.igst],
                  ['Total Tax', data.purchaseGst?.totalTax],
                ].map(([l, v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                    <span style={{ fontSize:13, color:'#6B7280' }}>{l}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>₹{Number(v || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Net Payable */}
          <div style={{ background: Number(data.netPayable)>=0 ? '#FEF2F2' : '#F0FDF4', borderRadius:14, padding:20, marginBottom:20, textAlign:'center', border:`1px solid ${Number(data.netPayable)>=0 ? '#EF444420' : '#10B98120'}` }}>
            <div style={{ fontSize:13, color:'#6B7280', fontWeight:600 }}>GST Net Payable</div>
            <div style={{ fontSize:28, fontWeight:700, color: Number(data.netPayable)>=0 ? '#EF4444' : '#10B981', marginTop:4 }}>₹{Number(data.netPayable || 0).toLocaleString()}</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:4 }}>{Number(data.netPayable)>=0 ? 'You need to pay' : 'Input tax credit available'}</div>
          </div>

          {/* Invoice-wise GST */}
          {data.invoiceGstDetails && data.invoiceGstDetails.length > 0 && (
            <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ padding:16, borderBottom:'1px solid #F1F5F9', fontWeight:700, color:'#1E293B' }}>🧾 Invoice-wise GST Details</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    <th style={thStyle}>Invoice #</th>
                    <th style={thStyle}>Customer</th>
                    <th style={{...thStyle, textAlign:'right'}}>Taxable</th>
                    <th style={{...thStyle, textAlign:'right'}}>CGST</th>
                    <th style={{...thStyle, textAlign:'right'}}>SGST</th>
                    <th style={{...thStyle, textAlign:'right'}}>IGST</th>
                    <th style={{...thStyle, textAlign:'right'}}>Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoiceGstDetails.map((inv, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                      <td style={tdStyle}><strong>{inv.invoiceNumber}</strong></td>
                      <td style={tdStyle}>{inv.customerName}</td>
                      <td style={{...tdStyle, textAlign:'right'}}>₹{Number(inv.taxableValue).toLocaleString()}</td>
                      <td style={{...tdStyle, textAlign:'right'}}>₹{Number(inv.cgst).toLocaleString()}</td>
                      <td style={{...tdStyle, textAlign:'right'}}>₹{Number(inv.sgst).toLocaleString()}</td>
                      <td style={{...tdStyle, textAlign:'right'}}>₹{Number(inv.igst).toLocaleString()}</td>
                      <td style={{...tdStyle, textAlign:'right', fontWeight:700}}>₹{Number(inv.totalTax).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Party Ledger */}
      {activeTab === 'party-ledger' && data && (
        <div>
          <div style={{ background: Number(data.closingBalance)>=0 ? '#F5F3FF' : '#F0FDF4', borderRadius:14, padding:20, marginBottom:20, textAlign:'center', border:`1px solid ${Number(data.closingBalance)>=0 ? '#6C3CE120' : '#10B98120'}` }}>
            <div style={{ fontSize:13, color:'#6B7280', fontWeight:600 }}>Closing Balance</div>
            <div style={{ fontSize:28, fontWeight:700, color: Number(data.closingBalance)>=0 ? '#6C3CE1' : '#10B981', marginTop:4 }}>₹{Number(data.closingBalance).toLocaleString()}</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:4 }}>{Number(data.closingBalance)>=0 ? 'Amount receivable' : 'Amount payable'}</div>
          </div>

          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Particular</th>
                  <th style={thStyle}>Type</th>
                  <th style={{...thStyle, textAlign:'right'}}>Debit (₹)</th>
                  <th style={{...thStyle, textAlign:'right'}}>Credit (₹)</th>
                  <th style={{...thStyle, textAlign:'right'}}>Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(!data.transactions || data.transactions.length === 0) && (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>No transactions found</td></tr>
                )}
                {data.transactions?.map((t, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                    <td style={tdStyle}>{t.date}</td>
                    <td style={tdStyle}><strong>{t.particular}</strong></td>
                    <td style={tdStyle}>
                      <span style={{ background: t.type==='SALE' ? '#EDE9FE' : t.type==='PAYMENT' ? '#D1FAE5' : t.type==='PURCHASE' ? '#DBEAFE' : '#FEF3C7', color: t.type==='SALE' ? '#6C3CE1' : t.type==='PAYMENT' ? '#059669' : t.type==='PURCHASE' ? '#2563EB' : '#D97706', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{t.type}</span>
                    </td>
                    <td style={{...tdStyle, textAlign:'right', color: Number(t.debit)>0 ? '#EF4444' : '#9CA3AF' }}>{Number(t.debit)>0 ? Number(t.debit).toLocaleString() : '—'}</td>
                    <td style={{...tdStyle, textAlign:'right', color: Number(t.credit)>0 ? '#10B981' : '#9CA3AF' }}>{Number(t.credit)>0 ? Number(t.credit).toLocaleString() : '—'}</td>
                    <td style={{...tdStyle, textAlign:'right', fontWeight:700, color: Number(t.balance)>=0 ? '#6C3CE1' : '#10B981' }}>{Number(t.balance).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day Book */}
      {activeTab === 'day-book' && data && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:20 }}>
            {[
              { label:'Total Sales', value:data.totalSales, color:'#6C3CE1', bg:'#F5F3FF' },
              { label:'Total Purchases', value:data.totalPurchases, color:'#0EA5E9', bg:'#F0F9FF' },
              { label:'Payments Received', value:data.totalReceived, color:'#10B981', bg:'#F0FDF4' },
              { label:'Total Expenses', value:data.totalExpenses, color:'#EF4444', bg:'#FEF2F2' },
            ].map(c => (
              <div key={c.label} style={{ background:c.bg, borderRadius:14, padding:16, border:`1px solid ${c.color}20` }}>
                <div style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</div>
                <div style={{ fontSize:20, fontWeight:700, color:c.color, marginTop:4 }}>₹{Number(c.value).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Invoices */}
          {data.invoices?.length > 0 && (
            <div style={{ background:'#fff', borderRadius:14, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:16 }}>
              <h4 style={{ marginTop:0, color:'#6C3CE1' }}>🧾 Invoices ({data.invoices.length})</h4>
              {data.invoices.map(inv => (
                <div key={inv.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                  <span style={{ fontSize:13 }}>{inv.invoiceNumber} — {inv.customer?.name}</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>₹{Number(inv.totalAmount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Purchases */}
          {data.purchases?.length > 0 && (
            <div style={{ background:'#fff', borderRadius:14, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:16 }}>
              <h4 style={{ marginTop:0, color:'#0EA5E9' }}>🛒 Purchases ({data.purchases.length})</h4>
              {data.purchases.map(p => (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                  <span style={{ fontSize:13 }}>{p.purchaseNumber} — {p.vendor?.name}</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>₹{Number(p.totalAmount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Payments */}
          {data.payments?.length > 0 && (
            <div style={{ background:'#fff', borderRadius:14, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:16 }}>
              <h4 style={{ marginTop:0, color:'#10B981' }}>💰 Payments ({data.payments.length})</h4>
              {data.payments.map(p => (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                  <span style={{ fontSize:13 }}>{p.paymentMode} — {p.customer?.name || '—'}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#10B981' }}>₹{Number(p.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Expenses */}
          {data.expenses?.length > 0 && (
            <div style={{ background:'#fff', borderRadius:14, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:16 }}>
              <h4 style={{ marginTop:0, color:'#EF4444' }}>💸 Expenses ({data.expenses.length})</h4>
              {data.expenses.map(e => (
                <div key={e.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                  <span style={{ fontSize:13 }}>{e.description} ({e.category})</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#EF4444' }}>₹{Number(e.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {(!data.invoices?.length && !data.purchases?.length && !data.payments?.length && !data.expenses?.length) && (
            <div style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>No transactions on this date</div>
          )}
        </div>
      )}
    </div>
  );
}

const thStyle = { padding:'12px 16px', fontSize:12, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5, textAlign:'left' };
const tdStyle = { padding:'12px 16px', fontSize:13, color:'#374151' };
const inputStyle = { padding:'10px 14px', border:'2px solid #E5E7EB', borderRadius:10, fontSize:14, outline:'none' };
const btnPrimary = { background:'#6C3CE1', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer', fontSize:14, fontWeight:600 };
