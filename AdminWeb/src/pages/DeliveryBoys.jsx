import { useState, useEffect } from 'react';
import { adminAPI, orderAPI } from '../api';

export default function DeliveryBoys() {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoy, setSelectedBoy] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bRes, oRes] = await Promise.all([
        adminAPI.getDeliveryBoys(),
        orderAPI.getAll(),
      ]);
      setDeliveryBoys(bRes.data || []);
      setOrders(oRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryStats = (boyId) => {
    const boyOrders = orders.filter(o => o.deliveryBoyId === boyId);
    const delivered = boyOrders.filter(o => o.orderStatus === 'DELIVERED').length;
    const active = boyOrders.filter(o => ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length;
    const earnings = boyOrders
      .filter(o => o.orderStatus === 'DELIVERED')
      .reduce((sum, o) => sum + (o.deliveryCharge || 30), 0);

    return { delivered, active, total: boyOrders.length, earnings };
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>👥 Delivery Boys</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        {deliveryBoys.map(boy => {
          const stats = getDeliveryStats(boy.id);
          return (
            <div
              key={boy.id}
              onClick={() => setSelectedBoy(boy.id === selectedBoy ? null : boy.id)}
              className="card"
              style={{ cursor: 'pointer', borderLeft: `4px solid ${boy.id === selectedBoy ? '#6C3CE1' : '#E5E7EB'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{boy.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>📞 {boy.phone}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>📧 {boy.email}</div>
                </div>
                <div style={{ fontSize: 24 }}>🚚</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>Delivered</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>{stats.delivered}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>Active</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>{stats.active}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>Total</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{stats.total}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>Earnings</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#6C3CE1' }}>₹{stats.earnings}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedBoy && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
            {deliveryBoys.find(b => b.id === selectedBoy)?.name} - Order History
          </h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                {['Order #', 'Customer', 'Status', 'Charge', 'Date'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders
                .filter(o => o.deliveryBoyId === selectedBoy)
                .slice(0, 10)
                .map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px' }}>#{o.orderNumber}</td>
                    <td style={{ padding: '12px' }}>{o.customer?.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge status-${o.orderStatus}`}>{o.orderStatus?.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>₹{o.deliveryCharge || 30}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#6B7280' }}>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}