
import { useState, useEffect } from 'react';
import { returnsAPI } from '../api';

const statusColors = {
  PENDING: { bg: '#FEF3C7', color: '#D97706', icon: '⏳' },
  APPROVED: { bg: '#DBEAFE', color: '#2563EB', icon: '✅' },
  PROCESSING: { bg: '#E0E7FF', color: '#4F46E5', icon: '🔄' },
  REFUNDED: { bg: '#D1FAE5', color: '#059669', icon: '💰' },
  REJECTED: { bg: '#FEE2E2', color: '#DC2626', icon: '❌' },
};

export default function ReturnsRefunds() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedReturn, setSelectedReturn] = useState(null);

  useEffect(() => { loadReturns(); }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await returnsAPI.getAll();
      setReturns(res.data.returns || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAction = async (id, action) => {
    try {
      await action(id);
      loadReturns();
      setSelectedReturn(null);
    } catch (e) { alert('Action failed'); }
  };

  const filtered = filter === 'ALL' ? returns : returns.filter(r => r.status === filter);

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'PENDING').length,
    approved: returns.filter(r => r.status === 'APPROVED').length,
    refunded: returns.filter(r => r.status === 'REFUNDED').length,
    totalRefundAmount: returns.filter(r => r.status === 'REFUNDED').reduce((sum, r) => sum + parseFloat(r.amount), 0),
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🔄 Returns & Refunds</h2>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Manage return requests and process refunds</div>
        </div>
        <button onClick={loadReturns} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>🔄 Refresh</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #6B7280' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>TOTAL REQUESTS</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{stats.total}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>PENDING</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: '#D97706' }}>{stats.pending}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>APPROVED</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: '#2563EB' }}>{stats.approved}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>REFUNDED</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: '#059669' }}>{stats.refunded}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>TOTAL REFUNDED</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: '#8B5CF6' }}>₹{stats.totalRefundAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['ALL', 'PENDING', 'APPROVED', 'PROCESSING', 'REFUNDED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: filter === s ? '2px solid #3B82F6' : '1px solid #E5E7EB',
              background: filter === s ? '#EFF6FF' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: filter === s ? 700 : 400,
            }}>
            {s === 'ALL' ? '📋 All' : `${statusColors[s]?.icon || ''} ${s}`}
          </button>
        ))}
      </div>

      {/* Returns List */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>No returns found</div>
        ) : (
          <div>
            {filtered.map(r => {
              const sc = statusColors[r.status] || statusColors.PENDING;
              return (
                <div key={r.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                  <div onClick={() => setSelectedReturn(selectedReturn === r.id ? null : r.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: '#FAFAFA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18 }}>📦</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.productName}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{r.orderId} • {r.customerName} • {r.requestDate}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700 }}>₹{parseFloat(r.amount).toLocaleString()}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 12, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 700 }}>
                        {sc.icon} {r.status}
                      </span>
                      <span style={{ fontSize: 10, color: '#9CA3AF', transform: selectedReturn === r.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>
                  </div>
                  {selectedReturn === r.id && (
                    <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', background: '#fff' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>PRODUCT</div>
                          <div style={{ fontSize: 14, marginTop: 2 }}>{r.productName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>AMOUNT</div>
                          <div style={{ fontSize: 14, marginTop: 2, fontWeight: 700 }}>₹{parseFloat(r.amount).toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>REASON</div>
                          <div style={{ fontSize: 14, marginTop: 2 }}>{r.reason}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>REFUND METHOD</div>
                          <div style={{ fontSize: 14, marginTop: 2 }}>{r.refundMethod.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>CUSTOMER</div>
                          <div style={{ fontSize: 14, marginTop: 2 }}>{r.customerName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>REQUEST DATE</div>
                          <div style={{ fontSize: 14, marginTop: 2 }}>{r.requestDate}</div>
                        </div>
                      </div>
                      {r.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleAction(r.id, returnsAPI.approve)}
                            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                            ✅ Approve
                          </button>
                          <button onClick={() => handleAction(r.id, returnsAPI.reject)}
                            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                            ❌ Reject
                          </button>
                        </div>
                      )}
                      {r.status === 'APPROVED' && (
                        <button onClick={() => handleAction(r.id, returnsAPI.processRefund)}
                          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                          💰 Process Refund
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
