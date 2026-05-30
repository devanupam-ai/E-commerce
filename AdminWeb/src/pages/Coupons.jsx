import { useState, useEffect } from 'react';
import api from '../api';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    expiryDate: '',
    usageLimit: '',
    usageCount: 0,
    active: true,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data || []);
    } catch (err) {
      console.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCoupon) {
        await api.put(`/admin/coupons/${editCoupon.id}`, form);
      } else {
        await api.post('/admin/coupons', form);
      }
      loadCoupons();
      setShowForm(false);
      setEditCoupon(null);
      setForm({
        code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderValue: '',
        maxDiscount: '', expiryDate: '', usageLimit: '', usageCount: 0, active: true,
      });
    } catch (err) {
      alert('Error saving coupon: ' + err.message);
    }
  };

  const handleEdit = (coupon) => {
    setEditCoupon(coupon);
    setForm(coupon);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this coupon?')) {
      try {
        await api.delete(`/admin/coupons/${id}`);
        loadCoupons();
      } catch (err) {
        alert('Error deleting coupon');
      }
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await api.put(`/admin/coupons/${coupon.id}`, { ...coupon, active: !coupon.active });
      loadCoupons();
    } catch (err) {
      alert('Error updating coupon');
    }
  };

  if (loading) return <p>Loading coupons...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🎟️ Coupons & Promos</h2>
        <button className="btn-primary" onClick={() => {
          setEditCoupon(null);
          setForm({
            code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderValue: '',
            maxDiscount: '', expiryDate: '', usageLimit: '', usageCount: 0, active: true,
          });
          setShowForm(!showForm);
        }}>
          ➕ Add Coupon
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, background: '#F9FAFB' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{editCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Coupon Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  required
                  style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Discount Type</label>
                <select
                  value={form.discountType}
                  onChange={e => setForm({ ...form, discountType: e.target.value })}
                  style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Discount Value {form.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={e => setForm({ ...form, discountValue: e.target.value })}
                  placeholder="e.g., 20"
                  required
                  style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Min Order Value (₹)</label>
                <input
                  type="number"
                  value={form.minOrderValue}
                  onChange={e => setForm({ ...form, minOrderValue: e.target.value })}
                  placeholder="e.g., 100"
                  style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Max Discount (₹)</label>
                <input
                  type="number"
                  value={form.maxDiscount}
                  onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                  placeholder="e.g., 500"
                  style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Usage Limit</label>
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="e.g., 100 (0 = unlimited)"
                  style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Expiry Date</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  required
                  style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm({ ...form, active: e.target.checked })}
                    style={{ marginRight: 8, width: 18, height: 18, cursor: 'pointer' }}
                  />
                  Active
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary">💾 Save Coupon</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>All Coupons</h3>
        {coupons.length === 0 ? (
          <p style={{ padding: 16, color: '#9CA3AF' }}>No coupons yet. Create one to get started!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                {['Code', 'Discount', 'Min Order', 'Max Discount', 'Expiry', 'Used', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{c.code}</td>
                  <td style={{ padding: '12px' }}>
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  </td>
                  <td style={{ padding: '12px' }}>₹{c.minOrderValue || '—'}</td>
                  <td style={{ padding: '12px' }}>₹{c.maxDiscount || '—'}</td>
                  <td style={{ padding: '12px', fontSize: 12 }}>{new Date(c.expiryDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{c.usageCount}/{c.usageLimit || '∞'}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${c.active ? 'status-DELIVERED' : 'status-CANCELLED'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => toggleActive(c)}
                      style={{ padding: '4px 8px', fontSize: 11, background: c.active ? '#FEE2E2' : '#D1FAE5', color: c.active ? '#DC2626' : '#059669', borderRadius: 4, border: 'none', cursor: 'pointer' }}>
                      {c.active ? '🔴 Deactivate' : '🟢 Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(c)}
                      style={{ padding: '4px 8px', fontSize: 11, background: '#DBEAFE', color: '#2563EB', borderRadius: 4, border: 'none', cursor: 'pointer' }}>
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ padding: '4px 8px', fontSize: 11, background: '#FEE2E2', color: '#DC2626', borderRadius: 4, border: 'none', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}