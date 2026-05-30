import { Link, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../store';

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => { logout(); nav('/login'); };

  const links = [
    { to: '/', icon: '📊', label: 'Dashboard' },
    { to: '/analytics', icon: '📈', label: 'Analytics' },
    { to: '/customers', icon: '👥', label: 'Customers' },
    { to: '/vendors', icon: '🏭', label: 'Vendors' },
    { to: '/products', icon: '📦', label: 'Products' },
    { to: '/purchases', icon: '🛒', label: 'Purchases' },
    { to: '/invoices', icon: '🧾', label: 'Invoices' },
    { to: '/quotations', icon: '📋', label: 'Quotations' },
    { to: '/cash-register', icon: '💰', label: 'Cash Register' },
    { to: '/expenses', icon: '💸', label: 'Expenses' },
    { to: '/reports', icon: '📑', label: 'Reports' },
    { to: '/khata', icon: '📒', label: 'Party Khata' },
    { to: '/gst-reports', icon: '🧾', label: 'GST Reports' },
    { to: '/business-profile', icon: '⚙️', label: 'Business Profile' },
  ];

  return (
    <div style={styles.wrap}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>📒 BillBook</div>
        <nav style={styles.nav}>
          {links.map(l => (
            <Link key={l.to} to={l.to} style={styles.link}>
              <span style={styles.icon}>{l.icon}</span> {l.label}
            </Link>
          ))}
        </nav>
        <div style={styles.user}>
          <div style={{marginBottom:'0.5rem'}}>
            <strong>{user?.name}</strong>
            <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>{user?.businessName}</div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  wrap: { display:'flex', minHeight:'100vh', background:'#f8fafc' },
  sidebar: { width:'240px', background:'#1e293b', color:'#fff', display:'flex', flexDirection:'column', padding:'1.5rem 0' },
  logo: { fontSize:'1.5rem', fontWeight:700, padding:'0 1.5rem', marginBottom:'2rem' },
  nav: { flex:1, display:'flex', flexDirection:'column', gap:'0.25rem' },
  link: { padding:'0.75rem 1.5rem', color:'#cbd5e1', textDecoration:'none', display:'flex', alignItems:'center', gap:'0.75rem', transition:'all 0.2s', borderRadius: '0 8px 8px 0', marginRight: '0.75rem' },
  icon: { fontSize:'1.2rem' },
  user: { padding:'1rem 1.5rem', borderTop:'1px solid #334155' },
  logoutBtn: { background:'#ef4444', color:'#fff', border:'none', padding:'0.5rem 1rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', width:'100%' },
  main: { flex:1, padding:'2rem', overflowY:'auto' },
};
