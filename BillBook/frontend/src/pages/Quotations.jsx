
import { useEffect, useState } from 'react';
import api from '../api';

const emptyItem = { productName:'', quantity:1, unit:'PCS', unitPrice:0, discountPercent:0, taxPercent:0 };
const empty = { customerId:'', quotationDate: new Date().toISOString().split('T')[0], validUntil:'', isGst:false, discountPercent:0, notes:'', terms:'Valid for 15 days', items:[{...emptyItem}] };

export default function Quotations() {
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const load = async () => {
    const [qRes, cRes, pRes] = await Promise.all([
      api.get('/quotations'),
      api.get('/customers'),
      api.get('/products')
    ]);
    setList(qRes.data);
    setCustomers(cRes.data);
    setProducts(pRes.data);
  };
  useEffect(() => { load(); }, []);

  const save = async e => {
    e.preventDefault();
    if (editing) await api.put(`/quotations/${editing}`, form);
    else await api.post('/quotations', form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const del = async id => { if (confirm('Delete this quotation?')) { await api.delete(`/quotations/${id}`); load(); } };

  const edit = q => {
    setForm({
      ...q,
      customerId: q.customer?.id || '',
      items: q.items?.length ? q.items : [{...emptyItem}]
    });
    setEditing(q.id); setShowForm(true);
  };

  const convertToInvoice = async (q) => {
    if (confirm(`Convert quotation ${q.quotationNumber} to invoice?`)) {
      await api.post(`/quotations/${q.id}/convert`);
      load();
    }
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    // Auto-calc total for item
    const item = items[index];
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discountPercent) || 0;
    const tax = Number(item.taxPercent) || 0;
    const base = qty * price;
    const afterDisc = base - (base * disc / 100);
    const afterTax = afterDisc + (afterDisc * tax / 100);
    items[index].totalPrice = afterTax;
    setForm({...form, items});
  };

  const addItem = () => setForm({...form, items:[...form.items, {...emptyItem}]});
  const removeItem = (i) => setForm({...form, items: form.items.filter((_, idx) => idx !== i)});

  const subtotal = form.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const totalTax = form.items.reduce((s, i) => {
    const base = (Number(i.quantity)||0) * (Number(i.unitPrice)||0);
    const afterDisc = base - (base * (Number(i.discountPercent)||0) / 100);
    return s + afterDisc * (Number(i.taxPercent)||0) / 100;
  }, 0);
  const grandTotal = subtotal - (subtotal * (Number(form.discountPercent)||0) / 100) + totalTax;

  const filtered = list.filter(q => {
    const matchSearch = !search || q.quotationNumber?.toLowerCase().includes(search.toLowerCase()) || q.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColors = {
    DRAFT: { bg:'#EDE9FE', color:'#6C3CE1' },
    SENT: { bg:'#DBEAFE', color:'#2563EB' },
    ACCEPTED: { bg:'#D1FAE5', color:'#059669' },
    REJECTED: { bg:'#FEE2E2', color:'#DC2626' },
    CONVERTED: { bg:'#FEF3C7', color:'#D97706' },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1E293B' }}>📋 Quotations</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>Create & manage quotations, convert to invoices</p>
        </div>
        <button onClick={() => { setForm({...empty, items:[{...emptyItem}]}); setEditing(null); setShowForm(true); }} style={btnPrimary}>+ New Quotation</button>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, marginBottom:20 }}>
        {['DRAFT','SENT','ACCEPTED','REJECTED','CONVERTED'].map(s => {
          const sc = statusColors[s];
          const count = list.filter(q => q.status === s).length;
          return (
            <div key={s} style={{ background:sc.bg, borderRadius:12, padding:14, textAlign:'center', cursor:'pointer' }} onClick={() => setFilterStatus(filterStatus===s ? 'ALL' : s)}>
              <div style={{ fontSize:22, fontWeight:700, color:sc.color }}>{count}</div>
              <div style={{ fontSize:11, fontWeight:600, color:sc.color, textTransform:'uppercase', letterSpacing:0.5 }}>{s}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <input style={{ ...inputStyle, maxWidth:280 }} placeholder="🔍 Search quotations..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...inputStyle, maxWidth:160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="CONVERTED">Converted</option>
        </select>
      </div>

      {/* Quotations List */}
      <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8FAFC' }}>
              <th style={thStyle}>Quotation #</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Valid Until</th>
              <th style={{...thStyle, textAlign:'right'}}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>
                <div style={{ fontSize:40, marginBottom:8 }}>📋</div>No quotations found
              </td></tr>
            )}
            {filtered.map(q => {
              const sc = statusColors[q.status] || statusColors.DRAFT;
              return (
                <tr key={q.id} style={{ borderBottom:'1px solid #F1F5F9' }}>
                  <td style={tdStyle}><strong>{q.quotationNumber}</strong></td>
                  <td style={tdStyle}>{q.customer?.name || '—'}</td>
                  <td style={tdStyle}>{q.quotationDate}</td>
                  <td style={tdStyle}>{q.validUntil || '—'}</td>
                  <td style={{...tdStyle, textAlign:'right', fontWeight:700}}>₹{Number(q.totalAmount).toLocaleString()}</td>
                  <td style={tdStyle}>
                    <span style={{ background:sc.bg, color:sc.color, padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600 }}>{q.status}</span>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => edit(q)} style={{ background:'#6C3CE1', color:'#fff', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12, marginRight:4 }}>Edit</button>
                    {q.status !== 'CONVERTED' && <button onClick={() => convertToInvoice(q)} style={{ background:'#10B981', color:'#fff', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12, marginRight:4 }}>→ Invoice</button>}
                    <button onClick={() => del(q.id)} style={{ background:'#EF4444', color:'#fff', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Quotation Modal */}
      {showForm && (
        <div style={modalStyle}>
          <div style={{ ...modalBoxStyle, width:700 }}>
            <h3 style={{ marginTop:0, fontSize:18, fontWeight:700, color:'#1E293B' }}>{editing ? '✏️ Edit' : '➕ New'} Quotation</h3>
            <form onSubmit={save}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <select style={inputStyle} required value={form.customerId} onChange={e => setForm({...form, customerId:e.target.value})}>
                  <option value="">Select Customer *</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input style={inputStyle} type="date" required value={form.quotationDate} onChange={e => setForm({...form, quotationDate:e.target.value})} />
                <input style={inputStyle} type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil:e.target.value})} placeholder="Valid Until" />
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:16, marginBottom:8 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#1E293B' }}>
                  <input type="checkbox" checked={form.isGst} onChange={e => setForm({...form, isGst:e.target.checked})} /> GST Applicable
                </label>
                <input style={{ ...inputStyle, maxWidth:140 }} placeholder="Discount %" type="number" value={form.discountPercent} onChange={e => setForm({...form, discountPercent:e.target.value})} />
              </div>

              {/* Items */}
              <div style={{ background:'#F8FAFC', borderRadius:10, padding:12, marginTop:8 }}>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr auto', gap:8, marginBottom:8, fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase' }}>
                  <span>Product</span><span>Qty</span><span>Unit</span><span>Price</span><span>Disc%</span><span>Tax%</span><span></span>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr auto', gap:8, marginBottom:6 }}>
                    <input style={itemInputStyle} placeholder="Product name" required value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)} />
                    <input style={itemInputStyle} type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                    <select style={itemInputStyle} value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                      <option>PCS</option><option>KG</option><option>MTR</option><option>LTR</option><option>BOX</option>
                    </select>
                    <input style={itemInputStyle} type="number" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                    <input style={itemInputStyle} type="number" placeholder="Disc%" value={item.discountPercent} onChange={e => updateItem(i, 'discountPercent', e.target.value)} />
                    <input style={itemInputStyle} type="number" placeholder="Tax%" value={item.taxPercent} onChange={e => updateItem(i, 'taxPercent', e.target.value)} />
                    <button type="button" onClick={() => removeItem(i)} style={{ background:'#FEE2E2', color:'#EF4444', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, width:32 }}>×</button>
                  </div>
                ))}
                <button type="button" onClick={addItem} style={{ background:'#6C3CE1', color:'#fff', border:'none', borderRadius:8, padding:'6px 16px', cursor:'pointer', fontSize:12, fontWeight:600, marginTop:4 }}>+ Add Item</button>
              </div>

              {/* Totals */}
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
                <div style={{ width:250 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}><span style={{color:'#6B7280'}}>Subtotal:</span><strong>₹{subtotal.toLocaleString()}</strong></div>
                  {Number(form.discountPercent) > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}><span style={{color:'#6B7280'}}>Discount:</span><strong style={{color:'#EF4444'}}>-₹{(subtotal * Number(form.discountPercent) / 100).toLocaleString()}</strong></div>}
                  {totalTax > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}><span style={{color:'#6B7280'}}>Tax:</span><strong style={{color:'#F59E0B'}}>₹{totalTax.toLocaleString()}</strong></div>}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:700, borderTop:'2px solid #E5E7EB', paddingTop:8, marginTop:4 }}><span>Total:</span><span style={{color:'#6C3CE1'}}>₹{grandTotal.toLocaleString()}</span></div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                <input style={inputStyle} placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} />
                <input style={inputStyle} placeholder="Terms & Conditions" value={form.terms} onChange={e => setForm({...form, terms:e.target.value})} />
              </div>

              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button type="submit" style={btnPrimary}>Save Quotation</button>
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
const itemInputStyle = { padding:'8px 10px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, width:'100%', boxSizing:'border-box' };
const btnPrimary = { background:'#6C3CE1', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer', fontSize:14, fontWeight:600 };
const btnGray = { background:'#94A3B8', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer', fontSize:14, fontWeight:600 };
const modalStyle = { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(4px)' };
const modalBoxStyle = { background:'#fff', padding:24, borderRadius:16, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' };
