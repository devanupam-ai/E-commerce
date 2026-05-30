import { useState } from 'react';
import { authAPI } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@ecommerce.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.role !== 'ADMIN') { setError('Admin access only'); return; }
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data));
      onLogin(res.data);
    } catch {
      setError('Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
      <div className="card" style={{ width: 380, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56 }}>⚙️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#6C3CE1', marginTop: 8 }}>Admin Panel</h1>
          <p style={{ color: '#6B7280', marginTop: 4 }}>Ecommerce Management System</p>
        </div>
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
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14 }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
