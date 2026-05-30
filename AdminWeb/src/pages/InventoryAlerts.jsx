
import { useState, useEffect } from 'react';
import { inventoryAlertAPI } from '../api';

const ALERT_ICONS = {
  LOW_STOCK: '🟡', OUT_OF_STOCK: '🔴', OVERSTOCK: '🔵',
  EXPIRY_WARNING: '⚠️', DEAD_STOCK: '💀', REORDER_SUGGESTION: '📋'
};

const ALERT_COLORS = {
  LOW_STOCK: '#F59E0B', OUT_OF_STOCK: '#DC2626', OVERSTOCK: '#3B82F6',
  EXPIRY_WARNING: '#EA580C', DEAD_STOCK: '#6B7280', REORDER_SUGGESTION: '#8B5CF6'
};

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await inventoryAlertAPI.getAll();
      setAlerts(res.data.alerts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const resolveAlert = async (id) => {
    try {
      await inventoryAlertAPI.resolve(id);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (e) { alert('Failed to resolve alert'); }
  };

  const resolveAll = async () => {
    if (!confirm('Resolve all alerts?')) return;
    for (const a of alerts) {
      try { await inventoryAlertAPI.resolve(a.id); } catch (e) {}
    }
    setAlerts([]);
  };

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.alertType === filter);
  const alertCounts = {};
  alerts.forEach(a => { alertCounts[a.alertType] = (alertCounts[a.alertType] || 0) + 1; });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📦 Smart Inventory Alerts</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={loadAlerts}>🔄 Refresh</button>
          {alerts.length > 0 && (
            <button className="btn-danger" onClick={resolveAll}>✅ Resolve All</button>
          )}
        </div>
      </div>

      {/* Alert Type Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div onClick={() => setFilter('ALL')}
          className="card" style={{ flex: 1, minWidth: 100, cursor: 'pointer', borderLeft: `4px solid #6C3CE1`, background: filter === 'ALL' ? '#F5F3FF' : undefined }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{alerts.length}</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>All Alerts</div>
        </div>
        {Object.entries(ALERT_ICONS).map(([type, icon]) => (
          <div key={type} onClick={() => setFilter(type)}
            className="card" style={{ flex: 1, minWidth: 100, cursor: 'pointer', borderLeft: `4px solid ${ALERT_COLORS[type]}`, background: filter === type ? '#F5F3FF' : undefined }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{alertCounts[type] || 0}</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>{icon} {type.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading alerts...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>All Clear!</div>
          <div style={{ color: '#6B7280', marginTop: 4 }}>No {filter === 'ALL' ? '' : filter.replace('_', ' ') + ' '}alerts right now</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((a, i) => (
            <div key={a.id} className="card animate-slideIn" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
              <div style={{ fontSize: 28 }}>{ALERT_ICONS[a.alertType] || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{a.productName}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, background: ALERT_COLORS[a.alertType] + '20', color: ALERT_COLORS[a.alertType], fontSize: 10, fontWeight: 700 }}>
                    {a.alertType.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{a.message}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                  Current: {a.currentValue} | Threshold: {a.thresholdValue}
                </div>
              </div>
              <button className="btn-success" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => resolveAlert(a.id)}>
                ✅ Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
