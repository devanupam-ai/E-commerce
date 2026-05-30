
import { useState, useEffect } from 'react';
import { heatmapAPI } from '../api';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function HeatmapCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => { loadData(); }, [year, month]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await heatmapAPI.getData(year, month);
      setData(res.data.heatmap || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  // Calculate stats
  const totalSales = data.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
  const activeDays = data.filter(d => parseFloat(d.amount) > 0).length;
  const bestDay = data.reduce((best, d) => parseFloat(d.amount) > parseFloat(best?.amount || 0) ? d : best, null);
  const avgSales = activeDays > 0 ? totalSales / activeDays : 0;

  // Get day of week for first day of month
  const firstDay = new Date(year, month - 1, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday = 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🗓️ Sales Heatmap</h2>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 140, borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Monthly Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>₹{totalSales.toFixed(0)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 140, borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Active Days</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{activeDays} / {data.length}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 140, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Avg Daily Sales</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>₹{avgSales.toFixed(0)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 140, borderLeft: '4px solid #6C3CE1' }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Best Day</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{bestDay ? '₹' + parseFloat(bestDay.amount).toFixed(0) : '—'}</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Month Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button className="btn-secondary" onClick={prevMonth}>◀ Prev</button>
          <h3 style={{ fontWeight: 700, fontSize: 18 }}>{MONTHS[month - 1]} {year}</h3>
          <button className="btn-secondary" onClick={nextMonth}>Next ▶</button>
        </div>

        {/* Day Headers */}
        <div className="heatmap-grid" style={{ marginBottom: 4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#6B7280', padding: 4 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Empty cells for offset */}
        <div className="heatmap-grid">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} style={{ aspectRatio: 1 }} />
          ))}

          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
          ) : (
            data.map((d, i) => {
              const amt = parseFloat(d.amount) || 0;
              const dayNum = d.date.split('-')[2];
              return (
                <div key={i} className="heatmap-cell"
                  style={{ background: d.color }}
                  onClick={() => setSelectedDay(d)}>
                  <span style={{ fontWeight: amt > 0 ? 700 : 400, color: amt > 0 ? '#fff' : '#9CA3AF' }}>
                    {parseInt(dayNum)}
                  </span>
                  {amt > 0 && (
                    <div className="tooltip">{d.label}</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#6B7280' }}>Less</span>
          {['#F3F4F6','#D1FAE5','#6EE7B7','#34D399','#10B981','#059669'].map(c => (
            <div key={c} style={{ width: 16, height: 16, borderRadius: 3, background: c }} />
          ))}
          <span style={{ fontSize: 11, color: '#6B7280' }}>More</span>
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && (
        <div className="card animate-slideIn" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700 }}>📅 {selectedDay.date} ({selectedDay.dayOfWeek})</h3>
            <button className="btn-secondary" onClick={() => setSelectedDay(null)}>✕</button>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Sales Amount</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>₹{parseFloat(selectedDay.amount).toFixed(0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Intensity</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{selectedDay.intensity}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
