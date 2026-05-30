
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, AsyncStorage,
} from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

const NOTIFICATION_TYPES = {
  ORDER: { icon: '📦', color: '#3B82F6' },
  PROMO: { icon: '🎉', color: '#F59E0B' },
  DELIVERY: { icon: '🚚', color: '#10B981' },
  PAYMENT: { icon: '💳', color: '#8B5CF6' },
  SYSTEM: { icon: '🔔', color: '#6B7280' },
};

const STORAGE_KEY = '@notifications';

// Sample notifications for demo (in production, these come from backend push)
const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    type: 'PROMO',
    title: '🎉 Weekend Special!',
    body: 'Get 20% off on all vegetables. Use code: VEGGIE20',
    time: new Date(Date.now() - 30 * 60000).toISOString(),
    read: false,
  },
  {
    id: 2,
    type: 'DELIVERY',
    title: '🚚 Order Out for Delivery',
    body: 'Your order #ORD-123 is on its way! OTP: 4582',
    time: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
  },
  {
    id: 3,
    type: 'ORDER',
    title: '✅ Order Confirmed',
    body: 'Your order #ORD-123 has been confirmed and is being prepared.',
    time: new Date(Date.now() - 3 * 3600000).toISOString(),
    read: true,
  },
  {
    id: 4,
    type: 'PAYMENT',
    title: '💳 Payment Successful',
    body: '₹456.00 paid for order #ORD-122 via UPI',
    time: new Date(Date.now() - 24 * 3600000).toISOString(),
    read: true,
  },
  {
    id: 5,
    type: 'PROMO',
    title: '🔥 Flash Sale!',
    body: 'Flat ₹50 off on orders above ₹300. Only for 2 hours!',
    time: new Date(Date.now() - 48 * 3600000).toISOString(),
    read: true,
  },
  {
    id: 6,
    type: 'SYSTEM',
    title: '📍 New Location Service',
    body: 'We are now delivering in your area! Enjoy 10-min delivery.',
    time: new Date(Date.now() - 72 * 3600000).toISOString(),
    read: true,
  },
];

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // In production, fetch from backend API
      // For now, load from AsyncStorage or use sample data
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications(SAMPLE_NOTIFICATIONS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_NOTIFICATIONS));
      }
    } catch {
      setNotifications(SAMPLE_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async (updated) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
    Alert.alert('Done', 'All notifications marked as read.');
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: () => {
          setNotifications([]);
          saveNotifications([]);
        },
      },
    ]);
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const getTimeAgo = (isoString) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationCard = ({ item }) => {
    const typeInfo = NOTIFICATION_TYPES[item.type] || NOTIFICATION_TYPES.SYSTEM;
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIconBox, { backgroundColor: typeInfo.color + '15' }]}>
          <Text style={styles.notifIcon}>{typeInfo.icon}</Text>
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.notifTime}>{getTimeAgo(item.time)}</Text>
          </View>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNotification(item.id)}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notifications</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Action Bar */}
      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          <Text style={styles.actionBarText}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up! 🎉'}
          </Text>
          <View style={styles.actionBtns}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>✓ Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
              <Text style={[styles.actionBtnText, { color: COLORS.red }]}>🗑️ Clear all</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySubtext}>We will notify you about orders, offers and updates</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <NotificationCard item={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SIZES.padding, backgroundColor: COLORS.white, elevation: 2,
  },
  backBtn: { fontSize: 24, color: COLORS.black },
  headerTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  actionBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingVertical: 10,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  actionBarText: { fontSize: SIZES.sm, color: COLORS.gray, fontWeight: '500' },
  actionBtns: { flexDirection: 'row', gap: 16 },
  actionBtn: {},
  actionBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.primary },
  list: { padding: SIZES.padding },
  notifCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: SIZES.radius, padding: 14, marginBottom: 8, elevation: 1,
  },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  notifIconBox: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  notifIcon: { fontSize: 22 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  notifTitle: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.black, flex: 1, marginRight: 8 },
  notifTitleUnread: { fontWeight: 'bold' },
  notifTime: { fontSize: SIZES.xs, color: COLORS.gray },
  notifBody: { fontSize: SIZES.sm, color: COLORS.gray, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 },
  deleteBtn: { padding: 6, marginLeft: 4 },
  deleteBtnText: { fontSize: SIZES.sm, color: COLORS.lightGray, fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
  emptySubtext: { fontSize: SIZES.md, color: COLORS.gray, textAlign: 'center' },
});
