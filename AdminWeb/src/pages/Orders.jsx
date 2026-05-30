import { useState, useEffect } from 'react';
import { orderAPI } from '../api';

const FILTERS = ['ALL', 'PLACED', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function Orders({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getAll().then(res => { setOrders(res.data); setLoading(false); });
  }, []);

  const filtered = orders
    .filter(o => filter === 'ALL' || o.orderStatus === filter)
    .filter(o => !search || o.orderNumber?.includes(search) || o.customer?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>All Orders ({filtered.length})</h2>
        <button className="btn-secondary" onClick={() => orderAPI.getAll().then(r => setOrders(r.data))}>🔄 Refresh</button>
      </div>

      {orders.filter(o => o.orderStatus === 'PLACED').length > 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ <strong>{orders.filter(o => o.orderStatus === 'PLACED').length} new order(s)</strong> waiting for your confirmation</span>
          <button onClick={() => setFilter('PLACED')} style={{ padding: '4px 12px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>View →</button>
        </div>
      )}

      <input
        placeholder="Search by order # or customer name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16, outline: 'none' }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: filter === f ? '#6C3CE1' : '#E5E7EB',
              color: filter === f ? '#fff' : '#374151',
            }}>
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#6B7280' }}>Loading...</p> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #F3F4F6', textAlign: 'left' }}>
                {['Order #', 'Customer', 'Items', 'Payment', 'Amount', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6', background: o.orderStatus === 'PLACED' ? '#FFFBEB' : 'white' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>#{o.orderNumber}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{o.customer?.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{o.customer?.phone}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6B7280' }}>{o.items?.length || 0} items</td>
                  <td style={{ padding: '14px 16px', fontSize: 12 }}>{o.paymentType}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#6C3CE1' }}>₹{o.totalAmount}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge status-${o.orderStatus}`}>{o.orderStatus?.replace(/_/g, ' ')}</span>
                    {!o.deliveryBoy && o.orderStatus === 'PLACED' && (
                      <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>⚠️ Needs confirmation</div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#6B7280' }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={() => onNavigate('order-detail', o)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>No orders found</p>
          )}
        </div>
      )}
    </div>
  );
}
