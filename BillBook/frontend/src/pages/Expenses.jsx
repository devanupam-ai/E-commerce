
import { useEffect, useState } from 'react';
import api from '../api';

const empty = { description:'', category:'OTHER', amount:'', expenseDate: new Date().toISOString().split('T')[0], paymentMode:'CASH', referenceNumber:'', notes:'' };

const CATEGORIES = [
  { value:'RENT', label:'🏠 Rent', color:'#6C3CE1' },
  { value:'SALARY', label:'👷 Salary', color:'#0EA5E9' },
  { value:'UTILITIES', label:'💡 Utilities', color:'#F59E0B' },
  { value:'TRANSPORT', label:'🚗 Transport', color:'#10B981' },
  { value:'MARKETING', label:'📢 Marketing', color:'#EC4899' },
  { value:'OFFICE_SUPPLIES', label:'📎 Office Supplies', color:'#8B5CF6' },
  { value:'MAINTENANCE', label:'🔧 Maintenance', color:'#14B8A6' },
  { value:'INSURANCE', label:'🛡️ Insurance', color:'#6366F1' },
  { value:'TAX', label:'🏛️ Tax', color:'#EF4444' },
  { value:'FOOD', label:'🍽️ Food', color:'#F97316' },
  { value:'TELECOM', label:'📱 Telecom', color:'#06B6D4' },
  { value:'OTHER', label:'📦 Other', color:'#6B7280' },
];

export default function Expenses() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('ALL');
  const [view, setView] = useState('list');

  const load = () => api.get('/expenses').then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const save = async e => {
    e.preventDefault();
    if (editing) await api.put(`/expenses/${editing}`, form);
    else await api.post('/expenses', form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const del = async id => { if (confirm('Delete this expense?')) { await api.delete(`/expenses/${id}`); load(); } };

  const edit = e => { setForm({...e}); setEditing(e.id); setShowForm(true); };

  const filtered = list.filter(e => {
    const matchSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'ALL' || e.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalExpenses = filtered.reduce((sum, e) => sum + Number(e.amount), 0);
  const thisMonth = list.filter(e => {
    const d = new Date(e.expenseDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + Number(e.amount), 0);

  // Category breakdown
  const catBreakdown = {};
  list.forEach(e => {
    catBreakdown[e.category] = (catBreakdown[e.category] || 0) + Number(e.amount);
  });
  const maxCatVal = Math.max(...Object.values(catBreakdown), 1);

  const getCatInfo = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length-1];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1E293B' }}>💸 Expenses</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>Track all your business expenses</p>
        </div>
        <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }} style={btnPrimary}>+ Add Expense</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:20 }}>
        <div style={{ background:'#FEF2F2', borderRadius:14, padding:18, border:'1px solid #EF444420' }}>
          <div style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Total Expenses</div>
          <div style={{ fontSize:24, fontWeight:700, color:'#EF4444', marginTop:4 }}>₹{totalExpenses.toLocaleString()}</div>
        </div>
        <div style={{ background:'#FFFBEB', borderRadius:14, padding:18, border:'1px solid #F59E0B20' }}>
          <div style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>This Month</div>
          <div style={{ fontSize:24, fontWeight:700, color:'#F59E0B', marginTop:4 }}>₹{thisMonth.toLocaleString()}</div>
        </div>
        <div style={{ background:'#F5F3FF', borderRadius:14, padding:18, border:'1px solid #6C3CE120' }}>
          <div style={{ fontSize:11, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Total Entries</div>
          <div style={{ fontSize:24, fontWeight:700, color:'#6C3CE1', marginTop:4 }}>{list.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <input style={{ ...inputStyle, maxWidth:280 }} placeholder="🔍 Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...inputStyle, maxWidth:180 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button onClick={() => setView('list')} style={{ background: view==='list' ? '#6C3CE1' : '#F1F5F9', color: view==='list' ? '#fff' : '#475569', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:600 }}>List</button>
          <button onClick={() => setView('category')} style={{ background: view==='category' ? '#6C3CE1' : '#F1F5F9', color: view==='category' ? '#fff' : '#475569', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:600 }}>By Category</button>
        </div>
      </div>

      {/* Category View */}
      {view === 'category' && (
        <div style={{ background:'#fff', borderRadius:14, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <h3 style={{ marginTop:0, fontSize:16, fontWeight:700, color:'#1E293B' }}>📊 Expense by Category</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:16 }}>
            {CATEGORIES.filter(c => catBreakdown[c.value]).map(cat => (
              <div key={cat.value}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'#1E293B' }}>{cat.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:cat.color }}>₹{(catBreakdown[cat.value] || 0).toLocaleString()}</span>
                </div>
                <div style={{ height:10, background:'#F3F4F6', borderRadius:5, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${((catBreakdown[cat.value] || 0) / maxCatVal) * 100}%`, background:cat.color, borderRadius:5, transition:'width 0.5s ease' }}></div>
                </div>
              </div>
            ))}
            {Object.keys(catBreakdown).length === 0 && <div style={{ textAlign:'center', color:'#9CA3AF', padding:40 }}>No expenses recorded yet</div>}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Category</th>
                <th style={{...thStyle, textAlign:'right'}}>Amount</th>
                <th style={thStyle}>Payment Mode</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>
                  <div style={{ fontSize:40, marginBottom:8 }}>💸</div>
                  No expenses found
                </td></tr>
              )}
              {filtered.map(e => {
                const catInfo = getCatInfo(e.category);
                return (
                  <tr key={e.id} style={{ borderBottom:'1px solid #F1F5F9' }}>
                    <td style={tdStyle}>{e.expenseDate}</td>
                    <td style={tdStyle}><strong>{e.description}</strong></td>
                    <td style={tdStyle}>
                      <span style={{ background:catInfo.color+'15', color:catInfo.color, padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600 }}>{catInfo.label}</span>
                    </td>
                    <td style={{...tdStyle, textAlign:'right', fontWeight:700, color:'#EF4444'}}>₹{Number(e.amount).toLocaleString()}</td>
                    <td style={tdStyle}>
                      <span style={{ background:'#EDE9FE', color:'#6C3CE1', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{e.paymentMode}</span>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => edit(e)} style={{ background:'#6C3CE1', color:'#fff', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12, marginRight:6 }}>Edit</button>
                      <button onClick={() => del(e.id)} style={{ background:'#EF4444', color:'#fff', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={modalStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ marginTop:0, fontSize:18, fontWeight:700, color:'#1E293B' }}>{editing ? '✏️ Edit' : '➕ Add'} Expense</h3>
            <form onSubmit={save}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input style={inputStyle} placeholder="Description *" required value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
                <select style={inputStyle} value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input style={inputStyle} placeholder="Amount (₹) *" type="number" step="0.01" required value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
                <input style={inputStyle} type="date" required value={form.expenseDate} onChange={e => setForm({...form, expenseDate:e.target.value})} />
                <select style={inputStyle} value={form.paymentMode} onChange={e => setForm({...form, paymentMode:e.target.value})}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
                <input style={inputStyle} placeholder="Reference Number" value={form.referenceNumber} onChange={e => setForm({...form, referenceNumber:e.target.value})} />
              </div>
              <input style={{...inputStyle, marginTop:12 }} placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} />
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button type="submit" style={btnPrimary}>Save Expense</button>
                <button type="button" onClick={() => setShowForm(false)} style={btnGray}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
