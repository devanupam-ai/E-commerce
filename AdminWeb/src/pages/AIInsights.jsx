
import { useState, useEffect } from 'react';
import { aiInsightsAPI } from '../api';

export default function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadInsights(); }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const res = await aiInsightsAPI.get();
      setInsights(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#DC2626';
  };

  const getHealthGradient = (score) => {
    const color = getHealthColor(score);
    return `conic-gradient(${color} ${score * 3.6}deg, #E5E7EB ${score * 3.6}deg)`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🤖 AI Business Insights</h2>
        <button className="btn-secondary" onClick={loadInsights}>🔄 Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>Analyzing your business data...</div>
      ) : insights ? (
        <>
          {/* Health Score */}
          <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 32 }}>
            <div className="health-ring" style={{ background: getHealthGradient(insights.healthScore) }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: getHealthColor(insights.healthScore) }}>{insights.healthScore}</span>
                <span style={{ fontSize: 9, color: '#6B7280' }}>HEALTH</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Business Health Score</h3>
              <p style={{ fontSize: 14, color: '#6B7280' }}>
                {insights.healthLabel}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div style={{ padding: '4px 12px', borderRadius: 20, background: getHealthColor(insights.healthScore) + '20', color: getHealthColor(insights.healthScore), fontSize: 12, fontWeight: 700 }}>
                  {insights.healthScore >= 80 ? 'Excellent' : insights.healthScore >= 50 ? 'Needs Improvement' : 'Critical'}
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                Last analyzed: {new Date(insights.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Insight Cards */}
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💡 Smart Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.insights && insights.insights.length > 0 ? insights.insights.map((ins, i) => (
              <div key={i} className={`insight-card insight-${ins.type} animate-slideIn`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 28 }}>{ins.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{ins.title}</div>
                      <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{ins.message}</div>
                    </div>
                  </div>
                  {ins.action && (
                    <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap' }}>
                      {ins.action}
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 600 }}>All Good!</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>No issues detected. Your business is running smoothly.</div>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>📌 Pro Tips</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { icon: '📱', tip: 'Send WhatsApp reminders for overdue payments' },
                { icon: '🏷️', tip: 'Run festival discounts to boost sales' },
                { icon: '📦', tip: 'Keep stock above reorder levels' },
                { icon: '👥', tip: 'Focus on retaining top customers' },
              ].map((t, i) => (
                <div key={i} style={{ flex: '1 1 200px', padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{t.tip}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p>Unable to load insights. Make sure you have some business data.</p>
        </div>
      )}
    </div>
  );
}
