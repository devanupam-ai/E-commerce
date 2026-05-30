import { useState, useEffect } from 'react';
import { vendorAPI, purchaseAPI } from '../api';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [showLedger, setShowLedger] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
    gstin: '', panNumber: '', bankName: '', bankAccount: '', ifscCode: '', upiId: '',
    openingBalance: '', notes: ''
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await vendorAPI.list(search);
    setVendors(res.data);
  };

  const openAdd = () => {
    setEditVendor(null);
    setForm({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', gstin: '', panNumber: '', bankName: '', bankAccount: '', ifscCode: '', upiId: '', openingBalance: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = (v) => {
    setEditVendor(v);
    setForm({ name: v.name, email: v.email || '', phone: v.phone || '', address: v.address || '', city: v.city || '', state: v.state || '', pincode: v.pincode || '', gstin: v.gstin || '', panNumber: v.panNumber || '', bankName: v.bankName || '', bankAccount: v.bankAccount || '', ifscCode: v.ifscCode || '', upiId: v.upiId || '', openingBalance: v.openingBalance || '', notes: v.notes || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = { ...form, openingBalance: form.openingBalance ? parseFloat(form.openingBalance) : 0 };
    if (editVendor) await vendorAPI.update(editVendor.id, payload);
    else await vendorAPI.create(payload);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deactivate this vendor?')) { await vendorAPI.delete(id); load(); }
  };

  const openLedger = async (vendor) => {
    const res = await purchaseAPI.vendorLedger(vendor.id);
    setLedger(res.data);
    setShowLedger(vendor);
  };

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.phone?.includes(search) ||
    v.gstin?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🏭 Vendors</h2>
        <button onClick={openAdd} style={{
          padding: '10px 20px', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          background: 'linear-gradient(135deg, #6C3CE1, #4F46E5)', color: '#fff',
          boxShadow: '0 4px 14px rgba(108, 60, 225, 0.4)', transition: 'transform 0.2s, box-shadow 0.2s'
        }}
          onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(108, 60, 225, 0.5)'; }}
          onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(108, 60, 225, 0.4)'; }}>
          + Add Vendor
        </button>
      </div>

      <input placeholder="Search vendors by name, phone, GSTIN..." value={search}
        onChange={e => { setSearch(e.target.value); load(); }}
        style={{ width: '100%', padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16, outline: 'none' }} />

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Total Vendors</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#6C3CE1' }}>{vendors.length}</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Total Payable</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#DC2626' }}>
            ₹{vendors.reduce((sum, v) => sum + (v.balanceDue || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Total Purchased</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>
            ₹{vendors.reduce((sum, v) => sum + (v.totalPurchaseAmount || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Vendor Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #F3F4F6', textAlign: 'left' }}>
              {['Vendor', 'Contact', 'GSTIN', 'Total Purchase', 'Paid', 'Balance Due', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{v.name}</div>
                  {v.city && <div style={{ fontSize: 12, color: '#6B7280' }}>{v.city}, {v.state}</div>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>
                  {v.phone && <div>📞 {v.phone}</div>}
                  {v.email && <div style={{ fontSize: 11, color: '#6B7280' }}>✉️ {v.email}</div>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'monospace' }}>{v.gstin || '-'}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669' }}>₹{(v.totalPurchaseAmount || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', color: '#6C3CE1' }}>₹{(v.totalPaidAmount || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontWeight: 700, color: v.balanceDue > 0 ? '#DC2626' : '#059669' }}>
                    ₹{(v.balanceDue || 0).toLocaleString()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                  <button onClick={() => openLedger(v)} style={{ padding: '6px 12px', fontSize: 12, background: '#DBEAFE', color: '#1D4ED8', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Ledger</button>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => openEdit(v)}>Edit</button>
                  <button onClick={() => handleDelete(v.id)} style={{ padding: '6px 12px', fontSize: 12, background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vendor Ledger Modal */}
      {showLedger && ledger && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 800, maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>📒 Vendor Ledger — {showLedger.name}</h3>
              <button onClick={() => { setShowLedger(null); setLedger(null); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Vendor Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Total Purchase</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>₹{(ledger.totalPurchase || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: '#EFF6FF', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Total Paid</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#6C3CE1' }}>₹{(ledger.totalPaid || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: ledger.balanceDue > 0 ? '#FEF2F2' : '#F0FDF4', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Balance Due</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: ledger.balanceDue > 0 ? '#DC2626' : '#059669' }}>₹{(ledger.balanceDue || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Purchases */}
            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>📦 Purchases</h4>
            {(ledger.purchases || []).length === 0 ? <p style={{ color: '#9CA3AF', fontSize: 13 }}>No purchases yet</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                    {['Date', 'Purchase #', 'Amount', 'Paid', 'Balance', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 11, color: '#6B7280' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.purchases.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px 12px', fontSize: 13 }}>{p.purchaseDate}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{p.purchaseNumber}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13 }}>₹{(p.totalAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: '#059669' }}>₹{(p.paidAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: p.balanceDue > 0 ? '#DC2626' : '#059669' }}>₹{(p.balanceDue || 0).toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                          background: p.paymentStatus === 'PAID' ? '#D1FAE5' : p.paymentStatus === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                          color: p.paymentStatus === 'PAID' ? '#059669' : p.paymentStatus === 'PARTIAL' ? '#D97706' : '#DC2626'
                        }}>{p.paymentStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Payments */}
            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>💰 Payments Made</h4>
            {(ledger.payments || []).length === 0 ? <p style={{ color: '#9CA3AF', fontSize: 13 }}>No payments yet</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                    {['Date', 'Amount', 'Mode', 'Reference', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 11, color: '#6B7280' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px 12px', fontSize: 13 }}>{p.paymentDate}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#6C3CE1' }}>₹{(p.amount || 0).toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>{p.paymentMode}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'monospace' }}>{p.referenceNumber || '-'}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, color: '#6B7280' }}>{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Beautiful Design */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ width: 600, maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease' }}>

            {/* Header with gradient */}
            <div style={{ background: 'linear-gradient(135deg, #6C3CE1 0%, #4F46E5 50%, #7C3AED 100%)', padding: '24px 28px', borderRadius: '20px 20px 0 0', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 700, margin: 0, color: '#fff', fontSize: 20 }}>
                    {editVendor ? '✏️ Edit Vendor' : '🏭 Add New Vendor'}
                  </h3>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                    {editVendor ? 'Update vendor information' : 'Add a new supplier to your business'}
                  </p>
                </div>
                <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Section: Basic Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #818CF8, #6366F1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📋</div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>Basic Information</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vendor Name *</label>
                  <input type="text" placeholder="Enter vendor name..." value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#6C3CE1'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>📞 Phone</label>
                  <input type="text" placeholder="Phone number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#6C3CE1'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>✉️ Email</label>
                  <input type="text" placeholder="Email address" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#6C3CE1'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E5E7EB, transparent)', margin: '0 -28px 20px' }}></div>

              {/* Section: Address */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #34D399, #10B981)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📍</div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>Address Details</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Street Address</label>
                <input type="text" placeholder="Full address..." value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#10B981'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { key: 'city', label: '🏙️ City', placeholder: 'City' },
                  { key: 'state', label: '🗺️ State', placeholder: 'State' },
                  { key: 'pincode', label: '📮 Pincode', placeholder: 'Pincode' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#10B981'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E5E7EB, transparent)', margin: '0 -28px 20px' }}></div>

              {/* Section: Tax & Banking */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏦</div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>Tax & Banking</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 8px', borderRadius: 10 }}>Optional</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { key: 'gstin', label: '🏛️ GSTIN', placeholder: '22AAAAA0000A1Z5' },
                  { key: 'panNumber', label: '🪪 PAN Number', placeholder: 'AAAAA0000A' },
                  { key: 'bankName', label: '🏦 Bank Name', placeholder: 'SBI, HDFC, etc.' },
                  { key: 'bankAccount', label: '💳 Account Number', placeholder: 'Account number' },
                  { key: 'ifscCode', label: '🔢 IFSC Code', placeholder: 'SBIN0001234' },
                  { key: 'upiId', label: '📱 UPI ID', placeholder: 'name@upi' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#F59E0B'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E5E7EB, transparent)', margin: '0 -28px 20px' }}></div>

              {/* Section: Opening Balance */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #F87171, #EF4444)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💰</div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>Opening Balance</span>
              </div>
              <div style={{ background: '#FEF2F2', border: '2px solid #FECACA', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#991B1B', fontWeight: 600, display: 'block', marginBottom: 6 }}>If vendor has existing dues, enter the amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: '#DC2626' }}>₹</span>
                  <input type="number" placeholder="0.00" value={form.openingBalance} onChange={e => setForm(p => ({ ...p, openingBalance: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px 12px 36', border: '2px solid #FECACA', borderRadius: 12, outline: 'none', fontSize: 18, fontWeight: 600, color: '#DC2626', background: '#FFF', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#EF4444'} onBlur={e => e.target.style.borderColor = '#FECACA'} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>📝 Notes</label>
                <textarea placeholder="Any additional notes about this vendor..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: 12, outline: 'none', fontSize: 14, minHeight: 70, resize: 'vertical', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6C3CE1'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleSave} style={{
                  flex: 1, padding: '14px 20px', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6C3CE1, #4F46E5)', color: '#fff',
                  boxShadow: '0 4px 14px rgba(108, 60, 225, 0.4)', transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                  onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(108, 60, 225, 0.5)'; }}
                  onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(108, 60, 225, 0.4)'; }}>
                  {editVendor ? '✅ Update Vendor' : '🚀 Add Vendor'}
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
    </div>
  );
}
