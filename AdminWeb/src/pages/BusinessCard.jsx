
import { useState, useEffect } from 'react';
import { businessCardAPI } from '../api';

const CARD_STYLES = [
  { value: 'MODERN', label: '🎨 Modern', desc: 'Gradient with rounded corners' },
  { value: 'CLASSIC', label: '🏛️ Classic', label: 'Traditional bordered card' },
  { value: 'MINIMAL', label: '⬜ Minimal', desc: 'Clean white design' },
  { value: 'BOLD', label: '🟣 Bold', desc: 'Large rounded with extra padding' },
];

const PRESET_COLORS = [
  { primary: '#6C3CE1', secondary: '#1E1B4B', name: 'Purple' },
  { primary: '#3B82F6', secondary: '#1E3A5F', name: 'Blue' },
  { primary: '#059669', secondary: '#064E3B', name: 'Green' },
  { primary: '#DC2626', secondary: '#7F1D1D', name: 'Red' },
  { primary: '#D97706', secondary: '#78350F', name: 'Amber' },
  { primary: '#0891B2', secondary: '#164E63', name: 'Cyan' },
  { primary: '#1E293B', secondary: '#0F172A', name: 'Dark' },
  { primary: '#EC4899', secondary: '#831843', name: 'Pink' },
];

export default function BusinessCard() {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { loadCard(); }, []);

  const loadCard = async () => {
    setLoading(true);
    try {
      const res = await businessCardAPI.get();
      setCard(res.data);
      setForm({
        businessName: res.data.businessName || '',
        ownerName: res.data.ownerName || '',
        designation: res.data.designation || '',
        phone: res.data.phone || '',
        email: res.data.email || '',
        website: res.data.website || '',
        address: res.data.address || '',
        city: res.data.city || '',
        state: res.data.state || '',
        pincode: res.data.pincode || '',
        gstin: res.data.gstin || '',
        upiId: res.data.upiId || '',
        whatsappNumber: res.data.whatsappNumber || '',
        primaryColor: res.data.primaryColor || '#6C3CE1',
        secondaryColor: res.data.secondaryColor || '#1E1B4B',
        cardStyle: res.data.cardStyle || 'MODERN',
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const saveCard = async () => {
    setSaving(true);
    try {
      const res = await businessCardAPI.update(form);
      setCard(res.data);
      setEditMode(false);
    } catch (e) { alert('Failed to save'); }
    setSaving(false);
  };

  const shareCard = async () => {
    try {
      const res = await businessCardAPI.share();
      setShareData(res.data);
    } catch (e) { alert('Failed to generate share link'); }
  };

  const applyPreset = (preset) => {
    setForm({ ...form, primaryColor: preset.primary, secondaryColor: preset.secondary });
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading business card...</div>;

  const previewCard = { ...card, ...form };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🪪 Business Card Generator</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setEditMode(!editMode)}>
            {editMode ? '👁️ Preview' : '✏️ Edit'}
          </button>
          <button className="btn-primary" onClick={shareCard}>📤 Share</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Left: Card Preview */}
        <div style={{ flex: '1 1 440px' }}>
          <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <div className={`biz-card ${previewCard.cardStyle?.toLowerCase() || 'modern'}`}
              style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{previewCard.businessName || 'Business Name'}</div>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
                  {previewCard.ownerName || 'Owner Name'}{previewCard.designation ? ` • ${previewCard.designation}` : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, opacity: 0.85 }}>
                  {previewCard.phone && <div>📞 {previewCard.phone}</div>}
                  {previewCard.email && <div>📧 {previewCard.email}</div>}
                  {previewCard.website && <div>🌐 {previewCard.website}</div>}
                  {previewCard.upiId && <div>💳 UPI: {previewCard.upiId}</div>}
                  {(previewCard.address || previewCard.city) && (
                    <div>📍 {[previewCard.address, previewCard.city, previewCard.state].filter(Boolean).join(', ')}</div>
                  )}
                  {previewCard.gstin && <div>🏢 GSTIN: {previewCard.gstin}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Share Result */}
          {shareData && (
            <div className="card animate-slideIn" style={{ marginTop: 16 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>📤 Share Your Card</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {shareData.whatsappLink && (
                  <a href={shareData.whatsappLink} target="_blank" rel="noreferrer"
                    style={{ padding: '10px 20px', background: '#25D366', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                    💬 Share on WhatsApp
                  </a>
                )}
                <button className="btn-secondary" onClick={() => {
                  navigator.clipboard.writeText(shareData.shareText);
                  alert('Copied to clipboard!');
                }}>📋 Copy Text</button>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280' }}>
                Shared {shareData.shareCount} times
              </div>
            </div>
          )}
        </div>

        {/* Right: Edit Form */}
        {editMode && (
          <div style={{ flex: '1 1 400px' }}>
            <div className="card animate-slideIn">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>✏️ Edit Card</h3>

              {/* Card Style */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Card Style</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {CARD_STYLES.map(s => (
                    <div key={s.value} onClick={() => setForm({...form, cardStyle: s.value})}
                      style={{ flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        border: form.cardStyle === s.value ? '2px solid #6C3CE1' : '2px solid #E5E7EB', fontSize: 12 }}>
                      <div>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Color Theme</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(p => (
                    <div key={p.name} onClick={() => applyPreset(p)}
                      style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                        background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
                        border: form.primaryColor === p.primary ? '3px solid #111' : '2px solid transparent' }}
                      title={p.name} />
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              {[
                { key: 'businessName', label: 'Business Name', icon: '🏢' },
                { key: 'ownerName', label: 'Owner Name', icon: '👤' },
                { key: 'designation', label: 'Designation', icon: '💼' },
                { key: 'phone', label: 'Phone', icon: '📞' },
                { key: 'email', label: 'Email', icon: '📧' },
                { key: 'website', label: 'Website', icon: '🌐' },
                { key: 'upiId', label: 'UPI ID', icon: '💳' },
                { key: 'whatsappNumber', label: 'WhatsApp Number', icon: '💬' },
                { key: 'address', label: 'Address', icon: '📍' },
                { key: 'city', label: 'City', icon: '🏙️' },
                { key: 'state', label: 'State', icon: '🗺️' },
                { key: 'pincode', label: 'Pincode', icon: '📮' },
                { key: 'gstin', label: 'GSTIN', icon: '🏢' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{f.icon} {f.label}</label>
                  <input value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4 }} />
                </div>
              ))}

              <button className="btn-primary" onClick={saveCard} disabled={saving} style={{ width: '100%', marginTop: 8 }}>
                {saving ? 'Saving...' : '💾 Save Card'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
