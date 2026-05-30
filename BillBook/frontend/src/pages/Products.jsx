import { useEffect, useState } from 'react';
import api from '../api';

const empty = { name:'', sku:'', category:'', unit:'PCS', sellingPrice:'', purchasePrice:'', mrp:'', gstRate:'0', stockQuantity:'0', reorderLevel:'5' };

export default function Products() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const load = (q='') => api.get('/products' + (q ? `?q=${q}` : '')).then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const save = async e => {
    e.preventDefault();
    if (editing) await api.put(`/products/${editing}`, form);
    else await api.post('/products', form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const del = async id => { if (confirm('Delete product?')) { await api.delete(`/products/${id}`); load(); } };
  const edit = p => { setForm({...p}); setEditing(p.id); setShowForm(true); };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Products / Inventory</h2>
        <div style={{display:'flex', gap:'0.5rem'}}>
          <input style={{...styles.input, width:'200px'}} placeholder="Search..." value={search}
            onChange={e => { setSearch(e.target.value); load(e.target.value); }} />
          <button style={styles.btn} onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}>+ Add Product</button>
        </div>
      </div>

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3 style={{marginTop:0}}>{editing ? 'Edit' : 'Add'} Product</h3>
            <form onSubmit={save}>
              <div style={styles.grid}>
                {[['name','Name*'],['sku','SKU'],['category','Category'],['unit','Unit'],
                  ['sellingPrice','Selling Price*'],['purchasePrice','Purchase Price'],
                  ['mrp','MRP'],['gstRate','GST %'],['stockQuantity','Stock Qty'],['reorderLevel','Reorder Level']
                ].map(([f,label]) => (
                  <input key={f} style={styles.input} placeholder={label}
                    value={form[f]||''} onChange={e => setForm({...form,[f]:e.target.value})}
                    required={label.includes('*')} type={['sellingPrice','purchasePrice','mrp','gstRate','stockQuantity','reorderLevel'].includes(f)?'number':'text'} step="0.01" />
                ))}
              </div>
              <div style={{display:'flex', gap:'0.5rem', marginTop:'1rem'}}>
                <button style={styles.btn} type="submit">Save</button>
                <button style={styles.btnGray} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table style={styles.table}>
        <thead><tr style={styles.thead}>
          <th>Name</th><th>SKU</th><th>Category</th><th>Sell Price</th><th>Stock</th><th>GST%</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {list.map(p => (
            <tr key={p.id} style={styles.tr}>
              <td style={styles.td}><strong>{p.name}</strong></td>
              <td style={styles.td}>{p.sku}</td>
              <td style={styles.td}>{p.category}</td>
              <td style={styles.td}>₹{Number(p.sellingPrice).toLocaleString('en-IN')}</td>
              <td style={styles.td}>
                <span style={{color: p.stockQuantity <= 5 ? '#ef4444' : '#10b981', fontWeight:600}}>
                  {p.stockQuantity} {p.unit}
                </span>
              </td>
              <td style={styles.td}>{p.gstRate}%</td>
              <td style={styles.td}>
                <button style={styles.btnSm} onClick={() => edit(p)}>Edit</button>
                <button style={{...styles.btnSm, background:'#ef4444'}} onClick={() => del(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={7} style={{...styles.td, textAlign:'center', color:'#999'}}>No products yet</td></tr>}
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
  btnSm: { background:'#4f46e5', color:'#fff', border:'none', padding:'0.3rem 0.8rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', marginRight:'0.4rem' },
  input: { padding:'0.6rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'0.9rem', boxSizing:'border-box' },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' },
  modal: { position:'fixed', inset:0, background:'#0005', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  modalBox: { background:'#fff', padding:'2rem', borderRadius:'16px', width:'520px', maxHeight:'90vh', overflowY:'auto' },
  table: { width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 8px #0001' },
  thead: { background:'#f8fafc' },
  tr: { borderBottom:'1px solid #f1f5f9' },
  td: { padding:'0.75rem 1rem', fontSize:'0.9rem' },
};
