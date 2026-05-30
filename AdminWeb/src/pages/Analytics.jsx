import { useState, useEffect } from 'react';
import { orderAPI, adminAPI } from '../api';

export default function Analytics() {
  const [orders, setOrders] = useState([]);
  const [timeframe, setTimeframe] = useState('7days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    try {
      const res = await orderAPI.getAll();
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const filterByTimeframe = () => {
    const now = new Date();
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      if (timeframe === '7days') return now - orderDate <= 7 * 24 * 60 * 60 * 1000;
      if (timeframe === '30days') return now - orderDate <= 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  };

  const filtered = filterByTimeframe();
  const totalRevenue = filtered.filter(o => o.paymentStatus === 'SUCCESS')
    .reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
  const avgOrderValue = filtered.length > 0 ? (totalRevenue / filtered.length).toFixed(2) : 0;
  const completionRate = filtered.length > 0
    ? ((filtered.filter(o => o.orderStatus === 'DELIVERED').length / filtered.length) * 100).toFixed(1)
    : 0;

  const chartData = {};
  filtered.forEach(o => {
    const date = new Date(o.createdAt).toLocaleDateString();
    if (!chartData[date]) chartData[date] = { orders: 0, revenue: 0 };
    chartData[date].orders++;
    if (o.paymentStatus === 'SUCCESS') {
      chartData[date].revenue += parseFloat(o.totalAmount || 0);
    }
  });

  const dates = Object.keys(chartData).sort((a, b) => new Date(a) - new Date(b));
  const maxRevenue = Math.max(...dates.map(d => chartData[d].revenue), 1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>💹 Sales Analytics</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['7days', '30days', 'alltime'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '8px 16px',
                background: timeframe === tf ? '#6C3CE1' : '#E5E7EB',
                color: timeframe === tf ? '#fff' : '#374151',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}>
              {tf === '7days' ? 'Last 7 Days' : tf === '30days' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#6C3CE1' }}>₹{totalRevenue.toFixed(0)}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>In {filtered.length} orders</div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Avg Order Value</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>₹{avgOrderValue}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Per order</div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Completion Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563EB' }}>{completionRate}%</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>of orders delivered</div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Total Orders</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F59E0B' }}>{filtered.length}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>in selected period</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Revenue Trend</h3>
        <div style={{ height: 250, display: 'flex', alignItems: 'flex-end', gap: 4, justifyContent: 'space-around' }}>
          {dates.length > 0 ? dates.map(date => (
            <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  width: '100%',
                  height: (chartData[date].revenue / maxRevenue) * 200,
                  background: '#6C3CE1',
                  borderRadius: '4px 4px 0 0',
                  minHeight: 2,
                }}
              />
              <div style={{ fontSize: 10, marginTop: 8, color: '#6B7280', textAlign: 'center' }}>
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          )) : <p style={{ color: '#9CA3AF' }}>No data available</p>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Order Status Breakdown</h3>
        <table style={{ width: '100%' }}>
          <tbody>
            {[
              { status: 'DELIVERED', color: '#10B981', count: filtered.filter(o => o.orderStatus === 'DELIVERED').length },
              { status: 'OUT_FOR_DELIVERY', color: '#06B6D4', count: filtered.filter(o => o.orderStatus === 'OUT_FOR_DELIVERY').length },
              { status: 'ASSIGNED', color: '#7C3AED', count: filtered.filter(o => o.orderStatus === 'ASSIGNED').length },
              { status: 'PLACED', color: '#D97706', count: filtered.filter(o => o.orderStatus === 'PLACED').length },
              { status: 'CANCELLED', color: '#DC2626', count: filtered.filter(o => o.orderStatus === 'CANCELLED').length },
            ].map(item => (
              <tr key={item.status} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '12px' }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: item.color, borderRadius: 3, marginRight: 8 }} />
                  {item.status.replace('_', ' ')}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}