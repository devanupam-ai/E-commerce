
import { useState, useEffect } from 'react';
import { salesForecastAPI } from '../api';

export default function SalesForecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await salesForecastAPI.get();
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}><div className="animate-pulse" style={{ fontSize: 40 }}>📊</div><div style={{ marginTop: 12 }}>Loading forecast...</div></div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 60 }}>Failed to load forecast data</div>;

  const maxRevenue = Math.max(
    ...data.historical.map(h => parseFloat(h.revenue)),
    ...data.forecast.map(f => parseFloat(f.predictedRevenue))
  );

  const barHeight = 200;
  const barWidth = 60;
  const gap = 20;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>📊 Sales Forecasting</h2>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>AI-powered revenue prediction using trend analysis</div>
        </div>
        <button onClick={loadData} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>🔄 Refresh</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>TREND</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: data.trend === 'GROWING' ? '#10B981' : '#DC2626', marginTop: 4 }}>
            {data.trend === 'GROWING' ? '📈 Growing' : '📉 Declining'}
          </div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>AVG MONTHLY GROWTH</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: data.avgMonthlyGrowth >= 0 ? '#10B981' : '#DC2626' }}>
            {data.avgMonthlyGrowth >= 0 ? '+' : ''}{data.avgMonthlyGrowth}%
          </div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>NEXT MONTH PREDICTION</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
            ₹{parseFloat(data.nextMonthPrediction.predictedRevenue).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
            {data.nextMonthPrediction.growthRate >= 0 ? '+' : ''}{data.nextMonthPrediction.growthRate}% vs last month
          </div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>TOTAL HISTORICAL</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
            ₹{parseFloat(data.totalHistoricalRevenue).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Revenue Trend & Forecast</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: gap, padding: '0 20px', overflowX: 'auto' }}>
          {data.historical.map((h, i) => {
            const height = (parseFloat(h.revenue) / maxRevenue) * barHeight;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: barWidth }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  ₹{(parseFloat(h.revenue) / 1000).toFixed(0)}K
                </div>
                <div style={{
                  width: barWidth, height: height, background: 'linear-gradient(180deg, #3B82F6, #60A5FA)',
                  borderRadius: '8px 8px 0 0', transition: 'height 0.5s', position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#fff', fontWeight: 600 }}>
                    {h.orders} orders
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 6, fontWeight: 600 }}>{h.month}</div>
              </div>
            );
          })}
          {/* Forecast bars */}
          {data.forecast.map((f, i) => {
            const height = (parseFloat(f.predictedRevenue) / maxRevenue) * barHeight;
            return (
              <div key={'f' + i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: barWidth }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8B5CF6', marginBottom: 4 }}>
                  ₹{(parseFloat(f.predictedRevenue) / 1000).toFixed(0)}K
                </div>
                <div style={{
                  width: barWidth, height: height,
                  background: `linear-gradient(180deg, #8B5CF6, #A78BFA)`,
                  borderRadius: '8px 8px 0 0', border: '2px dashed #8B5CF6', opacity: 0.85,
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#fff', fontWeight: 600 }}>
                    ~{f.predictedOrders}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#8B5CF6', marginTop: 6, fontWeight: 600 }}>{f.month}</div>
                <div style={{ fontSize: 9, color: '#9CA3AF' }}>{Math.round(f.confidence * 100)}%</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
            <div style={{ width: 12, height: 12, background: '#3B82F6', borderRadius: 3 }}></div> Historical
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8B5CF6' }}>
            <div style={{ width: 12, height: 12, background: '#8B5CF6', borderRadius: 3, border: '1px dashed #8B5CF6' }}></div> Forecast
          </div>
        </div>
      </div>

      {/* Forecast Details Table */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🔮 Forecast Details</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F3F4F6', textAlign: 'left' }}>
              {['Month', 'Predicted Revenue', 'Predicted Orders', 'Confidence', 'Growth Rate'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.forecast.map((f, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{f.month}</td>
                <td style={{ padding: 12, fontWeight: 700, color: '#8B5CF6' }}>₹{parseFloat(f.predictedRevenue).toLocaleString()}</td>
                <td style={{ padding: 12 }}>~{f.predictedOrders}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, background: f.confidence > 0.85 ? '#10B98120' : '#F59E0B20', color: f.confidence > 0.85 ? '#10B981' : '#F59E0B', fontSize: 11, fontWeight: 700 }}>
                    {Math.round(f.confidence * 100)}%
                  </span>
                </td>
                <td style={{ padding: 12, color: f.growthRate >= 0 ? '#10B981' : '#DC2626', fontWeight: 600 }}>
                  {f.growthRate >= 0 ? '+' : ''}{f.growthRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
