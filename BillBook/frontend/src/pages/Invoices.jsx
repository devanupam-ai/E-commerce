import { useEffect, useState } from 'react';
import api from '../api';
import { WaButton, useWhatsAppModal } from '../components/WhatsAppButton';
import { whatsappAPI } from '../api';

const emptyItem = { productName:'', quantity:'1', unit:'PCS', unitPrice:'', discountPercent:'0', gstRate:'0' };

export default function Invoices() {
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(null);
  const [payAmt, setPayAmt] = useState('');
  const [payMode, setPayMode] = useState('CASH');
  const [filterStatus, setFilterStatus] = useState('');
  const { openWaModal, WaModalComponent } = useWhatsAppModal();
  const [form, setForm] = useState({
    customerId:'', invoiceDate: new Date().toISOString().split('T')[0],
    dueDate:'', isGst: false, paymentMode:'CASH', discountPercent:'0', notes:'',
    items:[{...emptyItem}]
  });

  const load = () => {
    const url = filterStatus ? `/invoices?status=${filterStatus}` : '/invoices';
    api.get(url).then(r => setList(r.data));
  };
  useEffect(() => { load(); }, [filterStatus]);
  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data));
    api.get('/products').then(r => setProducts(r.data));
  }, []);

  const addItem = () => setForm(f => ({...f, items:[...f.items, {...emptyItem}]}));
  const removeItem = i => setForm(f => ({...f, items: f.items.filter((_,idx) => idx!==i)}));
  const updateItem = (i, field, val) => setForm(f => {
    const items = [...f.items];
    items[i] = {...items[i], [field]: val};
    if (field === 'productName') {
      const p = products.find(p => p.name === val);
      if (p) items[i] = {...items[i], unitPrice: p.sellingPrice, gstRate: p.gstRate, unit: p.unit};
    }
    return {...f, items};
  });

  const calcTotal = () => {
    let sub = 0;
    form.items.forEach(it => {
      const line = (parseFloat(it.quantity)||0) * (parseFloat(it.unitPrice)||0);
      const disc = line * (parseFloat(it.discountPercent)||0) / 100;
      sub += line - disc;
    });
    const disc = sub * (parseFloat(form.discountPercent)||0) / 100;
    return (sub - disc).toFixed(2);
  };

  const save = async e => {
    e.preventDefault();
    await api.post('/invoices', form);
    setShowForm(false); load();
  };

  const recordPayment = async () => {
    await api.post(`/invoices/${showPayment.id}/payment`, { amount: payAmt, paymentMode: payMode });
    setShowPayment(null); setPayAmt(''); load();
  };

  const downloadPdf = async (id, invoiceNumber) => {
    try {
      const token = localStorage.getItem('bb_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9999'}/api/bb/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate PDF');
      }
      const blob = await res.blob();
      if (blob.size === 0) throw new Error('Empty PDF received');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('PDF Error: ' + err.message);
    }
  };

  const statusColor = s => ({ PAID:'#10b981', UNPAID:'#ef4444', PARTIAL:'#f59e0b', OVERDUE:'#dc2626' }[s] || '#999');

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Invoices</h2>
        <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
          <select style={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>UNPAID</option><option>PARTIAL</option><option>PAID</option><option>OVERDUE</option>
          </select>
          <button style={styles.btn} onClick={() => setShowForm(true)}>+ New Invoice</button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div style={styles.modal}>
          <div style={{...styles.modalBox, width:'360px'}}>
            <h3 style={{marginTop:0}}>Record Payment — {showPayment.invoiceNumber}</h3>
            <p>Balance Due: <strong>₹{Number(showPayment.balanceDue).toLocaleString('en-IN')}</strong></p>
            <input style={{...styles.input, width:'100%', marginBottom:'0.75rem'}} type="number" placeholder="Amount"
              value={payAmt} onChange={e => setPayAmt(e.target.value)} />
            <select style={{...styles.input, width:'100%', marginBottom:'1rem'}} value={payMode} onChange={e => setPayMode(e.target.value)}>
              {['CASH','UPI','CARD','BANK_TRANSFER','CHEQUE'].map(m => <option key={m}>{m}</option>)}
            </select>
            <div style={{display:'flex', gap:'0.5rem'}}>
              <button style={styles.btn} onClick={recordPayment}>Save Payment</button>
              <button style={styles.btnGray} onClick={() => setShowPayment(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={{...styles.modalBox, width:'700px'}}>
            <h3 style={{marginTop:0}}>New Invoice</h3>
            <form onSubmit={save}>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Customer *</label>
                  <select style={styles.input} required value={form.customerId}
                    onChange={e => setForm({...form, customerId: e.target.value})}>
                    <option value="">Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Invoice Date *</label>
                  <input style={styles.input} type="date" value={form.invoiceDate}
                    onChange={e => setForm({...form, invoiceDate: e.target.value})} />
                </div>
                <div>
                  <label style={styles.label}>Due Date</label>
                  <input style={styles.input} type="date" value={form.dueDate}
                    onChange={e => setForm({...form, dueDate: e.target.value})} />
                </div>
                <div>
                  <label style={styles.label}>Payment Mode</label>
                  <select style={styles.input} value={form.paymentMode}
                    onChange={e => setForm({...form, paymentMode: e.target.value})}>
                    {['CASH','UPI','CARD','BANK_TRANSFER','CHEQUE','CREDIT'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Discount %</label>
                  <input style={styles.input} type="number" step="0.01" value={form.discountPercent}
                    onChange={e => setForm({...form, discountPercent: e.target.value})} />
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem', paddingTop:'1.5rem'}}>
                  <input type="checkbox" id="gst" checked={form.isGst}
                    onChange={e => setForm({...form, isGst: e.target.checked})} />
                  <label htmlFor="gst">GST Invoice</label>
                </div>
              </div>

              <h4 style={{margin:'1rem 0 0.5rem'}}>Items</h4>
              {form.items.map((item, i) => (
                <div key={i} style={styles.itemRow}>
                  <input style={{...styles.input, flex:2}} placeholder="Product name" value={item.productName}
                    list={`prod-${i}`} onChange={e => updateItem(i, 'productName', e.target.value)} />
                  <datalist id={`prod-${i}`}>{products.map(p => <option key={p.id} value={p.name}/>)}</datalist>
                  <input style={{...styles.input, flex:'0 0 70px'}} type="number" placeholder="Qty" value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)} />
                  <input style={{...styles.input, flex:'0 0 90px'}} placeholder="Unit" value={item.unit}
                    onChange={e => updateItem(i, 'unit', e.target.value)} />
                  <input style={{...styles.input, flex:1}} type="number" placeholder="Price" value={item.unitPrice}
                    onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                  <input style={{...styles.input, flex:'0 0 70px'}} type="number" placeholder="Disc%" value={item.discountPercent}
                    onChange={e => updateItem(i, 'discountPercent', e.target.value)} />
                  {form.isGst && <input style={{...styles.input, flex:'0 0 70px'}} type="number" placeholder="GST%" value={item.gstRate}
                    onChange={e => updateItem(i, 'gstRate', e.target.value)} />}
                  <button type="button" style={styles.removeBtn} onClick={() => removeItem(i)}>✕</button>
                </div>
              ))}
              <button type="button" style={{...styles.btnGray, marginTop:'0.5rem', fontSize:'0.85rem'}} onClick={addItem}>+ Add Item</button>

              <div style={{textAlign:'right', marginTop:'1rem', fontSize:'1.1rem', fontWeight:700}}>
                Total: ₹{calcTotal()}
              </div>

              <textarea style={{...styles.input, width:'100%', marginTop:'0.75rem', height:'60px'}}
                placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />

              <div style={{display:'flex', gap:'0.5rem', marginTop:'1rem'}}>
                <button style={styles.btn} type="submit">Create Invoice</button>
                <button style={styles.btnGray} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table style={styles.table}>
        <thead><tr style={styles.thead}>
          <th>Invoice #</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {list.map(inv => (
            <tr key={inv.id} style={styles.tr}>
              <td style={styles.td}><strong>{inv.invoiceNumber}</strong></td>
              <td style={styles.td}>{inv.customer?.name}</td>
              <td style={styles.td}>{inv.invoiceDate}</td>
              <td style={styles.td}>₹{Number(inv.totalAmount).toLocaleString('en-IN')}</td>
              <td style={styles.td}>₹{Number(inv.paidAmount).toLocaleString('en-IN')}</td>
              <td style={styles.td}>₹{Number(inv.balanceDue).toLocaleString('en-IN')}</td>
              <td style={styles.td}><span style={{...styles.badge, background: statusColor(inv.paymentStatus)}}>{inv.paymentStatus}</span></td>
              <td style={styles.td}>
                <div style={{display:'flex', gap:'0.4rem', flexWrap:'wrap'}}>
                {inv.paymentStatus !== 'PAID' &&
                  <button style={styles.btnSm} onClick={() => { setShowPayment(inv); setPayAmt(inv.balanceDue); }}>💰 Pay</button>}
                <button style={{...styles.btnSm, background:'#10b981'}} onClick={() => downloadPdf(inv.id, inv.invoiceNumber)}>⬇ PDF</button>
              </div>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={8} style={{...styles.td, textAlign:'center', color:'#999'}}>No invoices yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' },
  title: { margin:0, color:'#1e293b' },
  btn: { background:'#4f46e5', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'8px', cursor:'pointer', fontSize:'0.9rem' },
  btnGray: { background:'#94a3b8', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'8px', cursor:'pointer', fontSize:'0.9rem' },
  btnSm: { background:'#4f46e5', color:'#fff', border:'none', padding:'0.3rem 0.8rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' },
  removeBtn: { background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'6px', padding:'0.3rem 0.6rem', cursor:'pointer' },
  input: { padding:'0.6rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'0.9rem', boxSizing:'border-box', width:'100%' },
  select: { padding:'0.6rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'0.9rem' },
  label: { display:'block', fontSize:'0.8rem', color:'#64748b', marginBottom:'0.25rem' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' },
  itemRow: { display:'flex', gap:'0.5rem', marginBottom:'0.5rem', alignItems:'center' },
  modal: { position:'fixed', inset:0, background:'#0005', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  modalBox: { background:'#fff', padding:'2rem', borderRadius:'16px', maxHeight:'90vh', overflowY:'auto' },
  table: { width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 8px #0001' },
  thead: { background:'#f8fafc' },
  tr: { borderBottom:'1px solid #f1f5f9' },
  td: { padding:'0.75rem 1rem', fontSize:'0.9rem' },
  badge: { color:'#fff', padding:'2px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:600 },
};
