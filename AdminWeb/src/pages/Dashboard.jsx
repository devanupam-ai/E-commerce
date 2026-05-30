import { useState, useEffect } from 'react';
import { orderAPI, adminAPI } from '../api';

const STATUS_COLOR = {
  PLACED: '#D97706', CONFIRMED: '#2563EB', ASSIGNED: '#7C3AED',
  PICKED_UP: '#EA580C', OUT_FOR_DELIVERY: '#0891B2', DELIVERED: '#059669', CANCELLED: '#DC2626',
};

const StatCard = ({ icon, title, value, color }) => (
  <div className="card" style={{ flex: 1, minWidth: 140, borderLeft: `4px solid ${color}` }}>
    <div style={{ fontSize: 28 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{title}</div>
  </div>
);

export default function Dashboard({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState([]);

  const load = async () => {
    try {
      const [ordRes, statsRes] = await Promise.all([orderAPI.getAll(), adminAPI.getStats()]);
      setOrders(ordRes.data);
      setLowStock(statsRes.data.lowStockProducts || []);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const stats = {
    total: orders.length,
    placed: orders.filter(o => o.orderStatus === 'PLACED').length,
    delivering: orders.filter(o => o.orderStatus === 'OUT_FOR_DELIVERY').length,
    delivered: orders.filter(o => o.orderStatus === 'DELIVERED').length,
    revenue: orders.filter(o => o.paymentStatus === 'SUCCESS')
      .reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0).toFixed(0),
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Dashboard</h2>
        <button className="btn-secondary" onClick={load}>🔄 Refresh</button>
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
          <strong>⚠️ Low Stock:</strong> {lowStock.map(p => `${p.name} (${p.stockQuantity})`).join(', ')}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard icon="📋" title="Total Orders" value={stats.total} color="#3B82F6" />
        <StatCard icon="🆕" title="New Orders" value={stats.placed} color="#F59E0B" />
        <StatCard icon="🚚" title="Delivering" value={stats.delivering} color="#06B6D4" />
        <StatCard icon="✅" title="Delivered" value={stats.delivered} color="#10B981" />
        <StatCard icon="💰" title="Revenue" value={`₹${stats.revenue}`} color="#6C3CE1" />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700 }}>Recent Orders</h3>
          <button className="btn-primary" onClick={() => onNavigate('orders')}>View All →</button>
        </div>
        {loading ? <p style={{ color: '#6B7280' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F3F4F6', textAlign: 'left' }}>
                {['Order #', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
                  onClick={() => onNavigate('order-detail', o)}>
                  <td style={{ padding: '12px' }}>#{o.orderNumber}</td>
                  <td style={{ padding: '12px' }}>{o.customer?.name}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#6C3CE1' }}>₹{o.totalAmount}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge status-${o.orderStatus}`}>{o.orderStatus?.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '12px', fontSize: 12, color: '#6B7280' }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
