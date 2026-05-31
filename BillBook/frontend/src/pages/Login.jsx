import { useState, useEffect, useRef } from 'react';
import api from '../api';
import useAuth from '../store';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@billbook.com', password: 'password' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);
  const [dots, setDots] = useState('');
  const dotsRef = useRef(null);
  const { login } = useAuth();
  const nav = useNavigate();

  // Animate dots while waking server
  useEffect(() => {
    if (waking) {
      dotsRef.current = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
    } else {
      clearInterval(dotsRef.current);
      setDots('');
    }
    return () => clearInterval(dotsRef.current);
  }, [waking]);

  // Keep-alive ping: wake the backend when login page loads
  useEffect(() => {
    const ping = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        await fetch(`${apiBase}/api/bb/auth/login`, { method: 'OPTIONS' });
      } catch {}
    };
    ping();
  }, []);

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true); setWaking(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setWaking(false);
      login(data, data.token);
      nav('/');
    } catch (error) {
      setWaking(false);
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
        setErr('Server is waking up. Please wait 30 seconds and try again.');
      } else if (error.response?.status === 401) {
        setErr('Invalid email or password');
      } else {
        setErr('Login failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.logo}>{waking ? '⏳' : '📒'} BillBook</h1>
        <p style={styles.sub}>Smart Billing & Invoicing</p>
        {waking && (
          <div style={styles.wakeBox}>
            🚀 Waking up server{dots} This may take 30-60 seconds on first visit.
          </div>
        )}
        <form onSubmit={submit}>
          <input style={styles.input} placeholder="Email" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} />
          {err && <p style={styles.err}>{err}</p>}
          <button style={{...styles.btn, opacity: loading ? 0.8 : 1}} type="submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={styles.spinner} />
                {waking ? `Waking server${dots}` : 'Logging in...'}
              </span>
            ) : 'Login'}
          </button>
        </form>
        <p style={styles.hint}>Default: admin@billbook.com / password</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4ff' },
  card: { background:'#fff', padding:'2.5rem', borderRadius:'16px', boxShadow:'0 4px 24px #0001', width:'380px' },
  logo: { margin:0, fontSize:'2rem', textAlign:'center' },
  sub: { textAlign:'center', color:'#666', marginBottom:'1.5rem' },
  wakeBox: { background:'#FEF3C7', border:'1px solid #F59E0B', borderRadius:8, padding:12, marginBottom:16, textAlign:'center', color:'#92400E', fontSize:13 },
  input: { width:'100%', padding:'0.75rem', marginBottom:'1rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem', boxSizing:'border-box' },
  btn: { width:'100%', padding:'0.75rem', background:'#4f46e5', color:'#fff', border:'none', borderRadius:'8px', fontSize:'1rem', cursor:'pointer' },
  spinner: { width:16, height:16, border:'2px solid #fff3', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 1s linear infinite', display:'inline-block' },
  err: { color:'red', marginBottom:'0.5rem', fontSize:'0.9rem' },
  hint: { textAlign:'center', color:'#999', fontSize:'0.8rem', marginTop:'1rem' },
};
