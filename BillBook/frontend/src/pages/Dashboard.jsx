import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/dashboard').then(r => setStats(r.data)); }, []);

  if (!stats) return <p style={{padding:'2rem'}}>Loading...</p>;

  const cards = [
    { label: 'Month Sales', value: '₹' + Number(stats.monthSales).toLocaleString('en-IN'), color: '#4f46e5' },
    { label: 'Outstanding', value: '₹' + Number(stats.outstanding).toLocaleString('en-IN'), color: '#ef4444' },
    { label: 'Customers', value: stats.totalCustomers, color: '#10b981' },
    { label: 'Vendors', value: stats.totalVendors || 0, color: '#8b5cf6' },
    { label: 'Products', value: stats.totalProducts, color: '#f59e0b' },
    { label: 'Unpaid Invoices', value: stats.unpaidInvoices, color: '#6366f1' },
    { label: 'Low Stock Items', value: stats.lowStockCount, color: '#ec4899' },
    { label: 'Month Purchases', value: '₹' + Number(stats.monthPurchases || 0).toLocaleString('en-IN'), color: '#0ea5e9' },
    { label: 'Total Payable', value: '₹' + Number(stats.totalPayable || 0).toLocaleString('en-IN'), color: '#dc2626' },
  ];

  return (
    <div>
      <h2 style={styles.title}>Dashboard</h2>
      <div style={styles.grid}>
        {cards.map(c => (
          <div key={c.label} style={{...styles.card, borderTop:`4px solid ${c.color}`}}>
            <p style={styles.cardLabel}>{c.label}</p>
            <p style={{...styles.cardVal, color: c.color}}>{c.value}</p>
          </div>
        ))}
      </div>
      <h3 style={styles.title}>Recent Invoices</h3>
      <table style={styles.table}>
        <thead><tr style={styles.thead}>
          <th>Invoice #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th>
        </tr></thead>
        <tbody>
          {stats.recentInvoices.map(inv => (
            <tr key={inv.id} style={styles.tr}>
              <td style={styles.td}>{inv.invoiceNumber}</td>
              <td style={styles.td}>{inv.customer?.name || '-'}</td>
              <td style={styles.td}>₹{Number(inv.totalAmount).toLocaleString('en-IN')}</td>
              <td style={styles.td}><span style={{...styles.badge, background: statusColor(inv.paymentStatus)}}>{inv.paymentStatus}</span></td>
              <td style={styles.td}>{inv.invoiceDate}</td>
            </tr>
          ))}
          {stats.recentInvoices.length === 0 && <tr><td colSpan={5} style={{...styles.td, textAlign:'center', color:'#999'}}>No invoices yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const statusColor = s => ({ PAID:'#10b981', UNPAID:'#ef4444', PARTIAL:'#f59e0b', OVERDUE:'#dc2626' }[s] || '#999');

const styles = {
  title: { marginBottom:'1rem', color:'#1e293b' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem', marginBottom:'2rem' },
  card: { background:'#fff', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 2px 8px #0001' },
  cardLabel: { margin:0, color:'#64748b', fontSize:'0.85rem' },
  cardVal: { margin:'0.5rem 0 0', fontSize:'1.6rem', fontWeight:700 },
  table: { width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 8px #0001' },
  thead: { background:'#f8fafc' },
  tr: { borderBottom:'1px solid #f1f5f9' },
  td: { padding:'0.75rem 1rem', fontSize:'0.9rem' },
  badge: { color:'#fff', padding:'2px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:600 },
};
