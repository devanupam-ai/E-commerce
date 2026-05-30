import { useEffect, useState } from 'react';
import { gstAPI } from '../api';

export default function GstReports() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [from, setFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [gstr1, setGstr1] = useState(null);
  const [gstr3b, setGstr3b] = useState(null);
  const [hsnData, setHsnData] = useState(null);
  const [purchaseReg, setPurchaseReg] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState('b2b');

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const fmtPct = (n) => Number(n || 0).toFixed(2) + '%';

  const loadDashboard = async () => {
    try { const r = await gstAPI.dashboard(); setDashboard(r.data); } catch {}
  };

  const loadGstr1 = async () => {
    setLoading(true);
    try { const r = await gstAPI.gstr1(from, to); setGstr1(r.data); } catch {}
    setLoading(false);
  };

  const loadGstr3b = async () => {
    setLoading(true);
    try { const r = await gstAPI.gstr3b(from, to); setGstr3b(r.data); } catch {}
    setLoading(false);
  };

  const loadHsn = async () => {
    setLoading(true);
    try { const r = await gstAPI.hsnSummary(from, to); setHsnData(r.data); } catch {}
    setLoading(false);
  };

  const loadPurchaseReg = async () => {
    setLoading(true);
    try { const r = await gstAPI.purchaseRegister(from, to); setPurchaseReg(r.data); } catch {}
    setLoading(false);
  };

  const loadMonthly = async () => {
    try { const r = await gstAPI.monthlyComparison(year); setMonthlyData(r.data); } catch {}
  };

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { if (tab === 'monthly') loadMonthly(); }, [year]);

  const tabs = [
    { key:'dashboard', icon:'📊', label:'Dashboard' },
    { key:'gstr1', icon:'📤', label:'GSTR-1' },
    { key:'gstr3b', icon:'📋', label:'GSTR-3B' },
    { key:'hsn', icon:'🏷️', label:'HSN Summary' },
    { key:'purchase', icon:'📥', label:'Purchase Register' },
    { key:'monthly', icon:'📈', label:'Monthly Comparison' },
  ];

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700, color:'#1E293B' }}>🧾 GST Reports & Filing</h2>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab===t.key ? '#6C3CE1' : '#F1F5F9', color: tab===t.key ? '#fff' : '#475569',
            border:'none', borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s'
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Date Range Filter */}
      {['gstr1','gstr3b','hsn','purchase'].includes(tab) && (
        <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:20, background:'#fff', padding:14, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ fontWeight:600, color:'#475569', fontSize:13 }}>Period:</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={dateInput} />
          <span style={{ color:'#94A3B8' }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={dateInput} />
          <button onClick={() => { if(tab==='gstr1') loadGstr1(); else if(tab==='gstr3b') loadGstr3b(); else if(tab==='hsn') loadHsn(); else loadPurchaseReg(); }} style={applyBtn}>Apply</button>
          {loading && <span style={{ color:'#6C3CE1', fontSize:13 }}>⏳ Loading...</span>}
        </div>
      )}

      {/* ===== DASHBOARD ===== */}
      {tab === 'dashboard' && dashboard && (
        <div>
          {/* Current Month */}
          <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:16 }}>
            <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#1E293B' }}>📊 Current Month ({dashboard.currentPeriod?.from} to {dashboard.currentPeriod?.to})</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
              <div style={summaryCard('#6C3CE1','#F5F3FF')}>
                <div style={cardLabel}>Sales GST</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#6C3CE1' }}>₹{fmt(dashboard.currentMonth?.salesGst)}</div>
              </div>
              <div style={summaryCard('#0EA5E9','#F0F9FF')}>
                <div style={cardLabel}>Purchase GST (ITC)</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#0EA5E9' }}>₹{fmt(dashboard.currentMonth?.purchaseGst)}</div>
              </div>
              <div style={summaryCard('#EF4444','#FEF2F2')}>
                <div style={cardLabel}>Net GST Payable</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#EF4444' }}>₹{fmt(dashboard.currentMonth?.netPayable)}</div>
              </div>
              <div style={summaryCard('#10B981','#F0FDF4')}>
                <div style={cardLabel}>Invoices</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#10B981' }}>{dashboard.currentMonth?.invoiceCount}</div>
              </div>
            </div>
          </div>

          {/* CGST/SGST/IGST Breakdown */}
          <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:16 }}>
            <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#1E293B' }}>📋 Tax Breakdown (Current Month)</h3>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'#F8FAFC' }}>
                <th style={th}>Component</th><th style={{...th, textAlign:'right'}}>Sales (₹)</th><th style={{...th, textAlign:'right'}}>Purchase (₹)</th><th style={{...th, textAlign:'right'}}>Net (₹)</th>
              </tr></thead>
              <tbody>
                {[
                  ['CGST', dashboard.currentMonth?.salesCgst, dashboard.currentMonth?.purchaseCgst],
                  ['SGST', dashboard.currentMonth?.salesSgst, dashboard.currentMonth?.purchaseSgst],
                  ['IGST', dashboard.currentMonth?.salesIgst, dashboard.currentMonth?.purchaseIgst],
                ].map(([label, sales, purchase]) => (
                  <tr key={label} style={{ borderBottom:'1px solid #F1F5F9' }}>
                    <td style={{...td, fontWeight:600}}>{label}</td>
                    <td style={{...td, textAlign:'right', color:'#6C3CE1', fontWeight:600}}>₹{fmt(sales)}</td>
                    <td style={{...td, textAlign:'right', color:'#0EA5E9', fontWeight:600}}>₹{fmt(purchase)}</td>
                    <td style={{...td, textAlign:'right', color:'#EF4444', fontWeight:700}}>₹{fmt(Number(sales||0) - Number(purchase||0))}</td>
                  </tr>
                ))}
                <tr style={{ background:'#F8FAFC', fontWeight:700 }}>
                  <td style={{...td, fontWeight:700}}>Total</td>
                  <td style={{...td, textAlign:'right', fontWeight:700, color:'#6C3CE1'}}>₹{fmt(dashboard.currentMonth?.salesGst)}</td>
                  <td style={{...td, textAlign:'right', fontWeight:700, color:'#0EA5E9'}}>₹{fmt(dashboard.currentMonth?.purchaseGst)}</td>
                  <td style={{...td, textAlign:'right', fontWeight:700, color:'#EF4444'}}>₹{fmt(dashboard.currentMonth?.netPayable)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Previous Month */}
          <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#1E293B' }}>📅 Previous Month ({dashboard.previousPeriod?.from} to {dashboard.previousPeriod?.to})</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
              <div style={summaryCard('#6C3CE1','#F5F3FF')}>
                <div style={cardLabel}>Sales GST</div>
                <div style={{ fontSize:18, fontWeight:700, color:'#6C3CE1' }}>₹{fmt(dashboard.previousMonth?.salesGst)}</div>
              </div>
              <div style={summaryCard('#0EA5E9','#F0F9FF')}>
                <div style={cardLabel}>Purchase GST</div>
                <div style={{ fontSize:18, fontWeight:700, color:'#0EA5E9' }}>₹{fmt(dashboard.previousMonth?.purchaseGst)}</div>
              </div>
              <div style={summaryCard('#EF4444','#FEF2F2')}>
                <div style={cardLabel}>Net Payable</div>
                <div style={{ fontSize:18, fontWeight:700, color:'#EF4444' }}>₹{fmt(dashboard.previousMonth?.netPayable)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== GSTR-1 ===== */}
      {tab === 'gstr1' && gstr1 && (
        <div>
          {/* Summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, marginBottom:20 }}>
            {[
              ['Total Invoices', gstr1.summary?.totalInvoices, '#6C3CE1'],
              ['B2B', gstr1.summary?.b2bCount, '#0EA5E9'],
              ['B2C', gstr1.summary?.b2cCount, '#10B981'],
              ['Total Taxable', gstr1.summary?.totalTaxable, '#F59E0B'],
              ['Total Tax', gstr1.summary?.totalTax, '#EF4444'],
            ].map(([label, val, color]) => (
              <div key={label} style={summaryCard(color, color+'10')}>
                <div style={cardLabel}>{label}</div>
                <div style={{ fontSize:18, fontWeight:700, color }}>{label.includes('Tax') ? '₹'+fmt(val) : val}</div>
              </div>
            ))}
          </div>

          {/* Sub tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {['b2b','b2c','rateWise'].map(st => (
              <button key={st} onClick={() => setSubTab(st)} style={{
                background: subTab===st ? '#6C3CE1' : '#F1F5F9', color: subTab===st ? '#fff' : '#475569',
                border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:600
              }}>{st==='b2b' ? 'B2B Invoices' : st==='b2c' ? 'B2C Invoices' : 'Rate-wise Summary'}</button>
            ))}
          </div>

          {/* B2B Table */}
          {subTab === 'b2b' && (
            <div style={tableWrap}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#F8FAFC' }}>
                  <th style={th}>Invoice #</th><th style={th}>Date</th><th style={th}>Customer</th><th style={th}>GSTIN</th>
                  <th style={{...th, textAlign:'right'}}>Taxable</th><th style={{...th, textAlign:'right'}}>CGST</th><th style={{...th, textAlign:'right'}}>SGST</th><th style={{...th, textAlign:'right'}}>IGST</th><th style={{...th, textAlign:'right'}}>Total</th><th style={th}>Type</th>
                </tr></thead>
                <tbody>
                  {gstr1.b2bInvoices?.length === 0 && <tr><td colSpan={10} style={{ textAlign:'center', padding:30, color:'#9CA3AF' }}>No B2B invoices</td></tr>}
                  {gstr1.b2bInvoices?.map((inv, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                      <td style={td}>{inv.invoiceNumber}</td>
                      <td style={td}>{inv.invoiceDate}</td>
                      <td style={{...td, fontWeight:600}}>{inv.customerName}</td>
                      <td style={{...td, fontSize:11, fontFamily:'monospace'}}>{inv.customerGstin}</td>
                      <td style={{...td, textAlign:'right'}}>₹{fmt(inv.taxableValue)}</td>
                      <td style={{...td, textAlign:'right', color:'#6C3CE1'}}>₹{fmt(inv.cgst)}</td>
                      <td style={{...td, textAlign:'right', color:'#0EA5E9'}}>₹{fmt(inv.sgst)}</td>
                      <td style={{...td, textAlign:'right', color:'#F59E0B'}}>₹{fmt(inv.igst)}</td>
                      <td style={{...td, textAlign:'right', fontWeight:700}}>₹{fmt(inv.totalAmount)}</td>
                      <td style={td}><span style={{ background: inv.invoiceType==='Inter-State' ? '#FEF3C7' : '#D1FAE5', color: inv.invoiceType==='Inter-State' ? '#D97706' : '#059669', padding:'2px 6px', borderRadius:4, fontSize:10, fontWeight:600 }}>{inv.invoiceType}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* B2C Table */}
          {subTab === 'b2c' && (
            <div style={tableWrap}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#F8FAFC' }}>
                  <th style={th}>Invoice #</th><th style={th}>Date</th><th style={th}>Customer</th>
                  <th style={{...th, textAlign:'right'}}>Taxable</th><th style={{...th, textAlign:'right'}}>CGST</th><th style={{...th, textAlign:'right'}}>SGST</th><th style={{...th, textAlign:'right'}}>IGST</th><th style={{...th, textAlign:'right'}}>Total</th>
                </tr></thead>
                <tbody>
                  {gstr1.b2cInvoices?.length === 0 && <tr><td colSpan={8} style={{ textAlign:'center', padding:30, color:'#9CA3AF' }}>No B2C invoices</td></tr>}
                  {gstr1.b2cInvoices?.map((inv, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                      <td style={td}>{inv.invoiceNumber}</td>
                      <td style={td}>{inv.invoiceDate}</td>
                      <td style={{...td, fontWeight:600}}>{inv.customerName}</td>
                      <td style={{...td, textAlign:'right'}}>₹{fmt(inv.taxableValue)}</td>
                      <td style={{...td, textAlign:'right', color:'#6C3CE1'}}>₹{fmt(inv.cgst)}</td>
                      <td style={{...td, textAlign:'right', color:'#0EA5E9'}}>₹{fmt(inv.sgst)}</td>
                      <td style={{...td, textAlign:'right', color:'#F59E0B'}}>₹{fmt(inv.igst)}</td>
                      <td style={{...td, textAlign:'right', fontWeight:700}}>₹{fmt(inv.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rate-wise Summary */}
          {subTab === 'rateWise' && (
            <div style={tableWrap}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#F8FAFC' }}>
                  <th style={th}>GST Rate</th><th style={{...th, textAlign:'right'}}>Taxable Value</th><th style={{...th, textAlign:'right'}}>CGST</th><th style={{...th, textAlign:'right'}}>SGST</th><th style={{...th, textAlign:'right'}}>Total Tax</th>
                </tr></thead>
                <tbody>
                  {gstr1.rateWiseSummary?.map((r, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                      <td style={{...td, fontWeight:700}}>{fmtPct(r.gstRate)}</td>
                      <td style={{...td, textAlign:'right'}}>₹{fmt(r.taxableValue)}</td>
                      <td style={{...td, textAlign:'right', color:'#6C3CE1'}}>₹{fmt(r.cgst)}</td>
                      <td style={{...td, textAlign:'right', color:'#0EA5E9'}}>₹{fmt(r.sgst)}</td>
                      <td style={{...td, textAlign:'right', fontWeight:700, color:'#EF4444'}}>₹{fmt(r.totalTax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== GSTR-3B ===== */}
      {tab === 'gstr3b' && gstr3b && (
        <div>
          {/* Table 3.1 - Outward Supplies */}
          <div style={tableCard}>
            <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:700 }}>📤 Table 3.1 - Outward Supplies & ITC</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div style={{ background:'#F5F3FF', borderRadius:12, padding:16 }}>
                <div style={{ fontWeight:700, color:'#6C3CE1', marginBottom:8 }}>Sales (Outward)</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13 }}>
                  <div>Taxable: <strong>₹{fmt(gstr3b.outwardSupplies?.taxableValue)}</strong></div>
                  <div>CGST: <strong>₹{fmt(gstr3b.outwardSupplies?.cgst)}</strong></div>
                  <div>SGST: <strong>₹{fmt(gstr3b.outwardSupplies?.sgst)}</strong></div>
                  <div>IGST: <strong>₹{fmt(gstr3b.outwardSupplies?.igst)}</strong></div>
                  <div style={{ gridColumn:'span 2', borderTop:'1px solid #E9D5FF', paddingTop:8, marginTop:4 }}>Total Tax: <strong style={{color:'#6C3CE1'}}>₹{fmt(gstr3b.outwardSupplies?.totalTax)}</strong></div>
                </div>
              </div>
              <div style={{ background:'#F0F9FF', borderRadius:12, padding:16 }}>
                <div style={{ fontWeight:700, color:'#0EA5E9', marginBottom:8 }}>Purchases (ITC)</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13 }}>
                  <div>Taxable: <strong>₹{fmt(gstr3b.inputTaxCredit?.taxableValue)}</strong></div>
                  <div>CGST: <strong>₹{fmt(gstr3b.inputTaxCredit?.cgst)}</strong></div>
                  <div>SGST: <strong>₹{fmt(gstr3b.inputTaxCredit?.sgst)}</strong></div>
                  <div>IGST: <strong>₹{fmt(gstr3b.inputTaxCredit?.igst)}</strong></div>
                  <div style={{ gridColumn:'span 2', borderTop:'1px solid #BAE6FD', paddingTop:8, marginTop:4 }}>Total ITC: <strong style={{color:'#0EA5E9'}}>₹{fmt(gstr3b.inputTaxCredit?.totalItc)}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Net GST Payable */}
          <div style={{ background:'linear-gradient(135deg, #6C3CE1 0%, #4F46E5 100%)', borderRadius:14, padding:24, color:'#fff', marginBottom:16 }}>
            <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700 }}>💰 Net GST Payable</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
              {[
                ['CGST', gstr3b.netGstPayable?.cgst],
                ['SGST', gstr3b.netGstPayable?.sgst],
                ['IGST', gstr3b.netGstPayable?.igst],
                ['Total', gstr3b.netGstPayable?.totalPayable],
              ].map(([label, val]) => (
                <div key={label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:12, opacity:0.8, marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize: label==='Total' ? 24 : 18, fontWeight:700 }}>₹{fmt(val)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Exempt Supplies */}
          <div style={tableCard}>
            <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:700 }}>📋 Exempt / Nil-Rated Supplies</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
              <div style={summaryCard('#10B981','#F0FDF4')}>
                <div style={cardLabel}>Nil-Rated</div>
                <div style={{ fontSize:18, fontWeight:700, color:'#10B981' }}>₹{fmt(gstr3b.exemptSupplies?.nilRated)}</div>
              </div>
              <div style={summaryCard('#F59E0B','#FFFBEB')}>
                <div style={cardLabel}>Exempt</div>
                <div style={{ fontSize:18, fontWeight:700, color:'#F59E0B' }}>₹{fmt(gstr3b.exemptSupplies?.exempt)}</div>
              </div>
              <div style={summaryCard('#6B7280','#F9FAFB')}>
                <div style={cardLabel}>Non-GST</div>
                <div style={{ fontSize:18, fontWeight:700, color:'#6B7280' }}>₹{fmt(gstr3b.exemptSupplies?.nonGst)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HSN SUMMARY ===== */}
      {tab === 'hsn' && hsnData && (
        <div style={tableWrap}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', fontWeight:700, fontSize:15, color:'#1E293B', background:'#fff', borderRadius:'14px 14px 0 0' }}>
            🏷️ HSN/SAC Summary ({hsnData.totalHsnCodes} codes)
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'#F8FAFC' }}>
              <th style={th}>HSN Code</th><th style={th}>Description</th><th style={th}>UOM</th>
              <th style={{...th, textAlign:'right'}}>Qty</th><th style={{...th, textAlign:'right'}}>Taxable Value</th><th style={{...th, textAlign:'right'}}>CGST</th><th style={{...th, textAlign:'right'}}>SGST</th><th style={{...th, textAlign:'right'}}>Total Tax</th><th style={th}>Tax Rate</th>
            </tr></thead>
            <tbody>
              {hsnData.hsnSummary?.length === 0 && <tr><td colSpan={9} style={{ textAlign:'center', padding:30, color:'#9CA3AF' }}>No HSN data</td></tr>}
              {hsnData.hsnSummary?.map((h, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                  <td style={{...td, fontWeight:700, fontFamily:'monospace'}}>{h.hsnCode}</td>
                  <td style={td}>{h.description}</td>
                  <td style={td}>{h.uom}</td>
                  <td style={{...td, textAlign:'right'}}>{h.totalQuantity}</td>
                  <td style={{...td, textAlign:'right'}}>₹{fmt(h.totalTaxable)}</td>
                  <td style={{...td, textAlign:'right', color:'#6C3CE1'}}>₹{fmt(h.totalCgst)}</td>
                  <td style={{...td, textAlign:'right', color:'#0EA5E9'}}>₹{fmt(h.totalSgst)}</td>
                  <td style={{...td, textAlign:'right', fontWeight:700, color:'#EF4444'}}>₹{fmt(h.totalTax)}</td>
                  <td style={td}><span style={{ background:'#EDE9FE', color:'#6C3CE1', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{fmtPct(h.taxRate)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== PURCHASE REGISTER ===== */}
      {tab === 'purchase' && purchaseReg && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:20 }}>
            {[
              ['Total Purchases', purchaseReg.summary?.totalPurchases, '#0EA5E9'],
              ['Taxable Value', purchaseReg.summary?.totalTaxable, '#6C3CE1'],
              ['Total ITC', purchaseReg.summary?.totalItcAvailable, '#10B981'],
              ['Total Tax', purchaseReg.summary?.totalTax, '#EF4444'],
            ].map(([label, val, color]) => (
              <div key={label} style={summaryCard(color, color+'10')}>
                <div style={cardLabel}>{label}</div>
                <div style={{ fontSize:18, fontWeight:700, color }}>{label.includes('Total') && !label.includes('Value') ? val : '₹'+fmt(val)}</div>
              </div>
            ))}
          </div>
          <div style={tableWrap}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'#F8FAFC' }}>
                <th style={th}>Purchase #</th><th style={th}>Date</th><th style={th}>Vendor</th><th style={th}>GSTIN</th>
                <th style={{...th, textAlign:'right'}}>Taxable</th><th style={{...th, textAlign:'right'}}>CGST</th><th style={{...th, textAlign:'right'}}>SGST</th><th style={{...th, textAlign:'right'}}>IGST</th><th style={{...th, textAlign:'right'}}>Total</th><th style={th}>ITC</th>
              </tr></thead>
              <tbody>
                {purchaseReg.purchases?.length === 0 && <tr><td colSpan={10} style={{ textAlign:'center', padding:30, color:'#9CA3AF' }}>No GST purchases</td></tr>}
                {purchaseReg.purchases?.map((p, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                    <td style={td}>{p.purchaseNumber}</td>
                    <td style={td}>{p.purchaseDate}</td>
                    <td style={{...td, fontWeight:600}}>{p.vendorName}</td>
                    <td style={{...td, fontSize:11, fontFamily:'monospace'}}>{p.vendorGstin}</td>
                    <td style={{...td, textAlign:'right'}}>₹{fmt(p.taxableValue)}</td>
                    <td style={{...td, textAlign:'right', color:'#6C3CE1'}}>₹{fmt(p.cgst)}</td>
                    <td style={{...td, textAlign:'right', color:'#0EA5E9'}}>₹{fmt(p.sgst)}</td>
                    <td style={{...td, textAlign:'right', color:'#F59E0B'}}>₹{fmt(p.igst)}</td>
                    <td style={{...td, textAlign:'right', fontWeight:700}}>₹{fmt(p.totalAmount)}</td>
                    <td style={td}>{p.itcEligible ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MONTHLY COMPARISON ===== */}
      {tab === 'monthly' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <label style={{ fontWeight:600, color:'#475569' }}>Year:</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #E2E8F0', fontSize:14 }}>
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {monthlyData && (
            <div style={tableWrap}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#F8FAFC' }}>
                  <th style={th}>Month</th><th style={{...th, textAlign:'right'}}>Sales GST</th><th style={{...th, textAlign:'right'}}>Purchase GST</th><th style={{...th, textAlign:'right'}}>Net Payable</th><th style={{...th, textAlign:'right'}}>Invoices</th><th style={{...th, textAlign:'right'}}>Purchases</th>
                </tr></thead>
                <tbody>
                  {monthlyData.map((m, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                      <td style={{...td, fontWeight:700}}>{m.month} {m.year}</td>
                      <td style={{...td, textAlign:'right', color:'#6C3CE1', fontWeight:600}}>₹{fmt(m.salesGst)}</td>
                      <td style={{...td, textAlign:'right', color:'#0EA5E9', fontWeight:600}}>₹{fmt(m.purchaseGst)}</td>
                      <td style={{...td, textAlign:'right', fontWeight:700, color: Number(m.netPayable)>=0 ? '#EF4444' : '#10B981' }}>₹{fmt(m.netPayable)}</td>
                      <td style={{...td, textAlign:'right'}}>{m.invoiceCount}</td>
                      <td style={{...td, textAlign:'right'}}>{m.purchaseCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== STYLES =====
const th = { padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'2px solid #E2E8F0' };
const td = { padding:'10px 14px', fontSize:13, color:'#1E293B' };
const cardLabel = { fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 };
const summaryCard = (color, bg) => ({ background:bg, borderRadius:12, padding:16, border:`1px solid ${color}20` });
const tableCard = { background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:16 };
const tableWrap = { background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' };
const dateInput = { padding:'6px 12px', borderRadius:8, border:'1px solid #E2E8F0', fontSize:13 };
const applyBtn = { background:'#6C3CE1', color:'#fff', border:'none', borderRadius:8, padding:'6px 16px', cursor:'pointer', fontSize:13, fontWeight:600 };
