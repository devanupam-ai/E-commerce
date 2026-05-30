import { useState } from 'react';
import { whatsappAPI } from '../api';

// WhatsApp Icon SVG
const WaIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Reusable WhatsApp Button
export function WaButton({ onClick, children, size = 'sm', style = {} }) {
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12, gap: 5, iconSize: 13 },
    md: { padding: '8px 16px', fontSize: 13, gap: 6, iconSize: 15 },
    lg: { padding: '10px 20px', fontSize: 14, gap: 8, iconSize: 17 },
  };
  const s = sizes[size] || sizes.sm;
  return (
    <button onClick={onClick} style={{
      background: '#25D366', color: '#fff', border: 'none', borderRadius: 10,
      padding: s.padding, fontSize: s.fontSize, fontWeight: 600, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: s.gap,
      transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
      ...style
    }}>
      <WaIcon size={s.iconSize} /> {children || 'WhatsApp'}
    </button>
  );
}

// WhatsApp Send Modal - Shows message preview before sending
export function WaSendModal({ open, onClose, title, phone, message, whatsappLink }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:18, padding:28, width:480, maxHeight:'85vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, background:'#25D366', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <WaIcon size={22} />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:'#1E293B' }}>{title || 'Send via WhatsApp'}</div>
              {phone && <div style={{ fontSize:12, color:'#6B7280' }}>📞 {phone}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#F1F5F9', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:16, fontWeight:700, color:'#64748B' }}>✕</button>
        </div>

        {/* Message Preview */}
        <div style={{ background:'#F0FDF4', borderRadius:12, padding:16, marginBottom:20, border:'1px solid #BBF7D0' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#16A34A', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Message Preview</div>
          <div style={{ fontSize:13, color:'#1E293B', whiteSpace:'pre-wrap', lineHeight:1.6, maxHeight:250, overflowY:'auto' }}>{message}</div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', background:'#F1F5F9', border:'none', borderRadius:10, fontSize:13, fontWeight:600, color:'#475569', cursor:'pointer' }}>Cancel</button>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={onClose} style={{
            flex:1, padding:'10px', background:'#25D366', border:'none', borderRadius:10, fontSize:13, fontWeight:600,
            color:'#fff', cursor:'pointer', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            boxShadow:'0 4px 12px rgba(37,211,102,0.3)'
          }}>
            <WaIcon size={16} /> Send on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

// Quick WhatsApp opener (no modal, direct open)
export async function openWhatsApp(apiCall, setError) {
  try {
    const res = await apiCall();
    const link = res.data.whatsappLink;
    if (link) {
      window.open(link, '_blank');
    } else {
      if (setError) setError('No phone number found');
    }
  } catch (err) {
    console.error('WhatsApp error:', err);
    if (setError) setError('Failed to generate WhatsApp message');
  }
}

// Quick WhatsApp with preview modal
export function useWhatsAppModal() {
  const [waModal, setWaModal] = useState({ open: false, title: '', phone: '', message: '', link: '' });

  const openWaModal = async (apiCall, title) => {
    try {
      const res = await apiCall();
      setWaModal({
        open: true,
        title: title || 'Send via WhatsApp',
        phone: res.data.phone || '',
        message: res.data.message || '',
        link: res.data.whatsappLink || '',
      });
    } catch (err) {
      console.error('WhatsApp error:', err);
    }
  };

  const closeWaModal = () => setWaModal({ open: false, title: '', phone: '', message: '', link: '' });

  const WaModalComponent = () => (
    <WaSendModal
      open={waModal.open}
      onClose={closeWaModal}
      title={waModal.title}
      phone={waModal.phone}
      message={waModal.message}
      whatsappLink={waModal.link}
    />
  );

  return { openWaModal, WaModalComponent };
}

export default WaButton;
