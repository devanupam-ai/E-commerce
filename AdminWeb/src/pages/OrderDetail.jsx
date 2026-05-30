import { useState, useEffect, useRef } from 'react';
import { orderAPI, adminAPI } from '../api';

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const Row = ({ label, value, bold, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
    <span style={{ color: '#6B7280', fontSize: 14 }}>{label}</span>
    <span style={{ fontWeight: bold ? 700 : 500, fontSize: 14, color: color || 'inherit' }}>{value}</span>
  </div>
);

export default function OrderDetail({ order: initialOrder, onBack }) {
  const [order, setOrder] = useState(initialOrder);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    adminAPI.getDeliveryBoys().then(r => setDeliveryBoys(r.data));
    if (order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED') {
      pollRef.current = setInterval(async () => {
        const [locRes, allRes] = await Promise.all([
          orderAPI.getDeliveryLocation(order.id).catch(() => ({ data: null })),
          orderAPI.getAll(),
        ]);
        if (locRes.data) setDeliveryLocation(locRes.data);
        const updated = allRes.data.find(o => o.id === order.id);
        if (updated) setOrder(updated);
      }, 10000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleConfirm = async () => {
    if (!window.confirm(`Confirm order #${order.orderNumber}? This will:\n• Move status to CONFIRMED\n• Auto-create a bill entry\n• Notify the customer`)) return;
    setActionLoading('confirm');
    try {
      const res = await orderAPI.confirm(order.id);
      setOrder(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to confirm order');
    } finally { setActionLoading(''); }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Cancel order #${order.orderNumber}? This will:\n• Restore stock for all items\n• Notify the customer`)) return;
    setActionLoading('cancel');
    try {
      const res = await orderAPI.cancel(order.id);
      setOrder(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to cancel order');
    } finally { setActionLoading(''); }
  };

  const handleAssign = async (deliveryBoyId) => {
    setActionLoading('assign');
    try {
      const res = await orderAPI.assign(order.id, deliveryBoyId);
      setOrder(res.data);
      setShowAssignModal(false);
    } finally { setActionLoading(''); }
  };

  const googleMapsUrl = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Order #{order.orderNumber}</h2>
        <span className={`badge status-${order.orderStatus}`}>{order.orderStatus?.replace(/_/g, ' ')}</span>

        {/* Action Buttons */}
        {order.orderStatus === 'PLACED' && (
          <>
            <button
              onClick={handleConfirm}
              disabled={actionLoading === 'confirm'}
              style={{ padding: '8px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              {actionLoading === 'confirm' ? '...' : '✅ Confirm Order'}
            </button>
            <button
              onClick={handleCancel}
              disabled={actionLoading === 'cancel'}
              style={{ padding: '8px 20px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              {actionLoading === 'cancel' ? '...' : '❌ Cancel Order'}
            </button>
          </>
        )}
        {order.orderStatus === 'CONFIRMED' && (
          <button
            onClick={handleCancel}
            disabled={actionLoading === 'cancel'}
            style={{ padding: '8px 20px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            {actionLoading === 'cancel' ? '...' : '❌ Cancel Order'}
          </button>
        )}
      </div>

      {/* Status Timeline */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📍 Order Status Timeline</h3>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 8 }}>
          {STATUS_STEPS.map((step, i) => {
            const done = i <= currentStep && order.orderStatus !== 'CANCELLED';
            const active = i === currentStep && order.orderStatus !== 'CANCELLED';
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#059669' : '#E5E7EB',
                    border: active ? '3px solid #059669' : 'none',
                    color: done ? '#fff' : '#9CA3AF', fontWeight: 700, fontSize: 14,
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 10, marginTop: 6, textAlign: 'center', color: done ? '#059669' : '#9CA3AF', fontWeight: done ? 700 : 400 }}>
                    {step.replace(/_/g, ' ')}
                  </div>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ height: 2, width: 40, background: i < currentStep && order.orderStatus !== 'CANCELLED' ? '#059669' : '#E5E7EB', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
          {order.orderStatus === 'CANCELLED' && (
            <div style={{ marginLeft: 16, padding: '4px 12px', background: '#FEE2E2', color: '#DC2626', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
              ❌ CANCELLED
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Customer */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>👤 Customer</h3>
          <Row label="Name" value={order.customer?.name} bold />
          <Row label="Phone" value={order.customer?.phone} />
          <Row label="Email" value={order.customer?.email} />
          <Row label="Shipping" value={order.shippingType} />
        </div>

        {/* Billing */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🧾 Billing</h3>
          <Row label="Subtotal" value={`₹${order.subtotal}`} />
          <Row label="Delivery Charge" value={`₹${order.deliveryCharge}`} />
          <Row label="Discount" value={`-₹${order.discount || 0}`} />
          <Row label="Payment Type" value={order.paymentType} />
          <Row label="Payment Status" value={order.paymentStatus} color={order.paymentStatus === 'SUCCESS' ? '#059669' : '#D97706'} />
          <Row label="Total" value={`₹${order.totalAmount}`} bold color="#6C3CE1" />
          {order.orderStatus === 'CONFIRMED' && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#ECFDF5', borderRadius: 8, fontSize: 13, color: '#059669', fontWeight: 600 }}>
              ✅ Bill auto-created in Offline Billing → BILL-{order.orderNumber}
            </div>
          )}
        </div>

        {/* Customer Location */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>📍 Delivery Address</h3>
          <Row label="Address" value={`${order.address?.addressLine1}, ${order.address?.city} - ${order.address?.pincode}`} />
          <Row label="State" value={order.address?.state} />
          {order.customerLatitude ? (
            <>
              <Row label="GPS" value={`${parseFloat(order.customerLatitude).toFixed(5)}, ${parseFloat(order.customerLongitude).toFixed(5)}`} />
              <a href={googleMapsUrl(order.customerLatitude, order.customerLongitude)} target="_blank" rel="noreferrer"
                style={{ display: 'inline-block', marginTop: 10, padding: '8px 16px', background: '#4285F4', color: '#fff', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                🗺 Open in Google Maps
              </a>
            </>
          ) : (
            <p style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>GPS not captured</p>
          )}
        </div>

        {/* Delivery */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🚴 Delivery</h3>
          {order.deliveryBoy ? (
            <>
              <Row label="Assigned To" value={order.deliveryBoy.name} bold />
              <Row label="Phone" value={order.deliveryBoy.phone} />
              <Row label="OTP" value={order.deliveryOtp} bold color="#6C3CE1" />
              {deliveryLocation ? (
                <>
                  <Row label="Last Location" value={`${parseFloat(deliveryLocation.latitude).toFixed(5)}, ${parseFloat(deliveryLocation.longitude).toFixed(5)}`} />
                  <Row label="Updated" value={new Date(deliveryLocation.updatedAt).toLocaleTimeString()} />
                  <a href={googleMapsUrl(deliveryLocation.latitude, deliveryLocation.longitude)} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 10, padding: '8px 16px', background: '#10B981', color: '#fff', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                    📍 Track Delivery Boy
                  </a>
                </>
              ) : (
                <p style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>Waiting for location...</p>
              )}
            </>
          ) : (
            <p style={{ color: '#6B7280', fontStyle: 'italic', marginBottom: 12 }}>Not yet assigned</p>
          )}
          {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
            <button className="btn-primary" style={{ marginTop: 12, width: '100%', padding: 10 }}
              onClick={() => setShowAssignModal(true)}>
              {order.deliveryBoy ? '🔄 Reassign Delivery Boy' : '+ Assign Delivery Boy'}
            </button>
          )}
        </div>
      </div>

      {/* Order Items + Inventory Impact */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🛍️ Order Items & Inventory Impact</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F3F4F6', textAlign: 'left', background: '#F9FAFB' }}>
              {['Product', 'Qty Ordered', 'Unit Price', 'Total', 'Stock Impact'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items?.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600 }}>{item.productName}</div>
                </td>
                <td style={{ padding: '12px', fontWeight: 700 }}>{item.quantity}</td>
                <td style={{ padding: '12px' }}>₹{item.unitPrice}</td>
                <td style={{ padding: '12px', fontWeight: 700, color: '#6C3CE1' }}>₹{item.totalPrice}</td>
                <td style={{ padding: '12px' }}>
                  {order.orderStatus === 'CANCELLED' ? (
                    <span style={{ color: '#059669', fontWeight: 700, fontSize: 13 }}>
                      +{item.quantity} restored ↑
                    </span>
                  ) : (
                    <span style={{ color: '#DC2626', fontWeight: 700, fontSize: 13 }}>
                      -{item.quantity} deducted ↓
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, fontSize: 13, color: '#374151' }}>
          <strong>ℹ️ Inventory Note:</strong> Stock is automatically deducted when the order is placed by the customer.
          {order.orderStatus === 'CANCELLED'
            ? ' Stock has been restored because this order was cancelled.'
            : ' Confirming the order also auto-creates a bill entry in Offline Billing.'}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, maxHeight: '70vh', overflow: 'auto' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Select Delivery Boy</h3>
            {actionLoading === 'assign' ? <p>Assigning...</p> : deliveryBoys.map(db => (
              <div key={db.id} onClick={() => handleAssign(db.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', borderRadius: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <span style={{ fontSize: 28 }}>🚴</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{db.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{db.phone}</div>
                </div>
              </div>
            ))}
            <button className="btn-secondary" style={{ width: '100%', marginTop: 12, padding: 10 }}
              onClick={() => setShowAssignModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
