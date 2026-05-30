
import { useState, useEffect } from 'react';
import { dashboardBuilderAPI } from '../api';

const AVAILABLE_WIDGETS = [
  { id: 'revenue', title: '💰 Revenue Overview', type: 'stat', color: '#10B981' },
  { id: 'orders', title: '📦 Orders Summary', type: 'stat', color: '#3B82F6' },
  { id: 'customers', title: '👥 Customers', type: 'stat', color: '#8B5CF6' },
  { id: 'products', title: '🏪 Products', type: 'stat', color: '#F59E0B' },
  { id: 'recent-orders', title: '📋 Recent Orders', type: 'list', color: '#3B82F6' },
  { id: 'top-products', title: '🏆 Top Products', type: 'list', color: '#10B981' },
  { id: 'sales-chart', title: '📊 Sales Chart', type: 'chart', color: '#8B5CF6' },
  { id: 'low-stock', title: '⚠️ Low Stock Alerts', type: 'alert', color: '#DC2626' },
  { id: 'quick-actions', title: '⚡ Quick Actions', type: 'actions', color: '#6366F1' },
  { id: 'delivery-status', title: '🚚 Delivery Status', type: 'progress', color: '#0EA5E9' },
];

export default function DragDropDashboard() {
  const [activeWidgets, setActiveWidgets] = useState(['revenue', 'orders', 'customers', 'products', 'recent-orders', 'sales-chart', 'quick-actions']);
  const [draggedItem, setDraggedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadLayout(); }, []);

  const loadLayout = async () => {
    try {
      const res = await dashboardBuilderAPI.getLayout();
      if (res.data.layout) {
        const layout = typeof res.data.layout === 'string' ? JSON.parse(res.data.layout) : res.data.layout;
        if (Array.isArray(layout) && layout.length > 0) setActiveWidgets(layout);
      }
    } catch (e) { console.error(e); }
  };

  const saveLayout = async () => {
    setSaving(true);
    try {
      await dashboardBuilderAPI.saveLayout(activeWidgets);
      alert('✅ Dashboard layout saved!');
    } catch (e) { alert('Failed to save layout'); }
    setSaving(false);
  };

  const resetLayout = () => {
    setActiveWidgets(['revenue', 'orders', 'customers', 'products', 'recent-orders', 'sales-chart', 'quick-actions']);
  };

  const addWidget = (id) => {
    if (!activeWidgets.includes(id)) setActiveWidgets([...activeWidgets, id]);
  };

  const removeWidget = (id) => {
    setActiveWidgets(activeWidgets.filter(w => w !== id));
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    const newWidgets = [...activeWidgets];
    const dragged = newWidgets.splice(draggedItem, 1)[0];
    newWidgets.splice(index, 0, dragged);
    setActiveWidgets(newWidgets);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const renderWidget = (widgetId) => {
    const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return null;

    const demoData = {
      revenue: { main: '₹4,85,200', sub: '+12.5% vs last month', trend: 'up' },
      orders: { main: '342', sub: '28 pending', trend: 'up' },
      customers: { main: '1,847', sub: '+86 this month', trend: 'up' },
      products: { main: '156', sub: '8 low stock', trend: 'neutral' },
    };

    if (widget.type === 'stat') {
      const d = demoData[widget.id] || { main: '—', sub: '', trend: 'neutral' };
      return (
        <div className="card" style={{ padding: 20, borderLeft: `4px solid ${widget.color}`, position: 'relative', cursor: 'grab' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>{widget.title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: widget.color }}>{d.main}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{d.sub}</div>
        </div>
      );
    }

    if (widget.type === 'list') {
      const items = widget.id === 'recent-orders' ? [
        { text: 'ORD-12345 • ₹1,299', badge: 'DELIVERED', badgeColor: '#10B981' },
        { text: 'ORD-12346 • ₹2,499', badge: 'PENDING', badgeColor: '#F59E0B' },
        { text: 'ORD-12347 • ₹899', badge: 'SHIPPED', badgeColor: '#3B82F6' },
        { text: 'ORD-12348 • ₹3,199', badge: 'PLACED', badgeColor: '#6B7280' },
      ] : [
        { text: 'Wireless Earbuds', badge: '142 sold', badgeColor: '#10B981' },
        { text: 'Cotton Kurta Set', badge: '98 sold', badgeColor: '#3B82F6' },
        { text: 'Running Shoes', badge: '87 sold', badgeColor: '#8B5CF6' },
        { text: 'Smart Watch', badge: '76 sold', badgeColor: '#F59E0B' },
      ];
      return (
        <div className="card" style={{ padding: 20, position: 'relative', cursor: 'grab' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{widget.title}</div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
              <span>{item.text}</span>
              <span style={{ padding: '1px 8px', borderRadius: 10, background: item.badgeColor + '20', color: item.badgeColor, fontSize: 10, fontWeight: 700 }}>{item.badge}</span>
            </div>
          ))}
        </div>
      );
    }

    if (widget.type === 'chart') {
      const bars = [40, 65, 50, 80, 55, 90, 70, 85, 60, 95, 75, 88];
      return (
        <div className="card" style={{ padding: 20, position: 'relative', cursor: 'grab' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{widget.title}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: `linear-gradient(180deg, ${widget.color}, ${widget.color}88)`, borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }}></div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9CA3AF', marginTop: 4 }}>
            <span>Jan</span><span>Jun</span><span>Dec</span>
          </div>
        </div>
      );
    }

    if (widget.type === 'alert') {
      return (
        <div className="card" style={{ padding: 20, borderLeft: '4px solid #DC2626', position: 'relative', cursor: 'grab' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{widget.title}</div>
          {['Bluetooth Speaker - 3 left', 'Yoga Mat - 5 left', 'Laptop Stand - 2 left'].map((a, i) => (
            <div key={i} style={{ padding: '6px 0', fontSize: 13, color: '#DC2626', borderBottom: '1px solid #FEE2E2' }}>⚠️ {a}</div>
          ))}
        </div>
      );
    }

    if (widget.type === 'actions') {
      return (
        <div className="card" style={{ padding: 20, position: 'relative', cursor: 'grab' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{widget.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['📦 New Order', '🏪 Add Product', '🎟️ Create Coupon', '📊 View Reports'].map((a, i) => (
              <button key={i} style={{ padding: '10px 8px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                {a}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (widget.type === 'progress') {
      return (
        <div className="card" style={{ padding: 20, position: 'relative', cursor: 'grab' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{widget.title}</div>
          {[
            { label: 'Out for Delivery', pct: 65, color: '#3B82F6' },
            { label: 'Delivered Today', pct: 85, color: '#10B981' },
            { label: 'Pending Pickup', pct: 30, color: '#F59E0B' },
          ].map((d, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{d.label}</span><span style={{ fontWeight: 700 }}>{d.pct}%</span>
              </div>
              <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${d.pct}%`, background: d.color, borderRadius: 4, transition: 'width 0.5s' }}></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const inactiveWidgets = AVAILABLE_WIDGETS.filter(w => !activeWidgets.includes(w.id));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🔧 Drag & Drop Dashboard</h2>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Customize your dashboard layout by dragging widgets</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={resetLayout} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>🔄 Reset</button>
          <button onClick={saveLayout} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {saving ? '⏳ Saving...' : '💾 Save Layout'}
          </button>
        </div>
      </div>

      {/* Widget Palette */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🧩 Available Widgets</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {AVAILABLE_WIDGETS.map(w => {
            const isActive = activeWidgets.includes(w.id);
            return (
              <button key={w.id} onClick={() => isActive ? removeWidget(w.id) : addWidget(w.id)}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: isActive ? `2px solid ${w.color}` : '1px solid #E5E7EB',
                  background: isActive ? w.color + '15' : '#fff',
                  cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 400,
                  color: isActive ? w.color : '#6B7280',
                  textDecoration: isActive ? 'none' : 'none',
                }}>
                {isActive ? '✅' : '➕'} {w.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Dashboard Grid */}
      <div style={{ marginBottom: 16, fontSize: 13, color: '#6B7280' }}>
        👆 Drag widgets to reorder • Click ✕ on widget to remove • {activeWidgets.length} widgets active
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {activeWidgets.map((widgetId, index) => {
          const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
          return (
            <div key={widgetId}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                position: 'relative',
                opacity: draggedItem === index ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}>
              <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#9CA3AF', cursor: 'grab' }}>⋮⋮</span>
                <button onClick={() => removeWidget(widgetId)}
                  style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
              {renderWidget(widgetId)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
