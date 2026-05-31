import { useState, useEffect, useRef } from 'react';
import { authAPI } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@ecommerce.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);
  const [dots, setDots] = useState('');
  const dotsRef = useRef(null);

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
        await fetch(`${apiBase}/api/categories`, { method: 'GET' });
      } catch {}
    };
    ping();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setWaking(true);
    try {
      const res = await authAPI.login({ email, password });
      setWaking(false);
      if (res.data.role !== 'ADMIN') { setError('Admin access only'); return; }
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data));
      onLogin(res.data);
    } catch (err) {
      setWaking(false);
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || !err.response) {
        setError('Server is waking up. Please wait 30 seconds and try again.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
      <div className="card" style={{ width: 400, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56 }}>{waking ? '⏳' : '⚙️'}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#6C3CE1', marginTop: 8 }}>Admin Panel</h1>
          <p style={{ color: '#6B7280', marginTop: 4 }}>Ecommerce Management System</p>
        </div>
        {waking && (
          <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: 12, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ color: '#92400E', fontSize: 13, margin: 0 }}>
              🚀 Waking up server{dots} This may take 30-60 seconds on first visit.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Admin Email" required
            style={{ width: '100%', padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 12, outline: 'none' }}
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required
            style={{ width: '100%', padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16, outline: 'none' }}
          />
          {error && <p style={{ color: '#DC2626', marginBottom: 12, fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14, position: 'relative' }} disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, border: '2px solid #fff3', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                {waking ? `Waking server${dots}` : 'Logging in...'}
              </span>
            ) : 'Login to Admin'}
          </button>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}
