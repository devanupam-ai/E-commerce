
import { useState, useEffect } from 'react';
import './index.css';
import { themeAPI, notificationAPI } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Inventory from './pages/Inventory';
import OfflineBills from './pages/OfflineBills';
import Analytics from './pages/Analytics';
import DeliveryBoys from './pages/DeliveryBoys';
import Coupons from './pages/Coupons';
import ThemeSettings from './pages/ThemeSettings';
import DashboardBuilder from './pages/DashboardBuilder';
import HeatmapCalendar from './pages/HeatmapCalendar';
import AIInsights from './pages/AIInsights';
import InventoryAlerts from './pages/InventoryAlerts';
import CashFlowTimeline from './pages/CashFlowTimeline';
import ExpenseScanner from './pages/ExpenseScanner';
import NotificationCenter from './pages/NotificationCenter';
import BusinessCard from './pages/BusinessCard';
import SalesForecast from './pages/SalesForecast';
import AIDescriptionGenerator from './pages/AIDescriptionGenerator';
import ReturnsRefunds from './pages/ReturnsRefunds';
import PromoCodeManager from './pages/PromoCodeManager';
import ProfitLoss from './pages/ProfitLoss';
import DragDropDashboard from './pages/DragDropDashboard';

const NAV = [
  { key: 'dashboard', label: '📊 Dashboard', group: 'main' },
  { key: 'orders', label: '📦 Orders', group: 'main' },
  { key: 'inventory', label: '🏪 Inventory', group: 'main' },
  { key: 'offline-bills', label: '🧾 Offline Billing', group: 'main' },
  { key: 'analytics', label: '💹 Analytics', group: 'main' },
  { key: 'delivery-boys', label: '👥 Delivery Boys', group: 'main' },
  { key: 'coupons', label: '🎟️ Coupons', group: 'main' },
  { key: '_divider1', label: '── ✨ New Features ──', group: 'divider' },
  { key: 'ai-insights', label: '🤖 AI Insights', group: 'new', badge: 'NEW' },
  { key: 'heatmap', label: '🗓️ Sales Heatmap', group: 'new', badge: 'NEW' },
  { key: 'cash-flow', label: '💰 Cash Flow', group: 'new', badge: 'NEW' },
  { key: 'inventory-alerts', label: '📦 Smart Alerts', group: 'new', badge: 'NEW' },
  { key: 'expense-scanner', label: '🧾 Receipt Scanner', group: 'new', badge: 'NEW' },
  { key: 'notifications', label: '🔔 Notifications', group: 'new' },
  { key: '_divider2', label: '── 🚀 Power Features ──', group: 'divider' },
  { key: 'sales-forecast', label: '📊 Sales Forecast', group: 'power', badge: 'NEW' },
  { key: 'ai-description', label: '🤖 AI Description', group: 'power', badge: 'NEW' },
  { key: 'returns', label: '🔄 Returns & Refunds', group: 'power', badge: 'NEW' },
  { key: 'promo-codes', label: '🎟️ Promo Codes', group: 'power', badge: 'NEW' },
  { key: 'profit-loss', label: '💰 Profit & Loss', group: 'power', badge: 'NEW' },
  { key: 'drag-dashboard', label: '🔧 Drag Dashboard', group: 'power', badge: 'NEW' },
  { key: '_divider3', label: '── ⚙️ Settings ──', group: 'divider' },
  { key: 'dashboard-builder', label: '🔧 Dashboard Builder', group: 'settings' },
  { key: 'theme', label: '🎨 Theme & Appearance', group: 'settings' },
  { key: 'business-card', label: '🪪 Business Card', group: 'settings', badge: 'NEW' },
];

