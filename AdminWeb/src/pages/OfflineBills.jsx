import { useState, useEffect } from 'react';
import { offlineBillAPI } from '../api';

export default function OfflineBills() {
  const [bills, setBills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', totalAmount: '', itemsSummary: '', paymentMode: 'CASH', billNumber: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await offlineBillAPI.getAll();
    setBills(res.data);
  };

  const handleSave = async () => {
    if (!form.customerName || !form.totalAmount) return alert('Fill required fields');
    await offlineBillAPI.create({ ...form, totalAmount: parseFloat(form.totalAmount) });
    setShowForm(false);
    setForm({ customerName: '', customerPhone: '', totalAmount: '', itemsSummary: '', paymentMode: 'CASH', billNumber: '' });
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this bill?')) { await offlineBillAPI.delete(id); load(); }
  };

  const totalRevenue = bills.reduce((s, b) => s + parseFloat(b.totalAmount || 0), 0).toFixed(0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Offline Billing</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Offline Bill</button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #6C3CE1' }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Total Offline Bills</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{bills.length}</div>
        </div>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Total Offline Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: '#10B981' }}>₹{totalRevenue}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #F3F4F6', textAlign: 'left' }}>
              {['Bill #', 'Customer', 'Items', 'Payment', 'Amount', 'Date', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '12px 16px', fontWeight: 700 }}>{b.billNumber || `BILL-${b.id}`}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{b.customerName || '—'}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{b.customerPhone}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280', maxWidth: 200 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.itemsSummary || '—'}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#F3F4F6', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                    {b.paymentMode}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#6C3CE1' }}>₹{b.totalAmount}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>
                  {new Date(b.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleDelete(b.id)}
                    style={{ padding: '6px 12px', fontSize: 12, background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>No offline bills yet</p>}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 460 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Add Offline Bill</h3>
            {[
              { key: 'billNumber', label: 'Bill Number (optional)' },
              { key: 'customerName', label: 'Customer Name *' },
              { key: 'customerPhone', label: 'Customer Phone' },
              { key: 'totalAmount', label: 'Total Amount (₹) *', type: 'number' },
              { key: 'itemsSummary', label: 'Items Summary (e.g. Milk x2, Bread x1)' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 14 }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Payment Mode</label>
              <select value={form.paymentMode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))}
                style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 14 }}>
                {['CASH', 'UPI', 'CARD', 'NET_BANKING'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" style={{ flex: 1, padding: 12 }} onClick={handleSave}>Save Bill</button>
              <button className="btn-secondary" style={{ flex: 1, padding: 12 }} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
