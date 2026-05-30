
import { useEffect, useState } from 'react';
import api from '../api';

const empty = { businessName:'', ownerName:'', phone:'', email:'', address:'', city:'', state:'', pincode:'', gstin:'', panNumber:'', bankName:'', bankAccount:'', ifscCode:'', upiId:'', businessType:'RETAILER' };

const BUSINESS_TYPES = [
  { value:'RETAILER', label:'🏪 Retailer' },
  { value:'WHOLESALER', label:'📦 Wholesaler' },
  { value:'MANUFACTURER', label:'🏭 Manufacturer' },
  { value:'DISTRIBUTOR', label:'🚚 Distributor' },
  { value:'SERVICE_PROVIDER', label:'🛎️ Service Provider' },
  { value:'FREELANCER', label:'💻 Freelancer' },
];

export default function BusinessProfile() {
  const [form, setForm] = useState(empty);
  const [profileId, setProfileId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/business-profile');
      if (res.data) {
        setForm({ ...empty, ...res.data });
        setProfileId(res.data.id);
      }
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async e => {
    e.preventDefault();
    try {
      if (profileId) await api.put(`/business-profile/${profileId}`, form);
      else {
        const res = await api.post('/business-profile', form);
        setProfileId(res.data.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save profile');
    }
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div style={{ width:40, height:40, border:'4px solid #E5E7EB', borderTopColor:'#6C3CE1', borderRadius:'50%', animation:'spin 1s linear infinite' }}></div>
    </div>
  );

  return (
    <div style={{ maxWidth:800 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1E293B' }}>⚙️ Business Profile</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>Your business details appear on invoices & reports</p>
        </div>
        {saved && <span style={{ background:'#D1FAE5', color:'#059669', padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:600 }}>✅ Saved successfully!</span>}
      </div>

      <form onSubmit={save}>
        {/* Business Info */}
        <div style={{ background:'#fff', borderRadius:14, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div style={{ width:28, height:28, background:'linear-gradient(135deg, #6C3CE1, #4F46E5)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🏢</div>
            <span style={{ fontWeight:700, fontSize:16, color:'#1E293B' }}>Business Information</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <input style={inputStyle} placeholder="Business Name *" required value={form.businessName} onChange={e => setForm({...form, businessName:e.target.value})} />
            <input style={inputStyle} placeholder="Owner Name *" required value={form.ownerName} onChange={e => setForm({...form, ownerName:e.target.value})} />
            <select style={inputStyle} value={form.businessType} onChange={e => setForm({...form, businessType:e.target.value})}>
              {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div></div>
            <input style={inputStyle} placeholder="📞 Phone" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
            <input style={inputStyle} placeholder="📧 Email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
          </div>
        </div>

        {/* Address */}
        <div style={{ background:'#fff', borderRadius:14, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div style={{ width:28, height:28, background:'linear-gradient(135deg, #10B981, #059669)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>📍</div>
            <span style={{ fontWeight:700, fontSize:16, color:'#1E293B' }}>Address</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14 }}>
            <input style={inputStyle} placeholder="Address Line" value={form.address} onChange={e => setForm({...form, address:e.target.value})} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              <input style={inputStyle} placeholder="City" value={form.city} onChange={e => setForm({...form, city:e.target.value})} />
              <input style={inputStyle} placeholder="State" value={form.state} onChange={e => setForm({...form, state:e.target.value})} />
              <input style={inputStyle} placeholder="Pincode" value={form.pincode} onChange={e => setForm({...form, pincode:e.target.value})} />
            </div>
          </div>
        </div>

        {/* Tax Info */}
        <div style={{ background:'#fff', borderRadius:14, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div style={{ width:28, height:28, background:'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🏛️</div>
            <span style={{ fontWeight:700, fontSize:16, color:'#1E293B' }}>Tax Information</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <input style={inputStyle} placeholder="GSTIN" value={form.gstin} onChange={e => setForm({...form, gstin:e.target.value})} />
            <input style={inputStyle} placeholder="PAN Number" value={form.panNumber} onChange={e => setForm({...form, panNumber:e.target.value})} />
          </div>
        </div>

        {/* Bank Details */}
        <div style={{ background:'#fff', borderRadius:14, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div style={{ width:28, height:28, background:'linear-gradient(135deg, #0EA5E9, #0284C7)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🏦</div>
            <span style={{ fontWeight:700, fontSize:16, color:'#1E293B' }}>Bank Details</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <input style={inputStyle} placeholder="Bank Name" value={form.bankName} onChange={e => setForm({...form, bankName:e.target.value})} />
            <input style={inputStyle} placeholder="Account Number" value={form.bankAccount} onChange={e => setForm({...form, bankAccount:e.target.value})} />
            <input style={inputStyle} placeholder="IFSC Code" value={form.ifscCode} onChange={e => setForm({...form, ifscCode:e.target.value})} />
            <input style={inputStyle} placeholder="UPI ID" value={form.upiId} onChange={e => setForm({...form, upiId:e.target.value})} />
          </div>
        </div>

        <button type="submit" style={{ ...btnPrimary, width:'100%', padding:'14px', fontSize:16 }}>💾 Save Business Profile</button>
      </form>
    </div>
  );
}

const inputStyle = { padding:'10px 14px', border:'2px solid #E5E7EB', borderRadius:10, fontSize:14, width:'100%', boxSizing:'border-box', outline:'none', transition:'border-color 0.2s' };
const btnPrimary = { background:'#6C3CE1', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer', fontSize:14, fontWeight:600 };
