
import { useState } from 'react';
import { aiDescriptionAPI } from '../api';

const TONES = [
  { value: 'professional', label: '👔 Professional', desc: 'Formal & business-like' },
  { value: 'casual', label: '😊 Casual', desc: 'Friendly & conversational' },
  { value: 'luxury', label: '✨ Luxury', desc: 'Premium & exclusive' },
  { value: 'playful', label: '🎉 Playful', desc: 'Fun & energetic' },
  { value: 'technical', label: '🔬 Technical', desc: 'Detailed & precise' },
];

export default function AIDescriptionGenerator() {
  const [form, setForm] = useState({ productName: '', category: '', features: '', tone: 'professional' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const generate = async () => {
    if (!form.productName) return alert('Please enter a product name');
    setLoading(true);
    try {
      const res = await aiDescriptionAPI.generate(form);
      setResult(res.data);
    } catch (e) { alert('Failed to generate: ' + (e.response?.data?.error || e.message)); }
    setLoading(false);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🤖 AI Product Description Generator</h2>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Auto-generate SEO-friendly product descriptions in seconds</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Input Form */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📝 Product Details</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Product Name *</label>
            <input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })}
              placeholder="e.g., Wireless Noise Cancelling Earbuds"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Category</label>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              placeholder="e.g., Electronics, Fashion, Home"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Key Features (comma separated)</label>
            <textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })}
              placeholder="e.g., Bluetooth 5.3, 30hr battery, ANC, IPX5 water resistant"
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 8 }}>Tone</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TONES.map(t => (
                <button key={t.value} onClick={() => setForm({ ...form, tone: t.value })}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: form.tone === t.value ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    background: form.tone === t.value ? '#EFF6FF' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: form.tone === t.value ? 700 : 400,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading}
            style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '⏳ Generating...' : '✨ Generate Description'}
          </button>
        </div>

        {/* Result */}
        <div>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Main Description */}
              <div className="card" style={{ padding: 20, borderLeft: '4px solid #3B82F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 700 }}>📄 Product Description</h3>
                  <button onClick={() => copyToClipboard(result.description, 'desc')}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    {copied === 'desc' ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: '#374151' }}>{result.description}</div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF' }}>{result.wordCount} words • {result.tone} tone</div>
              </div>

              {/* Bullet Points */}
              <div className="card" style={{ padding: 20, borderLeft: '4px solid #10B981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 700 }}>✅ Key Highlights</h3>
                  <button onClick={() => copyToClipboard(result.bulletPoints.join('\n'), 'bullets')}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    {copied === 'bullets' ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                {result.bulletPoints.map((bp, i) => (
                  <div key={i} style={{ padding: '6px 0', fontSize: 13, color: '#374151' }}>{bp}</div>
                ))}
              </div>

              {/* Meta Description */}
              <div className="card" style={{ padding: 20, borderLeft: '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontWeight: 700 }}>🏷️ Meta Description</h3>
                  <button onClick={() => copyToClipboard(result.metaDescription, 'meta')}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    {copied === 'meta' ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>{result.metaDescription}</div>
              </div>

              {/* SEO Keywords */}
              <div className="card" style={{ padding: 20, borderLeft: '4px solid #8B5CF6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontWeight: 700 }}>🔑 SEO Keywords</h3>
                  <button onClick={() => copyToClipboard(result.seoKeywords, 'seo')}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    {copied === 'seo' ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.seoKeywords.split(', ').map((kw, i) => (
                    <span key={i} style={{ padding: '3px 10px', borderRadius: 12, background: '#F3F4F6', fontSize: 12, color: '#4B5563' }}>{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 48 }}>🤖</div>
              <div style={{ fontWeight: 600, marginTop: 12 }}>Fill in product details and click Generate</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>AI will create a professional description with SEO keywords</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
