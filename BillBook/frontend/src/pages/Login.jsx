import { useState } from 'react';
import api from '../api';
import useAuth from '../store';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@billbook.com', password: 'password' });
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault(); setErr('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data, data.token);
      nav('/');
    } catch { setErr('Invalid credentials'); }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.logo}>📒 BillBook</h1>
        <p style={styles.sub}>Smart Billing & Invoicing</p>
        <form onSubmit={submit}>
          <input style={styles.input} placeholder="Email" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} />
          {err && <p style={styles.err}>{err}</p>}
          <button style={styles.btn} type="submit">Login</button>
        </form>
        <p style={styles.hint}>Default: admin@billbook.com / password</p>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4ff' },
  card: { background:'#fff', padding:'2.5rem', borderRadius:'16px', boxShadow:'0 4px 24px #0001', width:'360px' },
  logo: { margin:0, fontSize:'2rem', textAlign:'center' },
  sub: { textAlign:'center', color:'#666', marginBottom:'1.5rem' },
  input: { width:'100%', padding:'0.75rem', marginBottom:'1rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem', boxSizing:'border-box' },
  btn: { width:'100%', padding:'0.75rem', background:'#4f46e5', color:'#fff', border:'none', borderRadius:'8px', fontSize:'1rem', cursor:'pointer' },
  err: { color:'red', marginBottom:'0.5rem', fontSize:'0.9rem' },
  hint: { textAlign:'center', color:'#999', fontSize:'0.8rem', marginTop:'1rem' },
};
