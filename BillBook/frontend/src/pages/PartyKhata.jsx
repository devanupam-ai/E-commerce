
import { useEffect, useState } from 'react';
import { khataAPI } from '../api';
import api from '../api';

export default function PartyKhata() {
  const [overview, setOverview] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [partyData, setPartyData] = useState(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showSettleForm, setShowSettleForm] = useState(false);
  const [settleEntryId, setSettleEntryId] = useState(null);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [entryForm, setEntryForm] = useState({
    partyId: '', entryType: 'CREDIT_GIVEN', amount: '', description: '',
    entryDate: new Date().toISOString().split('T')[0], dueDate: '', interestRate: ''
  });
  const [settleForm, setSettleForm] = useState({
    khataEntryId: '', amount: '', settlementDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH', referenceNumber: '', notes: ''
  });

  const loadOverview = async () => {
    try { const r = await khataAPI.overview(); setOverview(r.data); } catch {}
  };
  const loadCustomers = async () => {
    try { const r = await api.get('/customers'); setCustomers(r.data); } catch {}
  };
  const loadPartyKhata = async (partyId) => {
    try { const r = await khataAPI.partyKhata(partyId); setPartyData(r.data); } catch {}
  };

  useEffect(() => { loadOverview(); loadCustomers(); }, []);

  const openParty = (party) => {
    setSelectedParty(party);
    loadPartyKhata(party.partyId || party.id);
  };

  const addEntry = async (e) => {
    e.preventDefault();
    try {
      await khataAPI.addEntry(entryForm);
      setShowEntryForm(false);
      setEntryForm({ partyId: '', entryType: 'CREDIT_GIVEN', amount: '', description: '', entryDate: new Date().toISOString().split('T')[0], dueDate: '', interestRate: '' });
      loadOverview();
      if (selectedParty) loadPartyKhata(selectedParty.partyId || selectedParty.id);
    } catch { alert('Failed to add entry'); }
  };

  const settleEntry = async (e) => {
    e.preventDefault();
    try {
      await khataAPI.settle({ ...settleForm, khataEntryId: settleEntryId });
      setShowSettleForm(false);
      if (selectedParty) loadPartyKhata(selectedParty.partyId || selectedParty.id);
      loadOverview();
    } catch { alert('Failed to settle'); }
  };

  const calculateInterest = async (partyId, rate) => {
    try {
      const r = await khataAPI.calculateInterest({ partyId, interestRate: rate || 18 });
      alert(`Interest calculated: Rs. ${r.data.interestCalculated} on ${r.data.entriesProcessed} entries`);
      setShowInterestForm(false);
      if (selectedParty) loadPartyKhata(selectedParty.partyId || selectedParty.id);
      loadOverview();
    } catch { alert('Failed to calculate interest'); }
  };

  const sendReminder = async (partyId) => {
    try {
      const r = await khataAPI.sendReminder(partyId);
      if (r.data.whatsappLink) window.open(r.data.whatsappLink, '_blank');
      else alert('No phone number available');
    } catch { alert('Failed to send reminder'); }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const today = new Date().toISOString().split('T')[0];

  // ====== PARTY DETAIL VIEW ======
  if (partyData) {
    const p = partyData.party;
    const ledger = partyData.ledger || [];
    const settlements = partyData.settlements || [];

    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={() => { setPartyData(null); setSelectedParty(null); loadOverview(); }} style={backBtn}>← Back</button>
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1E293B' }}>{p.name}</h2>
            <span style={{ fontSize:12, color:'#6B7280' }}>{p.phone}{p.gstin ? ` | GSTIN: ${p.gstin}` : ''}</span>
          </div>
          <button onClick={() => sendReminder(p.id)} style={{ background:'#25D366', color:'#fff', border:'none', borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:600 }}>💬 WhatsApp</button>
          <button onClick={() => setShowInterestForm(true)} style={{ background:'#F59E0B', color:'#fff', border:'none', borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:600 }}>📊 Interest</button>
          <button onClick={() => { setEntryForm({...entryForm, partyId: p.id}); setShowEntryForm(true); }} style={addBtn}>+ Add Entry</button>
        </div>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:20 }}>
          <div style={card('#6C3CE1','#F5F3FF')}>
            <div style={cardLabel}>Outstanding</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#6C3CE1', marginTop:4 }}>₹{fmt(partyData.outstanding)}</div>
          </div>
          <div style={card('#EF4444','#FEF2F2')}>
            <div style={cardLabel}>Overdue</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#EF4444', marginTop:4 }}>₹{fmt(partyData.overdueAmount)} <span style={{fontSize:12}}>({partyData.overdueCount})</span></div>
          </div>
          <div style={card('#F59E0B','#FFFBEB')}>
            <div style={cardLabel}>Pending Interest</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#F59E0B', marginTop:4 }}>₹{fmt(partyData.pendingInterest)}</div>
          </div>
          <div style={card('#10B981','#F0FDF4')}>
            <div style={cardLabel}>Total (incl. Interest)</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#10B981', marginTop:4 }}>₹{fmt(partyData.totalOutstandingWithInterest)}</div>
          </div>
        </div>

        {/* Ledger Table */}
        <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', fontWeight:700, fontSize:15, color:'#1E293B' }}>📒 Party Ledger</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                <th style={th}>Date</th>
                <th style={th}>Particular</th>
                <th style={th}>Type</th>
                <th style={{...th, textAlign:'right'}}>Debit (₹)</th>
                <th style={{...th, textAlign:'right'}}>Credit (₹)</th>
                <th style={{...th, textAlign:'right'}}>Balance (₹)</th>
                <th style={th}>Status</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 && <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>No transactions yet</td></tr>}
              {ledger.map((t, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                  <td style={td}>{t.date}</td>
                  <td style={td}><strong>{t.particular}</strong></td>
                  <td style={td}>
                    <span style={{ background: typeColor(t.type), color:'#fff', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{t.type}</span>
                  </td>
                  <td style={{...td, textAlign:'right', color: Number(t.debit)>0 ? '#EF4444' : '#CBD5E1', fontWeight:600 }}>{Number(t.debit)>0 ? fmt(t.debit) : '—'}</td>
                  <td style={{...td, textAlign:'right', color: Number(t.credit)>0 ? '#10B981' : '#CBD5E1', fontWeight:600 }}>{Number(t.credit)>0 ? fmt(t.credit) : '—'}</td>
                  <td style={{...td, textAlign:'right', fontWeight:700, color: Number(t.balance)>=0 ? '#6C3CE1' : '#10B981' }}>{fmt(t.balance)}</td>
                  <td style={td}>
                    <span style={{ background: statusBg(t.status), color: statusColor(t.status), padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{t.status}</span>
                  </td>
                  <td style={td}>
                    {t.status !== 'SETTLED' && Number(t.debit) > 0 && (
                      <button onClick={() => { setSettleEntryId(t.id); setSettleForm({...settleForm, amount: t.debit}); setShowSettleForm(true); }} style={{ background:'#10B981', color:'#fff', border:'none', borderRadius:6, padding:'3px 10px', cursor:'pointer', fontSize:11, fontWeight:600 }}>Pay</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Settlements History */}
        {settlements.length > 0 && (
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', fontWeight:700, fontSize:15, color:'#1E293B' }}>💰 Payment History</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'#F8FAFC' }}>
                <th style={th}>Date</th><th style={th}>Amount</th><th style={th}>Mode</th><th style={th}>Reference</th><th style={th}>Notes</th>
              </tr></thead>
              <tbody>
                {settlements.map((s, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                    <td style={td}>{s.settlementDate}</td>
                    <td style={{...td, fontWeight:700, color:'#10B981'}}>₹{fmt(s.amount)}</td>
                    <td style={td}>{s.paymentMode}</td>
                    <td style={td}>{s.referenceNumber || '—'}</td>
                    <td style={td}>{s.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Entry Modal */}
        {showEntryForm && (
          <Modal onClose={() => setShowEntryForm(false)} title="Add Khata Entry">
            <form onSubmit={addEntry}>
              <Select label="Party" value={entryForm.partyId} onChange={v => setEntryForm({...entryForm, partyId: v})} options={customers.map(c => ({ value: c.id, label: c.name }))} />
              <Select label="Entry Type" value={entryForm.entryType} onChange={v => setEntryForm({...entryForm, entryType: v})} options={[
                { value:'CREDIT_GIVEN', label:'Credit Given (Udhaar diya)' },
                { value:'CREDIT_RECEIVED', label:'Credit Received (Udhaar liya)' },
                { value:'PAYMENT_RECEIVED', label:'Payment Received' },
                { value:'PAYMENT_MADE', label:'Payment Made' },
              ]} />
              <Input label="Amount (₹)" value={entryForm.amount} onChange={v => setEntryForm({...entryForm, amount: v})} type="number" required />
              <Input label="Description" value={entryForm.description} onChange={v => setEntryForm({...entryForm, description: v})} />
              <Input label="Entry Date" value={entryForm.entryDate} onChange={v => setEntryForm({...entryForm, entryDate: v})} type="date" />
              <Input label="Due Date" value={entryForm.dueDate} onChange={v => setEntryForm({...entryForm, dueDate: v})} type="date" />
              <Input label="Interest Rate (% annual)" value={entryForm.interestRate} onChange={v => setEntryForm({...entryForm, interestRate: v})} type="number" />
              <button type="submit" style={submitBtn}>Add Entry</button>
            </form>
          </Modal>
        )}

        {/* Settle Modal */}
        {showSettleForm && (
          <Modal onClose={() => setShowSettleForm(false)} title="Record Payment">
            <form onSubmit={settleEntry}>
              <Input label="Amount (₹)" value={settleForm.amount} onChange={v => setSettleForm({...settleForm, amount: v})} type="number" required />
              <Input label="Payment Date" value={settleForm.settlementDate} onChange={v => setSettleForm({...settleForm, settlementDate: v})} type="date" />
              <Select label="Payment Mode" value={settleForm.paymentMode} onChange={v => setSettleForm({...settleForm, paymentMode: v})} options={[
                { value:'CASH', label:'Cash' }, { value:'UPI', label:'UPI' }, { value:'CARD', label:'Card' },
                { value:'BANK_TRANSFER', label:'Bank Transfer' }, { value:'CHEQUE', label:'Cheque' },
              ]} />
              <Input label="Reference Number" value={settleForm.referenceNumber} onChange={v => setSettleForm({...settleForm, referenceNumber: v})} />
              <Input label="Notes" value={settleForm.notes} onChange={v => setSettleForm({...settleForm, notes: v})} />
              <button type="submit" style={submitBtn}>Record Payment</button>
            </form>
          </Modal>
        )}

        {/* Interest Modal */}
        {showInterestForm && (
          <Modal onClose={() => setShowInterestForm(false)} title="Calculate Interest on Overdue">
            <div style={{ marginBottom:16, color:'#6B7280', fontSize:14 }}>
              This will calculate interest on all overdue entries for this party at the specified annual rate.
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <Input label="Annual Interest Rate (%)" value="18" onChange={v => {}} type="number" style={{ flex:1 }} />
              <button onClick={() => calculateInterest(p.id, 18)} style={{...submitBtn, marginTop:22}}>Calculate & Apply</button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ====== MAIN OVERVIEW ======
  const parties = overview?.parties || [];
  const filtered = parties.filter(p => {
    const matchSearch = !search || p.partyName?.toLowerCase().includes(search.toLowerCase()) || p.partyPhone?.includes(search);
    const matchType = filterType === 'ALL' || (filterType === 'RECEIVABLE' && Number(p.balance) > 0) || (filterType === 'PAYABLE' && Number(p.balance) < 0);
    return matchSearch && matchType;
  });

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1E293B' }}>📒 Party Khata (Udhaar Book)</h2>
        <button onClick={() => { setEntryForm({...entryForm, partyId: customers[0]?.id || ''}); setShowEntryForm(true); }} style={addBtn}>+ Add Entry</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:20 }}>
        <div style={card('#6C3CE1','#F5F3FF')}>
          <div style={cardLabel}>Total Udhaar Given</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#6C3CE1', marginTop:4 }}>₹{fmt(overview?.totalUdhaarGiven)}</div>
        </div>
        <div style={card('#EF4444','#FEF2F2')}>
          <div style={cardLabel}>Total Overdue</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#EF4444', marginTop:4 }}>₹{fmt(overview?.totalOverdue)} <span style={{fontSize:12}}>({overview?.overdueCount || 0})</span></div>
        </div>
        <div style={card('#10B981','#F0FDF4')}>
          <div style={cardLabel}>Net Receivable</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#10B981', marginTop:4 }}>₹{fmt(overview?.netReceivable)}</div>
        </div>
        <div style={card('#F59E0B','#FFFBEB')}>
          <div style={cardLabel}>Net Payable</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#F59E0B', marginTop:4 }}>₹{fmt(overview?.netPayable)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <input placeholder="🔍 Search party..." value={search} onChange={e => setSearch(e.target.value)} style={searchStyle} />
        {['ALL','RECEIVABLE','PAYABLE'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            background: filterType===t ? '#6C3CE1' : '#F1F5F9', color: filterType===t ? '#fff' : '#475569',
            border:'none', borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:600
          }}>{t}</button>
        ))}
      </div>

      {/* Party List */}
      <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#F8FAFC' }}>
            <th style={th}>Party Name</th><th style={th}>Phone</th><th style={th}>Type</th>
            <th style={{...th, textAlign:'right'}}>Balance (₹)</th><th style={th}>Status</th><th style={th}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>No parties found</td></tr>}
            {filtered.map((p, i) => (
              <tr key={i} onClick={() => openParty(p)} style={{ borderBottom:'1px solid #F1F5F9', cursor:'pointer', transition:'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={td}><strong>{p.partyName}</strong></td>
                <td style={td}>{p.partyPhone || '—'}</td>
                <td style={td}><span style={{ background: p.partyType==='VENDOR' ? '#FEF3C7' : '#EDE9FE', color: p.partyType==='VENDOR' ? '#D97706' : '#6C3CE1', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{p.partyType}</span></td>
                <td style={{...td, textAlign:'right', fontWeight:700, color: Number(p.balance)>=0 ? '#EF4444' : '#10B981' }}>₹{fmt(Math.abs(p.balance))} {Number(p.balance)>=0 ? '⬆ Dr' : '⬇ Cr'}</td>
                <td style={td}><span style={{ background: Number(p.balance)>0 ? '#FEE2E2' : '#D1FAE5', color: Number(p.balance)>0 ? '#DC2626' : '#059669', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{Number(p.balance)>0 ? 'Receivable' : 'Payable'}</span></td>
                <td style={td}>
                  <button onClick={(e) => { e.stopPropagation(); sendReminder(p.partyId); }} style={{ background:'#25D366', color:'#fff', border:'none', borderRadius:6, padding:'3px 10px', cursor:'pointer', fontSize:11, fontWeight:600 }}>💬</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Entry Modal */}
      {showEntryForm && (
        <Modal onClose={() => setShowEntryForm(false)} title="Add Khata Entry">
          <form onSubmit={addEntry}>
            <Select label="Party" value={entryForm.partyId} onChange={v => setEntryForm({...entryForm, partyId: v})} options={customers.map(c => ({ value: c.id, label: c.name }))} />
            <Select label="Entry Type" value={entryForm.entryType} onChange={v => setEntryForm({...entryForm, entryType: v})} options={[
              { value:'CREDIT_GIVEN', label:'Credit Given (Udhaar diya)' },
              { value:'CREDIT_RECEIVED', label:'Credit Received (Udhaar liya)' },
              { value:'PAYMENT_RECEIVED', label:'Payment Received' },
              { value:'PAYMENT_MADE', label:'Payment Made' },
            ]} />
            <Input label="Amount (₹)" value={entryForm.amount} onChange={v => setEntryForm({...entryForm, amount: v})} type="number" required />
            <Input label="Description" value={entryForm.description} onChange={v => setEntryForm({...entryForm, description: v})} />
            <Input label="Entry Date" value={entryForm.entryDate} onChange={v => setEntryForm({...entryForm, entryDate: v})} type="date" />
            <Input label="Due Date" value={entryForm.dueDate} onChange={v => setEntryForm({...entryForm, dueDate: v})} type="date" />
            <Input label="Interest Rate (% annual)" value={entryForm.interestRate} onChange={v => setEntryForm({...entryForm, interestRate: v})} type="number" />
            <button type="submit" style={submitBtn}>Add Entry</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ====== REUSABLE COMPONENTS ======
function Modal({ onClose, title, children }) {
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, padding:24, width:500, maxHeight:'90vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:'#1E293B' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'#F1F5F9', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:600 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type='text', required, style:customStyle }) {
  return (
    <div style={{ marginBottom:12, ...customStyle }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        style={{ width:'100%', padding:'8px 12px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'8px 12px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:14, background:'#fff', boxSizing:'border-box' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ====== HELPERS ======
const typeColor = (type) => {
  const map = { CREDIT_GIVEN:'#6C3CE1', PAYMENT_RECEIVED:'#10B981', PAYMENT_MADE:'#0EA5E9', INTEREST:'#F59E0B', CREDIT_RECEIVED:'#0EA5E9', DEBIT_GIVEN:'#EF4444', DEBIT_RECEIVED:'#6C3CE1' };
  return map[type] || '#6B7280';
};
const statusBg = (s) => ({ PENDING:'#FEF3C7', PARTIAL:'#DBEAFE', SETTLED:'#D1FAE5', OVERDUE:'#FEE2E2' }[s] || '#F1F5F9');
const statusColor = (s) => ({ PENDING:'#D97706', PARTIAL:'#2563EB', SETTLED:'#059669', OVERDUE:'#DC2626' }[s] || '#6B7280');

const th = { padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:0.5 };
const td = { padding:'10px 14px', fontSize:13, color:'#1E293B' };
const cardLabel = { fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 };
const card = (color, bg) => ({ background:bg, borderRadius:14, padding:16, border:`1px solid ${color}20` });
const backBtn = { background:'#F1F5F9', border:'none', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontSize:14, fontWeight:600, color:'#475569' };
const addBtn = { background:'#6C3CE1', color:'#fff', border:'none', borderRadius:10, padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:600 };
const submitBtn = { width:'100%', background:'#6C3CE1', color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer', fontSize:14, fontWeight:600, marginTop:8 };
const searchStyle = { padding:'8px 14px', border:'1px solid #E2E8F0', borderRadius:10, fontSize:14, flex:1, outline:'none' };
