
import { useState, useEffect } from 'react';
import { promoCodeAPI } from '../api';

export default function PromoCodeManager() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
  const [form, setForm] = useState({
    code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderValue: '',
    maxDiscount: '', expiryDate: '', usageLimit: '', active: true, description: ''
  });

  useEffect(() => { loadPromos(); }, []);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const res = await promoCodeAPI.getAll();
      setPromos(res.data.promos || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editPromo) {
        await promoCodeAPI.update(editPromo.id, form);
      } else {
        await promoCodeAPI.create(form);
      }
      loadPromos();
      setShowForm(false);
      setEditPromo(null);
      resetForm();
    } catch (e) { alert('Failed to save promo code'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      await promoCodeAPI.delete(id);
      loadPromos();
    } catch (e) { alert('Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try {
      await promoCodeAPI.toggle(id);
      loadPromos();
    } catch (e) { alert('Failed to toggle'); }
  };

  const resetForm = () => {
    setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderValue: '', maxDiscount: '', expiryDate: '', usageLimit: '', active: true, description: '' });
  };

  const startEdit = (promo) => {
    setEditPromo(promo);
    setForm({
      code: promo.code, discountType: promo.discountType, discountValue: promo.discountValue,
      minOrderValue: promo.minOrderValue || '', maxDiscount: promo.maxDiscount || '',
      expiryDate: promo.expiryDate || '', usageLimit: promo.usageLimit || '', active: promo.active, description: promo.description || ''
    });
    setShowForm(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm({ ...form, code });
  };

  const stats = {
    total: promos.length,
    active: promos.filter(p => p.active).length,
    expired: promos.filter(p => p.status === 'EXPIRED').length,
    totalUsage: promos.reduce((sum, p) => sum + (p.usageCount || 0), 0),
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🎟️ Promo Code Manager</h2>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Create, manage and track promotional codes</div>
        </div>
        <button onClick={() => { resetForm(); setEditPromo(null); setShowForm(true); }}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
          ➕ Create Promo Code
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>TOTAL CODES</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{stats.total}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>ACTIVE</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: '#10B981' }}>{stats.active}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>EXPIRED</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: '#F59E0B' }}>{stats.expired}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>TOTAL USAGE</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: '#8B5CF6' }}>{stats.totalUsage}</div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #3B82F6' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{editPromo ? '✏️ Edit Promo Code' : '➕ Create Promo Code'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Promo Code *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SUMMER50" required
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, fontWeight: 700, letterSpacing: 1 }} />
                  <button type="button" onClick={generateCode}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    🎲 Random
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Discount Type</label>
                <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Discount Value *</label>
                <input value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 500'} required type="number"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Min Order Value</label>
                <input value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: e.target.value })}
                  placeholder="e.g., 500" type="number"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Max Discount</label>
                <input value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                  placeholder="e.g., 200" type="number"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Expiry Date</label>
                <input value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  type="date"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Usage Limit</label>
                <input value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="e.g., 100" type="number"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g., Summer sale discount"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                {editPromo ? '💾 Update' : '✅ Create'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditPromo(null); }}
                style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promo Codes List */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
        ) : promos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
            <div style={{ fontSize: 36 }}>🎟️</div>
            <div style={{ marginTop: 8 }}>No promo codes yet. Create your first one!</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {promos.map(p => (
              <div key={p.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, position: 'relative', opacity: p.active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ padding: '4px 12px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, fontSize: 15, letterSpacing: 1, fontFamily: 'monospace' }}>
                      {p.code}
                    </span>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 12, background: p.active ? '#D1FAE5' : '#FEE2E2', color: p.active ? '#059669' : '#DC2626', fontSize: 10, fontWeight: 700 }}>
                    {p.active ? 'ACTIVE' : (p.status === 'EXPIRED' ? 'EXPIRED' : 'INACTIVE')}
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6', margin: '8px 0' }}>
                  {p.discountType === 'PERCENTAGE' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                </div>
                {p.description && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{p.description}</div>}
                <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {p.minOrderValue > 0 && <span>Min: ₹{p.minOrderValue}</span>}
                  {p.maxDiscount > 0 && <span>Max: ₹{p.maxDiscount}</span>}
                  {p.expiryDate && <span>Exp: {p.expiryDate}</span>}
                  <span>Used: {p.usageCount || 0}/{p.usageLimit || '∞'}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button onClick={() => handleToggle(p.id)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    {p.active ? '⏸ Deactivate' : '▶ Activate'}
                  </button>
                  <button onClick={() => startEdit(p)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FEE2E2', background: '#FFF5F5', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#DC2626' }}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
