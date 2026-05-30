
import { useState, useEffect } from 'react';
import { themeAPI } from '../api';

const COLORS = ['#6C3CE1','#3B82F6','#0891B2','#059669','#D97706','#DC2626','#EC4899','#8B5CF6','#1E293B','#0F766E'];
const FONTS = [
  { value: 'DEFAULT', label: 'System Default' },
  { value: 'INTER', label: 'Inter' },
  { value: 'ROBOTO', label: 'Roboto' },
  { value: 'POPPINS', label: 'Poppins' },
];
const RADII = ['0','8','12','16','24'];
const SIDEBAR_STYLES = [
  { value: 'DEFAULT', label: 'Default', icon: '📋' },
  { value: 'COMPACT', label: 'Compact', icon: '📑' },
  { value: 'MINI', label: 'Mini', icon: '📌' },
];

export default function ThemeSettings({ onThemeChange }) {
  const [theme, setTheme] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTheme(); }, []);

  const loadTheme = async () => {
    try {
      const res = await themeAPI.get();
      setTheme(res.data);
      applyTheme(res.data);
    } catch (e) { console.error(e); }
  };

  const applyTheme = (t) => {
    if (t.themeMode === 'DARK') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    document.documentElement.style.setProperty('--primary', t.primaryColor);
    document.documentElement.style.setProperty('--accent', t.accentColor);
  };

  const update = async (key, value) => {
    setSaving(true);
    try {
      const res = await themeAPI.update({ [key]: value });
      setTheme(res.data);
      applyTheme(res.data);
      if (onThemeChange) onThemeChange(res.data);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (!theme) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading theme...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🎨 Theme & Appearance</h2>
        {saving && <span style={{ color: '#6C3CE1', fontSize: 13 }}>Saving...</span>}
      </div>

      {/* Dark Mode Toggle */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🌓 Dark Mode</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div onClick={() => update('themeMode', 'LIGHT')}
            style={{ flex: 1, padding: 20, borderRadius: 12, cursor: 'pointer', border: theme.themeMode === 'LIGHT' ? '3px solid #6C3CE1' : '2px solid #E5E7EB', textAlign: 'center', background: '#fff', color: '#111' }}>
            <div style={{ fontSize: 32 }}>☀️</div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>Light</div>
          </div>
          <div onClick={() => update('themeMode', 'DARK')}
            style={{ flex: 1, padding: 20, borderRadius: 12, cursor: 'pointer', border: theme.themeMode === 'DARK' ? '3px solid #6C3CE1' : '2px solid #475569', textAlign: 'center', background: '#1E293B', color: '#E2E8F0' }}>
            <div style={{ fontSize: 32 }}>🌙</div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>Dark</div>
          </div>
        </div>
      </div>

      {/* Primary Color */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🎨 Primary Color</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => update('primaryColor', c)}
              style={{ width: 40, height: 40, borderRadius: '50%', background: c, cursor: 'pointer',
                border: theme.primaryColor === c ? '3px solid #111' : '2px solid transparent',
                transform: theme.primaryColor === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s' }} />
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>✨ Accent Color</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => update('accentColor', c)}
              style={{ width: 40, height: 40, borderRadius: '50%', background: c, cursor: 'pointer',
                border: theme.accentColor === c ? '3px solid #111' : '2px solid transparent',
                transform: theme.accentColor === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s' }} />
          ))}
        </div>
      </div>

      {/* Sidebar Style */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📐 Sidebar Style</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {SIDEBAR_STYLES.map(s => (
            <div key={s.value} onClick={() => update('sidebarStyle', s.value)}
              className="card" style={{ flex: 1, textAlign: 'center', cursor: 'pointer',
                border: theme.sidebarStyle === s.value ? '2px solid #6C3CE1' : '2px solid transparent' }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🔤 Font Family</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {FONTS.map(f => (
            <div key={f.value} onClick={() => update('fontFamily', f.value)}
              className="card" style={{ padding: '12px 20', cursor: 'pointer',
                border: theme.fontFamily === f.value ? '2px solid #6C3CE1' : '2px solid transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>⬜ Border Radius</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {RADII.map(r => (
            <div key={r} onClick={() => update('borderRadius', r)}
              style={{ width: 50, height: 50, background: theme.primaryColor, cursor: 'pointer',
                borderRadius: r + 'px', border: theme.borderRadius === r ? '3px solid #111' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
              {r}px
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>👁️ Preview</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: theme.primaryColor, color: '#fff', padding: 16, borderRadius: theme.borderRadius + 'px' }}>
            <div style={{ fontWeight: 700 }}>Primary Color</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{theme.primaryColor}</div>
          </div>
          <div style={{ flex: 1, background: theme.accentColor, color: '#fff', padding: 16, borderRadius: theme.borderRadius + 'px' }}>
            <div style={{ fontWeight: 700 }}>Accent Color</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{theme.accentColor}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
