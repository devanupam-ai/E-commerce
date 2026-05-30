
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { flashSaleAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';
import { useCartStore } from '../store';

export default function FlashSaleScreen({ navigation }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const { addItem } = useCartStore();

  useEffect(() => { loadDeals(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const diff = nextHour - now;
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor(diff / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const res = await flashSaleAPI.getDeals();
      setDeals(res.data.deals || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const renderDeal = ({ item }) => {
    const claimedPct = item.totalItems > 0 ? (item.claimed / item.totalItems * 100) : 0;
    return (
      <TouchableOpacity style={styles.dealCard} onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })} activeOpacity={0.7}>
        <View style={styles.dealHeader}>
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>🔥 {item.saleName}</Text>
          </View>
          <Text style={styles.discountTag}>{item.discountPercent}% OFF</Text>
        </View>
        <View style={styles.dealBody}>
          <View style={styles.dealImageBox}>
            {item.productImage ? (
              <Image source={{ uri: item.productImage }} style={styles.dealImage} resizeMode="cover" />
            ) : (
              <Text style={styles.dealEmoji}>🛍️</Text>
            )}
          </View>
          <View style={styles.dealInfo}>
            <Text style={styles.dealName} numberOfLines={2}>{item.productName}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.salePrice}>₹{item.salePrice}</Text>
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            </View>
            <View style={styles.claimedBar}>
              <View style={[styles.claimedFill, { width: `${claimedPct}%` }]} />
            </View>
            <Text style={styles.claimedText}>{item.claimed}/{item.totalItems} claimed • {item.remaining} left</Text>
            <TouchableOpacity style={styles.grabBtn} onPress={() => addItem({ id: item.productId, name: item.productName, sellingPrice: item.salePrice, imageUrl: item.productImage })}>
              <Text style={styles.grabBtnText}>⚡ GRAB DEAL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Timer Header */}
      <View style={styles.timerHeader}>
        <Text style={styles.timerTitle}>⚡ Flash Sale</Text>
        <View style={styles.timerRow}>
          <View style={styles.timerBox}><Text style={styles.timerDigit}>{String(timeLeft.hours).padStart(2, '0')}</Text></View>
          <Text style={styles.timerColon}>:</Text>
          <View style={styles.timerBox}><Text style={styles.timerDigit}>{String(timeLeft.minutes).padStart(2, '0')}</Text></View>
          <Text style={styles.timerColon}>:</Text>
          <View style={styles.timerBox}><Text style={styles.timerDigit}>{String(timeLeft.seconds).padStart(2, '0')}</Text></View>
        </View>
        <Text style={styles.timerSub}>Deals refresh every hour</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={deals}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderDeal}
          contentContainerStyle={styles.dealList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>⚡</Text>
              <Text style={styles.emptyText}>No flash deals right now. Check back soon!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  timerHeader: { backgroundColor: COLORS.secondary, padding: 20, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 28 },
  timerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerBox: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, minWidth: 52, alignItems: 'center' },
  timerDigit: { fontSize: 28, fontWeight: '800', color: '#fff' },
  timerColon: { fontSize: 28, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  timerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 8, fontWeight: '500' },
  dealList: { padding: 12 },
  dealCard: { backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 12, overflow: 'hidden', ...SIZES.shadow?.small || { elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 } },
  dealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10 },
  saleBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  saleBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.secondary },
  discountTag: { fontSize: 14, fontWeight: '800', color: COLORS.error },
  dealBody: { flexDirection: 'row', padding: 12, gap: 12 },
  dealImageBox: { width: 90, height: 90, backgroundColor: COLORS.surfaceSecondary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dealImage: { width: 90, height: 90, borderRadius: 12 },
  dealEmoji: { fontSize: 36 },
  dealInfo: { flex: 1 },
  dealName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  salePrice: { fontSize: 18, fontWeight: '800', color: COLORS.error },
  originalPrice: { fontSize: 13, color: COLORS.textTertiary, textDecorationLine: 'line-through' },
  claimedBar: { height: 6, backgroundColor: COLORS.divider, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  claimedFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 3 },
  claimedText: { fontSize: 10, color: COLORS.textTertiary, marginTop: 2 },
  grabBtn: { backgroundColor: COLORS.secondary, borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  grabBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: COLORS.textTertiary, marginTop: 12, textAlign: 'center' },
});
