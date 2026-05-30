import { useState, useEffect } from 'react';
import { purchaseAPI, vendorAPI } from '../api';
import api from '../api';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({
    vendorId: '', purchaseDate: new Date().toISOString().split('T')[0],
    dueDate: '', isGst: false, paymentMode: 'CASH', invoiceNumber: '', notes: '',
    discountPercent: '', items: [{ productName: '', productId: '', quantity: '1', unit: 'PCS', unitPrice: '', purchasePrice: '', discountPercent: '0', gstRate: '0' }]
  });
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMode: 'CASH', referenceNumber: '', notes: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [pRes, vRes, prRes] = await Promise.all([
      purchaseAPI.list({ status: filterStatus || undefined, vendorId: filterVendor || undefined }),
      vendorAPI.list(),
      api.get('/products')
    ]);
    setPurchases(pRes.data);
    setVendors(vRes.data);
    setProducts(prRes.data);
  };

  useEffect(() => { load(); }, [filterStatus, filterVendor]);

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { productName: '', productId: '', quantity: '1', unit: 'PCS', unitPrice: '', purchasePrice: '', discountPercent: '0', gstRate: '0' }] }));
  };

  const removeItem = (i) => {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  };

  const updateItem = (i, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: value };
      // Auto-fill from product selection
      if (field === 'productId' && value) {
        const product = products.find(p => p.id === parseInt(value));
        if (product) {
          items[i].productName = product.name;
          items[i].unit = product.unit || 'PCS';
          items[i].unitPrice = product.purchasePrice || product.sellingPrice || '';
          items[i].purchasePrice = product.purchasePrice || '';
          items[i].gstRate = product.gstRate || '0';
        }
      }
      return { ...f, items };
    });
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      vendorId: parseInt(form.vendorId),
      discountPercent: form.discountPercent ? parseFloat(form.discountPercent) : 0,
      items: form.items.map(item => ({
        ...item,
        productId: item.productId ? parseInt(item.productId) : null,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice) : parseFloat(item.unitPrice),
        discountPercent: parseFloat(item.discountPercent || 0),
        gstRate: parseFloat(item.gstRate || 0),
      }))
    };
    await purchaseAPI.create(payload);
    setShowForm(false);
    resetForm();
    load();
  };

  const handlePayment = async () => {
    await purchaseAPI.recordPayment(showPayment.id, {
      amount: parseFloat(paymentForm.amount),
      paymentMode: paymentForm.paymentMode,
      referenceNumber: paymentForm.referenceNumber,
      notes: paymentForm.notes,
    });
    setShowPayment(null);
    setPaymentForm({ amount: '', paymentMode: 'CASH', referenceNumber: '', notes: '' });
    load();
  };

  const resetForm = () => {
    setForm({
      vendorId: '', purchaseDate: new Date().toISOString().split('T')[0],
      dueDate: '', isGst: false, paymentMode: 'CASH', invoiceNumber: '', notes: '',
      discountPercent: '', items: [{ productName: '', productId: '', quantity: '1', unit: 'PCS', unitPrice: '', purchasePrice: '', discountPercent: '0', gstRate: '0' }]
    });
  };

  const statusColor = (s) => s === 'PAID' ? '#059669' : s === 'PARTIAL' ? '#D97706' : '#DC2626';
  const statusBg = (s) => s === 'PAID' ? '#D1FAE5' : s === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📦 Purchases</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          padding: '10px 20px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: '#fff',
          boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)', transition: 'transform 0.2s, box-shadow 0.2s'
        }}
          onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.5)'; }}
          onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(14, 165, 233, 0.4)'; }}>
          + New Purchase
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}>
          <option value="">All Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
        <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)}
          style={{ padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}>
          <option value="">All Vendors</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      {/* Purchases Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #F3F4F6', textAlign: 'left' }}>
              {['Date', 'Purchase #', 'Vendor', 'Vendor Invoice', 'Amount', 'Paid', 'Balance', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.purchaseDate}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{p.purchaseNumber}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.vendor?.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>{p.invoiceNumber || '-'}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>₹{(p.totalAmount || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', color: '#059669' }}>₹{(p.paidAmount || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: p.balanceDue > 0 ? '#DC2626' : '#059669' }}>₹{(p.balanceDue || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: statusBg(p.paymentStatus), color: statusColor(p.paymentStatus) }}>{p.paymentStatus}</span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
                  <button onClick={() => setShowDetail(p)} style={{ padding: '4px 10px', fontSize: 11, background: '#E5E7EB', border: 'none', borderRadius: 4, cursor: 'pointer' }}>View</button>
                  {p.balanceDue > 0 && (
                    <button onClick={() => { setShowPayment(p); setPaymentForm({ ...paymentForm, amount: p.balanceDue }); }} style={{ padding: '4px 10px', fontSize: 11, background: '#6C3CE1', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Pay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Purchase Modal - Beautiful */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, paddingTop: 30, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ width: 740, maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)', padding: '24px 28px', borderRadius: '20px 20px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 700, margin: 0, color: '#fff', fontSize: 20 }}>🛒 New Purchase</h3>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Record a purchase from vendor</p>
                </div>
                <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Vendor & Date Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #818CF8, #6366F1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏭</div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>Vendor & Date</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vendor *</label>
                  <select value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, boxSizing: 'border-box' }}>
                    <option value="">Select vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vendor Invoice #</label>
                  <input placeholder="Vendor's invoice number" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#0EA5E9'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>📅 Purchase Date *</label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>📅 Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, background: '#F8FAFC', padding: '12px 16px', borderRadius: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isGst} onChange={e => setForm(f => ({ ...f, isGst: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: '#0EA5E9' }} />
                  🏛️ GST Applicable
                </label>
                <div style={{ borderLeft: '2px solid #E5E7EB', height: 24, margin: '0 8px' }}></div>
                <div>
                  <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>💳 Payment Mode: </span>
                  <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                    style={{ padding: '6px 10px', border: '2px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}>
                    {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E5E7EB, transparent)', margin: '0 -28px 20px' }}></div>

              {/* Items Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #34D399, #10B981)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>Purchase Items</span>
              </div>

              {form.items.map((item, i) => (
                <div key={i} style={{ background: i % 2 === 0 ? '#F8FAFC' : '#FFF', border: '2px solid #F1F5F9', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 1fr 1fr 0.7fr auto', gap: 10, alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Product</label>
                      <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 12, boxSizing: 'border-box' }}>
                        <option value="">Select product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input placeholder="Or type product name" value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 12, marginTop: 4, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Qty</label>
                      <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 12, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Unit</label>
                      <input value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 12, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Unit Price ₹</label>
                      <input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 12, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Purchase ₹</label>
                      <input type="number" value={item.purchasePrice} onChange={e => updateItem(i, 'purchasePrice', e.target.value)} placeholder="= Unit Price"
                        style={{ width: '100%', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 12, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>GST%</label>
                      <input type="number" value={item.gstRate} onChange={e => updateItem(i, 'gstRate', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 12, boxSizing: 'border-box' }} />
                    </div>
                    <button onClick={() => removeItem(i)} disabled={form.items.length === 1}
                      style={{ padding: 8, background: form.items.length === 1 ? '#F3F4F6' : '#FEE2E2', color: form.items.length === 1 ? '#9CA3AF' : '#DC2626', border: 'none', borderRadius: 8, cursor: form.items.length === 1 ? 'not-allowed' : 'pointer', fontSize: 16 }}>🗑️</button>
                  </div>
                </div>
              ))}
              <button onClick={addItem} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #34D399, #10B981)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
                ➕ Add Item
              </button>

              {/* Divider */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E5E7EB, transparent)', margin: '0 -28px 20px' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>🏷️ Discount %</label>
                  <input type="number" placeholder="0" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#0EA5E9'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>📝 Notes</label>
                  <input placeholder="Any notes about this purchase..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#0EA5E9'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleSave} style={{
                  flex: 1, padding: '14px 20px', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: '#fff',
                  boxShadow: '0 4px 14px rgba(14,165,233,0.4)', transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                  onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(14,165,233,0.5)'; }}
                  onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(14,165,233,0.4)'; }}>
                  🛒 Create Purchase
                </button>
                <button onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: '14px 20px', border: '2px solid #E5E7EB', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  background: '#fff', color: '#6B7280', transition: 'all 0.2s'
                }}
                  onMouseOver={e => { e.target.style.borderColor = '#DC2626'; e.target.style.color = '#DC2626'; }}
                  onMouseOut={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.color = '#6B7280'; }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - Beautiful */}
      {showPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ width: 460, background: '#fff', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: '20px 24px', borderRadius: '20px 20px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700, margin: 0, color: '#fff', fontSize: 18 }}>💰 Record Payment</h3>
                <button onClick={() => setShowPayment(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: '#FEF2F2', border: '2px solid #FECACA', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#991B1B' }}>{showPayment.purchaseNumber} — {showPayment.vendor?.name}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>₹{(showPayment.balanceDue || 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#991B1B' }}>Balance Due</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>💵 Payment Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: '#059669' }}>₹</span>
                  <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px 12px 32', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 16, fontWeight: 600, boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#10B981'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>💳 Payment Mode</label>
                  <select value={paymentForm.paymentMode} onChange={e => setPaymentForm(p => ({ ...p, paymentMode: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #E5E7EB', borderRadius: 10, outline: 'none', fontSize: 13, boxSizing: 'border-box' }}>
                    {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>🔢 Reference No.</label>
                  <input placeholder="Cheque/Ref #" value={paymentForm.referenceNumber} onChange={e => setPaymentForm(p => ({ ...p, referenceNumber: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #E5E7EB', borderRadius: 10, outline: 'none', fontSize: 13, boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#10B981'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>📝 Notes</label>
                <input placeholder="Payment notes..." value={paymentForm.notes} onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #E5E7EB', borderRadius: 10, outline: 'none', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handlePayment} style={{
                  flex: 1, padding: '12px 16px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.4)'
                }}>✅ Record Payment</button>
                <button onClick={() => setShowPayment(null)} style={{
                  flex: 1, padding: '12px 16px', border: '2px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  background: '#fff', color: '#6B7280'
                }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Beautiful */}
      {showDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ width: 640, maxHeight: '85vh', overflow: 'auto', background: '#fff', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', padding: '20px 24px', borderRadius: '20px 20px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 700, margin: 0, color: '#fff', fontSize: 18 }}>📦 {showDetail.purchaseNumber}</h3>
                  <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{showDetail.vendor?.name} • {showDetail.purchaseDate}</p>
                </div>
                <button onClick={() => setShowDetail(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, fontSize: 13 }}>
                <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8 }}><strong>Vendor Invoice:</strong> {showDetail.invoiceNumber || '-'}</div>
                <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8 }}><strong>Payment Mode:</strong> {showDetail.paymentMode}</div>
                {showDetail.dueDate && <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8 }}><strong>Due Date:</strong> {showDetail.dueDate}</div>}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, borderRadius: 12, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                    {['Item', 'Qty', 'Unit Price', 'Purchase ₹', 'Total'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(showDetail.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{item.productName}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{item.quantity} {item.unit}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>₹{item.unitPrice}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#6C3CE1', fontWeight: 600 }}>₹{item.purchasePrice}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>₹{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal</span><span>₹{showDetail.subtotal}</span></div>
              {showDetail.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Discount</span><span>-₹{showDetail.discountAmount}</span></div>}
              {showDetail.totalTax > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>GST</span><span>₹{showDetail.totalTax}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 8 }}>
                <span>Total</span><span>₹{showDetail.totalAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginTop: 4 }}><span>Paid</span><span>₹{showDetail.paidAmount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#DC2626' }}><span>Balance Due</span><span>₹{showDetail.balanceDue}</span></div>
            </div>
            {showDetail.balanceDue > 0 && (
              <button className="btn-primary" style={{ width: '100%', padding: 12, marginTop: 16 }} onClick={() => { setShowDetail(null); setShowPayment(showDetail); setPaymentForm({ ...paymentForm, amount: showDetail.balanceDue }); }}>💰 Record Payment</button>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