export default function App() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('adminUser');
    return u ? JSON.parse(u) : null;
  });
  const [page, setPage] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#6C3CE1');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      loadTheme();
      loadUnreadCount();
      const t = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(t);
    }
  }, [user]);

  const loadTheme = async () => {
    try {
      const res = await themeAPI.get();
      const t = res.data;
      if (t.themeMode === 'DARK') {
        document.body.classList.add('dark');
        setDarkMode(true);
      }
      if (t.primaryColor) setPrimaryColor(t.primaryColor);
      if (t.sidebarStyle === 'COMPACT') setSidebarCollapsed(true);
    } catch (e) {}
  };

  const loadUnreadCount = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadNotifs(res.data.count || 0);
    } catch (e) {}
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.body.classList.toggle('dark', newMode);
    themeAPI.update({ themeMode: newMode ? 'DARK' : 'LIGHT' }).catch(() => {});
  };

  const navigate = (p, order = null) => {
    setSelectedOrder(order);
    setPage(p);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    document.body.classList.remove('dark');
    setUser(null);
  };

  if (!user) return <Login onLogin={setUser} />;

  const sidebarWidth = sidebarCollapsed ? 64 : 220;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarWidth, background: `linear-gradient(180deg, ${primaryColor}, #1E1B4B)`,
        color: '#fff', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, overflowY: 'auto',
        transition: 'width 0.3s', zIndex: 50
      }}>
        {/* Header */}
        <div style={{ padding: sidebarCollapsed ? '16px 8px' : '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          {!sidebarCollapsed && (
            <>
              <div style={{ fontSize: 28 }}>⚙️</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>Admin Panel</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{user.name}</div>
            </>
          )}
          {sidebarCollapsed && <div style={{ fontSize: 24, textAlign: 'center' }}>⚙️</div>}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV.map(n => {
            if (n.group === 'divider') {
              return sidebarCollapsed ? null : (
                <div key={n.key} style={{ padding: '12px 20px 4px', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1 }}>
                  {n.label}
                </div>
              );
            }
            return (
              <button key={n.key} onClick={() => navigate(n.key)} title={sidebarCollapsed ? n.label.replace(/[^\w\s]/gi, '').trim() : undefined}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
                  padding: sidebarCollapsed ? '10px 0' : '10px 20px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  background: page === n.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: page === n.key ? '#fff' : 'rgba(255,255,255,0.7)',
                  border: 'none', cursor: 'pointer', fontSize: 13,
                  fontWeight: page === n.key ? 700 : 400,
                  borderLeft: page === n.key ? '3px solid #fff' : '3px solid transparent',
                  position: 'relative',
                }}>
                <span style={{ marginRight: sidebarCollapsed ? 0 : 8, fontSize: 16 }}>
                  {n.label.split(' ')[0]}
                </span>
                {!sidebarCollapsed && <span>{n.label.split(' ').slice(1).join(' ')}</span>}
                {n.badge && !sidebarCollapsed && (
                  <span style={{ marginLeft: 'auto', padding: '1px 6px', borderRadius: 8, background: '#F59E0B', color: '#000', fontSize: 9, fontWeight: 800 }}>
                    {n.badge}
                  </span>
                )}
                {n.key === 'notifications' && unreadNotifs > 0 && (
                  <span className="notif-badge" style={{ position: sidebarCollapsed ? 'absolute' : 'relative', top: sidebarCollapsed ? -8 : -2, right: sidebarCollapsed ? 4 : -4 }}>
                    {unreadNotifs}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {/* Dark Mode Toggle */}
          <button onClick={toggleDarkMode}
            style={{ width: '100%', padding: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 8, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {darkMode ? '☀️' : '🌙'} {!sidebarCollapsed && (darkMode ? 'Light Mode' : 'Dark Mode')}
          </button>
          {/* Collapse Toggle */}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ width: '100%', padding: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 8, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {sidebarCollapsed ? '→' : '←'} {!sidebarCollapsed && 'Collapse'}
          </button>
          {/* Logout */}
          <button onClick={logout}
            style={{ width: '100%', padding: 8, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'center', gap: 6 }}>
            🚪 {!sidebarCollapsed && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarWidth, padding: 28, overflowY: 'auto', minHeight: '100vh', transition: 'margin-left 0.3s' }}>
        {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {page === 'orders' && <Orders onNavigate={navigate} />}
        {page === 'order-detail' && selectedOrder && (
          <OrderDetail order={selectedOrder} onBack={() => navigate('orders')} />
        )}
        {page === 'inventory' && <Inventory />}
        {page === 'offline-bills' && <OfflineBills />}
        {page === 'analytics' && <Analytics />}
        {page === 'delivery-boys' && <DeliveryBoys />}
        {page === 'coupons' && <Coupons />}
        {page === 'theme' && <ThemeSettings onThemeChange={(t) => {
          if (t.primaryColor) setPrimaryColor(t.primaryColor);
        }} />}
        {page === 'dashboard-builder' && <DashboardBuilder />}
        {page === 'heatmap' && <HeatmapCalendar />}
        {page === 'ai-insights' && <AIInsights />}
        {page === 'inventory-alerts' && <InventoryAlerts />}
        {page === 'cash-flow' && <CashFlowTimeline />}
        {page === 'expense-scanner' && <ExpenseScanner />}
        {page === 'notifications' && <NotificationCenter />}
        {page === 'business-card' && <BusinessCard />}
        {page === 'sales-forecast' && <SalesForecast />}
        {page === 'ai-description' && <AIDescriptionGenerator />}
        {page === 'returns' && <ReturnsRefunds />}
        {page === 'promo-codes' && <PromoCodeManager />}
        {page === 'profit-loss' && <ProfitLoss />}
        {page === 'drag-dashboard' && <DragDropDashboard />}
      </div>
    </div>
  );
}
