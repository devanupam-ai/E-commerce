
import { useState, useEffect } from 'react';
import { notificationAPI } from '../api';

const CATEGORY_ICONS = {
  PAYMENT: '💰', STOCK: '📦', FESTIVAL: '🎉', SYSTEM: '⚙️', INSIGHT: '🤖', ORDER: '📋'
};

const CATEGORY_COLORS = {
  PAYMENT: '#F59E0B', STOCK: '#3B82F6', FESTIVAL: '#8B5CF6', SYSTEM: '#6B7280', INSIGHT: '#10B981', ORDER: '#6C3CE1'
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount()
      ]);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(countRes.data.count || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const togglePin = async (id) => {
    try {
      await notificationAPI.togglePin(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    } catch (e) {}
  };

  const clearRead = async () => {
    try {
      await notificationAPI.clearRead();
      setNotifications(notifications.filter(n => !n.isRead));
    } catch (e) {}
  };

  const filtered = filter === 'ALL' ? notifications : notifications.filter(n => n.category === filter);
  const pinned = filtered.filter(n => n.isPinned);
  const unpinned = filtered.filter(n => !n.isPinned);
  const sorted = [...pinned, ...unpinned];

  const categories = ['ALL', ...new Set(notifications.map(n => n.category))];

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🔔 Notification Center</h2>
          {unreadCount > 0 && (
            <span style={{ background: '#DC2626', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={loadNotifications}>🔄</button>
          {unreadCount > 0 && <button className="btn-primary" style={{ fontSize: 12 }} onClick={markAllRead}>✅ Mark All Read</button>}
          <button className="btn-secondary" style={{ fontSize: 12 }} onClick={clearRead}>🗑️ Clear Read</button>
        </div>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: filter === cat ? '#6C3CE1' : '#F3F4F6', color: filter === cat ? '#fff' : '#374151' }}>
            {cat !== 'ALL' && CATEGORY_ICONS[cat]} {cat === 'ALL' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading notifications...</div>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔕</div>
          <div style={{ fontWeight: 700 }}>No Notifications</div>
          <div style={{ color: '#6B7280', marginTop: 4 }}>You're all caught up!</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {sorted.map((n, i) => (
            <div key={n.id}
              className={`notif-item ${!n.isRead ? 'unread' : ''} animate-slideIn`}
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => !n.isRead && markRead(n.id)}>
              {/* Icon */}
              <div style={{ width: 40, height: 40, borderRadius: 10, background: (CATEGORY_COLORS[n.category] || '#6B7280') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {CATEGORY_ICONS[n.category] || n.icon || '🔔'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 14 }}>{n.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {n.isPinned && <span style={{ fontSize: 12 }}>📌</span>}
                    {n.priority >= 2 && <span style={{ fontSize: 10, background: '#DC2626', color: '#fff', padding: '1px 6px', borderRadius: 8 }}>URGENT</span>}
                    <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.message}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={(e) => { e.stopPropagation(); togglePin(n.id); }}
                  style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: n.isPinned ? '#FEF3C7' : '#F3F4F6', cursor: 'pointer', fontSize: 12 }}>
                  {n.isPinned ? '📌' : '📍'}
                </button>
                {!n.isRead && (
                  <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#D1FAE5', cursor: 'pointer', fontSize: 12 }}>
                    ✅
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
