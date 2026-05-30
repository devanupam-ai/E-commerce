
import { useEffect, useState } from 'react';
import api from '../api';
import { WaButton, useWhatsAppModal } from '../components/WhatsAppButton';
import { whatsappAPI } from '../api';

const empty = { name:'', email:'', phone:'', address:'', city:'', state:'', pincode:'', gstin:'', type:'CUSTOMER', openingBalance:0 };

export default function Customers() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLedger, setCustomerLedger] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [tab, setTab] = useState('ledger');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount:'', paymentDate: new Date().toISOString().split('T')[0], paymentMode:'CASH', referenceNumber:'', notes:'' });
  const { openWaModal, WaModalComponent } = useWhatsAppModal();

  const load = () => api.get('/customers').then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const save = async e => {
    e.preventDefault();
    if (editing) await api.put(`/customers/${editing}`, form);
    else await api.post('/customers', form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const del = async id => { if (confirm('Delete this customer?')) { await api.delete(`/customers/${id}`); load(); } };

  const edit = c => { setForm({...c}); setEditing(c.id); setShowForm(true); };

  const openCustomer = async (c) => {
    setSelectedCustomer(c);
    setTab('ledger');
    // Load ledger
    try {
      const ledgerRes = await api.get(`/reports/party-ledger?type=customer&partyId=${c.id}`);
      setCustomerLedger(ledgerRes.data);
    } catch { setCustomerLedger(null); }
    // Load invoices
    try {
      const invRes = await api.get(`/invoices?customerId=${c.id}`);
      setCustomerInvoices(invRes.data);
    } catch { setCustomerInvoices([]); }
    // Load payments
    try {
      const payRes = await api.get(`/payments?customerId=${c.id}`);
      setCustomerPayments(payRes.data);
    } catch { setCustomerPayments([]); }
  };

  const recordPayment = async e => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        ...paymentForm,
        customerId: selectedCustomer.id,
        type: 'RECEIVED'
      });
      setShowPaymentForm(false);
      setPaymentForm({ amount:'', paymentDate: new Date().toISOString().split('T')[0], paymentMode:'CASH', referenceNumber:'', notes:'' });
      openCustomer(selectedCustomer);
    } catch(err) { alert('Failed to record payment'); }
  };

  // Filtered list
  const filtered = list.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || c.type === filterType;
    return matchSearch && matchType;
  });

  // Stats
  const totalCustomers = list.filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH').length;
  const totalVendors = list.filter(c => c.type === 'VENDOR' || c.type === 'BOTH').length;

  // Customer Detail View
  if (selectedCustomer) {
    const c = selectedCustomer;
    const transactions = customerLedger?.transactions || [];
    const closingBalance = customerLedger?.closingBalance || 0;

    return (
      <div>
        {/* Back Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={() => setSelectedCustomer(null)} style={{ background:'#F1F5F9', border:'none', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontSize:14, fontWeight:600, color:'#475569' }}>← Back</button>
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1E293B' }}>{c.name}</h2>
            <span style={{ fontSize:12, color:'#6B7280' }}>{c.phone}{c.email ? ` • ${c.email}` : ''}</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <WaButton size="sm" onClick={() => openWaModal(() => whatsappAPI.sendReminder(c.id), 'Payment Reminder')}>Reminder</WaButton>
            <WaButton size="sm" onClick={() => openWaModal(() => whatsappAPI.sendOverdue(c.id), 'Overdue Notice')} style={{ background:'#DC2626' }}>Overdue</WaButton>
            <button onClick={() => edit(c)} style={{ background:'#6C3CE1', color:'#fff', border:'none', borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:600 }}>✏️ Edit</button>
          </div>
        </div>

        {/* Customer Info Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:20 }}>
          <div style={{ background:'#F5F3FF', borderRadius:14, padding:16, border:'1px solid #6C3CE120' }}>
            <div style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Outstanding</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#6C3CE1', marginTop:4 }}>₹{Number(closingBalance).toLocaleString()}</div>
          </div>
          <div style={{ background:'#F0FDF4', borderRadius:14, padding:16, border:'1px solid #10B98120' }}>
            <div style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Total Invoices</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#10B981', marginTop:4 }}>{customerInvoices.length}</div>
          </div>
          <div style={{ background:'#F0F9FF', borderRadius:14, padding:16, border:'1px solid #0EA5E920' }}>
            <div style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Payments Received</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#0EA5E9', marginTop:4 }}>{customerPayments.length}</div>
          </div>
          <div style={{ background:'#FFFBEB', borderRadius:14, padding:16, border:'1px solid #F59E0B20' }}>
            <div style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Type</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#F59E0B', marginTop:8 }}>
              <span style={{ background:'#FEF3C7', padding:'3px 10px', borderRadius:8, fontSize:12 }}>{c.type}</span>
            </div>
          </div>
        </div>

        {/* Customer Details Card */}
        <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontWeight:700, fontSize:15, color:'#1E293B' }}>📋 Customer Details</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            {[
              ['📞 Phone', c.phone],
              ['📧 Email', c.email],
              ['📍 City', c.city],
              ['🏛️ State', c.state],
              ['📮 Pincode', c.pincode],
              ['🏷️ GSTIN', c.gstin],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:600 }}>{label}</div>
                <div style={{ fontSize:14, color:'#1E293B', fontWeight:500, marginTop:2 }}>{val || '—'}</div>
              </div>
            ))}
          </div>
          {c.address && <div style={{ marginTop:12 }}><div style={{ fontSize:11, color:'#9CA3AF', fontWeight:600 }}>🏠 Address</div><div style={{ fontSize:14, color:'#1E293B', fontWeight:500, marginTop:2 }}>{c.address}</div></div>}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {['ledger','invoices','payments'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab===t ? '#6C3CE1' : '#F1F5F9', color: tab===t ? '#fff' : '#475569',
              border:'none', borderRadius:10, padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s'
            }}>
              {t==='ledger' ? '📒 Ledger' : t==='invoices' ? '🧾 Invoices' : '💰 Payments'}
            </button>
          ))}
          <button onClick={() => setShowPaymentForm(true)} style={{
            background:'#10B981', color:'#fff', border:'none', borderRadius:10, padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:600, marginLeft:'auto'
          }}>+ Record Payment</button>
        </div>

        {/* Ledger Tab */}
        {tab === 'ledger' && (
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
                {transactions.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>No transactions yet</td></tr>
                )}
                {transactions.map((t, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                    <td style={tdStyle}>{t.date}</td>
                    <td style={tdStyle}><strong>{t.particular}</strong></td>
                    <td style={tdStyle}>
                      <span style={{ background: t.type==='SALE' ? '#EDE9FE' : t.type==='PAYMENT' ? '#D1FAE5' : '#FEF3C7', color: t.type==='SALE' ? '#6C3CE1' : t.type==='PAYMENT' ? '#059669' : '#D97706', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{t.type}</span>
                    </td>
                    <td style={{...tdStyle, textAlign:'right', color: Number(t.debit)>0 ? '#EF4444' : '#9CA3AF' }}>{Number(t.debit)>0 ? Number(t.debit).toLocaleString() : '—'}</td>
                    <td style={{...tdStyle, textAlign:'right', color: Number(t.credit)>0 ? '#10B981' : '#9CA3AF' }}>{Number(t.credit)>0 ? Number(t.credit).toLocaleString() : '—'}</td>
                    <td style={{...tdStyle, textAlign:'right', fontWeight:700, color: Number(t.balance)>=0 ? '#6C3CE1' : '#10B981' }}>{Number(t.balance).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invoices Tab */}
        {tab === 'invoices' && (
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={{...thStyle, textAlign:'right'}}>Amount</th>
                  <th style={{...thStyle, textAlign:'right'}}>Balance</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {customerInvoices.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>No invoices yet</td></tr>
                )}
                {customerInvoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom:'1px solid #F1F5F9' }}>
                    <td style={tdStyle}><strong>{inv.invoiceNumber}</strong></td>
                    <td style={tdStyle}>{inv.invoiceDate}</td>
                    <td style={tdStyle}>{inv.dueDate || '—'}</td>
                    <td style={{...tdStyle, textAlign:'right', fontWeight:600}}>₹{Number(inv.totalAmount).toLocaleString()}</td>
                    <td style={{...tdStyle, textAlign:'right', color: Number(inv.balanceDue)>0 ? '#EF4444' : '#10B981', fontWeight:600}}>₹{Number(inv.balanceDue).toLocaleString()}</td>
                    <td style={tdStyle}>
                      <span style={{ background: inv.paymentStatus==='PAID' ? '#D1FAE5' : inv.paymentStatus==='PARTIAL' ? '#FEF3C7' : inv.paymentStatus==='OVERDUE' ? '#FEE2E2' : '#EDE9FE', color: inv.paymentStatus==='PAID' ? '#059669' : inv.paymentStatus==='PARTIAL' ? '#D97706' : inv.paymentStatus==='OVERDUE' ? '#DC2626' : '#6C3CE1', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600 }}>{inv.paymentStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payments Tab */}
        {tab === 'payments' && (
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Mode</th>
                  <th style={thStyle}>Reference</th>
                  <th style={{...thStyle, textAlign:'right'}}>Amount</th>
                  <th style={thStyle}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {customerPayments.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>No payments yet</td></tr>
                )}
                {customerPayments.map(p => (
                  <tr key={p.id} style={{ borderBottom:'1px solid #F1F5F9' }}>
                    <td style={tdStyle}>{p.paymentDate}</td>
                    <td style={tdStyle}>
                      <span style={{ background:'#EDE9FE', color:'#6C3CE1', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{p.paymentMode}</span>
                    </td>
                    <td style={tdStyle}>{p.referenceNumber || '—'}</td>
                    <td style={{...tdStyle, textAlign:'right', fontWeight:700, color:'#10B981'}}>₹{Number(p.amount).toLocaleString()}</td>
                    <td style={tdStyle}>{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div style={modalStyle}>
            <div style={modalBoxStyle}>
              <h3 style={{ marginTop:0, fontSize:18, fontWeight:700, color:'#1E293B' }}>💰 Record Payment from {c.name}</h3>
              <form onSubmit={recordPayment}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <input style={inputStyle} placeholder="Amount (₹)" type="number" step="0.01" required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount:e.target.value})} />
                  <input style={inputStyle} type="date" required value={paymentForm.paymentDate} onChange={e => setPaymentForm({...paymentForm, paymentDate:e.target.value})} />
                  <select style={inputStyle} value={paymentForm.paymentMode} onChange={e => setPaymentForm({...paymentForm, paymentMode:e.target.value})}>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                  <input style={inputStyle} placeholder="Reference Number" value={paymentForm.referenceNumber} onChange={e => setPaymentForm({...paymentForm, referenceNumber:e.target.value})} />
                </div>
                <input style={{...inputStyle, marginTop:12 }} placeholder="Notes" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes:e.target.value})} />
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button type="submit" style={{ background:'#10B981', color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', cursor:'pointer', fontSize:14, fontWeight:600 }}>Save Payment</button>
                  <button type="button" onClick={() => setShowPaymentForm(false)} style={{ background:'#E2E8F0', color:'#475569', border:'none', borderRadius:10, padding:'10px 24px', cursor:'pointer', fontSize:14, fontWeight:600 }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
        <WaModalComponent />
      </div>
    );
  }

  // Main Customer List View
  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1E293B' }}>👥 Customers & Vendors</h2>
          <p style={{ margin:'4px 0 0', color:'#6B7280', fontSize:13 }}>Manage your business contacts</p>
        </div>
        <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }} style={btnPrimary}>+ Add Party</button>
      </div>

      {/* Stats Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:20 }}>
        <div style={{ background:'linear-gradient(135deg, #6C3CE1, #4F46E5)', borderRadius:14, padding:18, color:'#fff' }}>
          <div style={{ fontSize:12, opacity:0.8, fontWeight:600 }}>Total Parties</div>
          <div style={{ fontSize:28, fontWeight:700, marginTop:4 }}>{list.length}</div>
        </div>
        <div style={{ background:'linear-gradient(135deg, #10B981, #059669)', borderRadius:14, padding:18, color:'#fff' }}>
          <div style={{ fontSize:12, opacity:0.8, fontWeight:600 }}>Customers</div>
          <div style={{ fontSize:28, fontWeight:700, marginTop:4 }}>{totalCustomers}</div>
        </div>
        <div style={{ background:'linear-gradient(135deg, #0EA5E9, #0284C7)', borderRadius:14, padding:18, color:'#fff' }}>
          <div style={{ fontSize:12, opacity:0.8, fontWeight:600 }}>Vendors</div>
          <div style={{ fontSize:28, fontWeight:700, marginTop:4 }}>{totalVendors}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <input style={{ flex:1, padding:'10px 16px', border:'2px solid #E5E7EB', borderRadius:12, fontSize:14, outline:'none' }} placeholder="🔍 Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ padding:'10px 16px', border:'2px solid #E5E7EB', borderRadius:12, fontSize:14, fontWeight:600, outline:'none', cursor:'pointer' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="ALL">All Types</option>
          <option value="CUSTOMER">Customer</option>
          <option value="VENDOR">Vendor</option>
          <option value="BOTH">Both</option>
        </select>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={modalStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ marginTop:0, fontSize:18, fontWeight:700, color:'#1E293B' }}>{editing ? '✏️ Edit' : '➕ Add'} Party</h3>
            <form onSubmit={save}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input style={inputStyle} placeholder="Name *" required value={form.name||''} onChange={e => setForm({...form, name:e.target.value})} />
                <input style={inputStyle} placeholder="Phone" value={form.phone||''} onChange={e => setForm({...form, phone:e.target.value})} />
                <input style={inputStyle} placeholder="Email" value={form.email||''} onChange={e => setForm({...form, email:e.target.value})} />
                <input style={inputStyle} placeholder="City" value={form.city||''} onChange={e => setForm({...form, city:e.target.value})} />
                <input style={inputStyle} placeholder="State" value={form.state||''} onChange={e => setForm({...form, state:e.target.value})} />
                <input style={inputStyle} placeholder="Pincode" value={form.pincode||''} onChange={e => setForm({...form, pincode:e.target.value})} />
                <input style={inputStyle} placeholder="GSTIN" value={form.gstin||''} onChange={e => setForm({...form, gstin:e.target.value})} />
                <select style={inputStyle} value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                  <option value="CUSTOMER">Customer</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <input style={{...inputStyle, marginTop:12 }} placeholder="Address" value={form.address||''} onChange={e => setForm({...form, address:e.target.value})} />
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button type="submit" style={btnPrimary}>Save</button>
                <button type="button" onClick={() => setShowForm(false)} style={btnGray}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Cards Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
        {filtered.map(c => (
          <div key={c.id} onClick={() => openCustomer(c)} style={{ background:'#fff', borderRadius:14, padding:18, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer', transition:'all 0.2s', border:'2px solid transparent' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#6C3CE1'} onMouseLeave={e => e.currentTarget.style.borderColor='transparent'}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:42, height:42, borderRadius:12, background: c.type==='VENDOR' ? 'linear-gradient(135deg, #0EA5E9, #0284C7)' : c.type==='BOTH' ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'linear-gradient(135deg, #6C3CE1, #4F46E5)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700 }}>
                  {c.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#1E293B' }}>{c.name}</div>
                  <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{c.phone || 'No phone'} {c.city ? `• ${c.city}` : ''}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={e => { e.stopPropagation(); edit(c); }} style={{ background:'#F1F5F9', border:'none', borderRadius:8, padding:'5px 8px', cursor:'pointer', fontSize:12 }}>✏️</button>
                <button onClick={e => { e.stopPropagation(); del(c.id); }} style={{ background:'#FEF2F2', border:'none', borderRadius:8, padding:'5px 8px', cursor:'pointer', fontSize:12 }}>🗑️</button>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <span style={{ background: c.type==='VENDOR' ? '#E0F2FE' : c.type==='BOTH' ? '#F3E8FF' : '#EDE9FE', color: c.type==='VENDOR' ? '#0284C7' : c.type==='BOTH' ? '#7C3AED' : '#6C3CE1', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600 }}>{c.type}</span>
              {c.gstin && <span style={{ background:'#FEF3C7', color:'#D97706', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600 }}>GST</span>}
              {c.email && <span style={{ background:'#F0F9FF', color:'#0284C7', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600 }}>📧</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:60, color:'#9CA3AF', gridColumn:'1/-1' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
            <div style={{ fontWeight:600, fontSize:16 }}>No parties found</div>
            <div style={{ fontSize:13, marginTop:4 }}>{search ? 'Try a different search' : 'Add your first customer or vendor'}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding:'12px 16px', fontSize:12, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5, textAlign:'left' };
const tdStyle = { padding:'12px 16px', fontSize:13, color:'#374151' };
const inputStyle = { padding:'10px 14px', border:'2px solid #E5E7EB', borderRadius:10, fontSize:14, width:'100%', boxSizing:'border-box', outline:'none' };
const btnPrimary = { background:'#6C3CE1', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer', fontSize:14, fontWeight:600 };
const btnGray = { background:'#94A3B8', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer', fontSize:14, fontWeight:600 };
const modalStyle = { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(4px)' };
const modalBoxStyle = { background:'#fff', padding:24, borderRadius:16, width:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' };

