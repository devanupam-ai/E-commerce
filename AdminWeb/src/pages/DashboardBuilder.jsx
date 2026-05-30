
import { useState, useEffect, useRef } from 'react';
import { dashboardBuilderAPI } from '../api';

const DEFAULT_WIDGETS = [
  { id: 'stats', title: '📊 Stats Cards', visible: true, order: 0, size: 'full' },
  { id: 'recent-orders', title: '📦 Recent Orders', visible: true, order: 1, size: 'full' },
  { id: 'low-stock', title: '⚠️ Low Stock Alert', visible: true, order: 2, size: 'half' },
  { id: 'health-score', title: '💚 Health Score', visible: true, order: 3, size: 'half' },
  { id: 'cash-flow', title: '💰 Cash Flow Summary', visible: true, order: 4, size: 'half' },
  { id: 'top-products', title: '🏆 Top Products', visible: true, order: 5, size: 'half' },
  { id: 'ai-insights', title: '🤖 AI Insights', visible: true, order: 6, size: 'full' },
  { id: 'heatmap', title: '🗓️ Sales Heatmap', visible: true, order: 7, size: 'full' },
  { id: 'notifications', title: '🔔 Recent Notifications', visible: true, order: 8, size: 'half' },
  { id: 'quick-actions', title: '⚡ Quick Actions', visible: true, order: 9, size: 'half' },
];

export default function DashboardBuilder({ onApply }) {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadLayout(); }, []);

  const loadLayout = async () => {
    try {
      const res = await dashboardBuilderAPI.getLayout();
      if (res.data.layout && res.data.layout !== 'DEFAULT') {
        const saved = JSON.parse(res.data.layout);
        // Merge with defaults to handle new widgets
        const merged = DEFAULT_WIDGETS.map(dw => {
          const sw = saved.find(s => s.id === dw.id);
          return sw ? { ...dw, ...sw } : dw;
        });
        setWidgets(merged.sort((a, b) => a.order - b.order));
      }
    } catch (e) { console.error(e); }
  };

  const saveLayout = async () => {
    setSaving(true);
    try {
      await dashboardBuilderAPI.saveLayout(JSON.stringify(widgets));
      alert('✅ Dashboard layout saved!');
      if (onApply) onApply(widgets);
    } catch (e) { alert('Failed to save layout'); }
    setSaving(false);
  };

  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  const toggleWidget = (id) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const changeSize = (id, size) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, size } : w));
  };

  const onDragStart = (idx) => { setDragIdx(idx); };

  const onDragOver = (e, idx) => { e.preventDefault(); setOverIdx(idx); };

  const onDrop = (idx) => {
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...widgets];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    const reordered = updated.map((w, i) => ({ ...w, order: i }));
    setWidgets(reordered);
    setDragIdx(null);
    setOverIdx(null);
  };

  const onDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🔧 Dashboard Builder</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={resetLayout}>↩️ Reset</button>
          <button className="btn-primary" onClick={saveLayout} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Layout'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <p style={{ fontSize: 13, color: '#6B7280' }}>
          🖱️ Drag & drop to reorder widgets. Toggle visibility and change sizes. Click Save to apply.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {widgets.map((w, idx) => (
          <div key={w.id}
            className={`widget-card ${dragIdx === idx ? 'dragging' : ''} ${overIdx === idx ? 'drag-over' : ''}`}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDrop={() => onDrop(idx)}
            onDragEnd={onDragEnd}
            style={{ display: 'flex', alignItems: 'center', gap: 16, background: w.visible ? '#fff' : '#F9FAFB', opacity: w.visible ? 1 : 0.5 }}>

            {/* Drag Handle */}
            <div style={{ cursor: 'grab', fontSize: 18, color: '#9CA3AF' }}>⠿</div>

            {/* Order Number */}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6C3CE1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {idx + 1}
            </div>

            {/* Widget Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{w.title}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>ID: {w.id}</div>
            </div>

            {/* Size Selector */}
            <select value={w.size} onChange={(e) => changeSize(w.id, e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12 }}>
              <option value="full">Full Width</option>
              <option value="half">Half Width</option>
              <option value="third">1/3 Width</option>
            </select>

            {/* Visibility Toggle */}
            <div onClick={() => toggleWidget(w.id)}
              style={{ width: 44, height: 24, borderRadius: 12, background: w.visible ? '#10B981' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: w.visible ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Preview Grid */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>👁️ Layout Preview</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {widgets.filter(w => w.visible).map(w => (
            <div key={w.id} style={{
              flex: w.size === 'full' ? '1 1 100%' : w.size === 'third' ? '1 1 30%' : '1 1 45%',
              background: '#F3F4F6', borderRadius: 8, padding: 12, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6B7280'
            }}>
              {w.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
