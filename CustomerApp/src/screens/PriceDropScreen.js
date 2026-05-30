
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native';
import { priceDropAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

const ALERT_ICONS = { WISHLIST_DROP: '❤️', CATEGORY_DROP: '📂', TRENDING_DROP: '🔥', NEW_LOW: '📉' };
const ALERT_LABELS = { WISHLIST_DROP: 'Wishlist Item', CATEGORY_DROP: 'Category Favorite', TRENDING_DROP: 'Trending', NEW_LOW: 'All-Time Low' };

export default function PriceDropScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await priceDropAPI.getAlerts();
      setAlerts(res.data.alerts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubscribe = async (productId) => {
    try {
      await priceDropAPI.subscribe(productId);
      Alert.alert('✅ Subscribed!', 'You\'ll be notified when the price drops further');
    } catch (e) { Alert.alert('Error', 'Failed to subscribe'); }
  };

  const renderAlert = ({ item }) => (
    <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })} activeOpacity={0.7}>
      <View style={styles.alertHeader}>
        <View style={styles.alertTypeBadge}>
          <Text style={styles.alertTypeEmoji}>{ALERT_ICONS[item.alertType] || '📉'}</Text>
          <Text style={styles.alertTypeText}>{ALERT_LABELS[item.alertType] || 'Price Drop'}</Text>
        </View>
        {item.isLowest && <View style={styles.lowestBadge}><Text style={styles.lowestBadgeText}>🏆 ALL-TIME LOW</Text></View>}
      </View>
      <View style={styles.alertBody}>
        <View style={styles.alertImageBox}>
          {item.productImage ? (
            <Image source={{ uri: item.productImage }} style={styles.alertImage} resizeMode="cover" />
          ) : (
            <Text style={styles.alertEmoji}>🛍️</Text>
          )}
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertName} numberOfLines={2}>{item.productName}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₹{item.currentPrice}</Text>
            <Text style={styles.previousPrice}>₹{item.previousPrice}</Text>
            <View style={styles.dropBadge}><Text style={styles.dropBadgeText}>↓ {item.dropPercent}%</Text></View>
          </View>
          <Text style={styles.detectedAt}>Detected {new Date(item.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          <TouchableOpacity style={styles.subscribeBtn} onPress={() => handleSubscribe(item.productId)}>
            <Text style={styles.subscribeBtnText}>🔔 Notify Further Drops</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📉 Price Drop Alerts</Text>
        <Text style={styles.headerSub}>Products that just got cheaper!</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderAlert}
          contentContainerStyle={styles.alertList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>📉</Text>
              <Text style={styles.emptyText}>No price drops detected yet. We're watching!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  alertList: { padding: 12 },
  alertCard: { backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 12, padding: 14, ...SIZES.shadow?.small || { elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 } },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  alertTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  alertTypeEmoji: { fontSize: 12 },
  alertTypeText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  lowestBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  lowestBadgeText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  alertBody: { flexDirection: 'row', gap: 12 },
  alertImageBox: { width: 80, height: 80, backgroundColor: COLORS.surfaceSecondary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  alertImage: { width: 80, height: 80, borderRadius: 12 },
  alertEmoji: { fontSize: 32 },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  currentPrice: { fontSize: 18, fontWeight: '800', color: COLORS.success },
  previousPrice: { fontSize: 13, color: COLORS.textTertiary, textDecorationLine: 'line-through' },
  dropBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  dropBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.success },
  detectedAt: { fontSize: 11, color: COLORS.textTertiary, marginTop: 4 },
  subscribeBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginTop: 6 },
  subscribeBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: COLORS.textTertiary, marginTop: 12, textAlign: 'center' },
});
