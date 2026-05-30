import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { userAPI } from '../api';

export default function LoyaltyPointsScreen({ navigation }) {
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState('Bronze');
  const [history, setHistory] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      const profileRes = await userAPI.getProfile();
      const loyaltyPoints = profileRes.data.loyaltyPoints || 0;
      setPoints(loyaltyPoints);
      setTier(getTier(loyaltyPoints));

      // Generate history from orders (simulated)
      setHistory(generateHistory(loyaltyPoints));
      setRewards(getAvailableRewards(loyaltyPoints));
    } catch (e) {
      // If API doesn't support loyalty yet, show default
      setPoints(0);
      setTier('Bronze');
      setHistory([]);
      setRewards(getAvailableRewards(0));
    } finally {
      setLoading(false);
    }
  };

  const getTier = (pts) => {
    if (pts >= 5000) return 'Platinum';
    if (pts >= 2000) return 'Gold';
    if (pts >= 500) return 'Silver';
    return 'Bronze';
  };

  const getTierColor = (t) => {
    switch(t) {
      case 'Platinum': return '#607D8B';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#9E9E9E';
      default: return '#CD7F32';
    }
  };

  const getTierProgress = () => {
    const thresholds = { Bronze: 500, Silver: 2000, Gold: 5000, Platinum: 10000 };
    const current = thresholds[tier];
    const prev = tier === 'Bronze' ? 0 : { Silver: 500, Gold: 2000, Platinum: 5000 }[tier];
    return ((points - prev) / (current - prev)) * 100;
  };

  const generateHistory = (totalPts) => {
    const entries = [];
    const types = ['Earned', 'Earned', 'Earned', 'Redeemed', 'Earned'];
    const descs = ['Order #1024 purchase', 'Order #1021 purchase', 'Order #1018 purchase', 'Coupon redemption', 'Order #1015 purchase'];
    const amounts = [45, 30, 25, -100, 60];
    let balance = totalPts;
    for (let i = amounts.length - 1; i >= 0; i--) {
      entries.push({
        id: i.toString(),
        type: types[i],
        description: descs[i],
        amount: amounts[i],
        balance: balance,
        date: `2024-01-${10 + i}`,
      });
      balance -= amounts[i];
    }
    return entries;
  };

  const getAvailableRewards = (pts) => {
    return [
      { id: 1, name: '₹50 Off Coupon', points: 200, description: 'Min order ₹300', icon: '🎫' },
      { id: 2, name: '₹100 Off Coupon', points: 400, description: 'Min order ₹500', icon: '🎫' },
      { id: 3, name: 'Free Delivery', points: 100, description: 'On any order', icon: '🚚' },
      { id: 4, name: '₹200 Off Coupon', points: 800, description: 'Min order ₹1000', icon: '🎁' },
      { id: 5, name: 'Mystery Box', points: 1500, description: 'Worth ₹500+', icon: '📦' },
    ];
  };

  const handleRedeem = (reward) => {
    if (points < reward.points) {
      Alert.alert('Insufficient Points', `You need ${reward.points - points} more points`);
      return;
    }
    Alert.alert(
      'Redeem Reward',
      `${reward.icon} ${reward.name} for ${reward.points} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Redeem', onPress: () => {
          setPoints(points - reward.points);
          setTier(getTier(points - reward.points));
          Alert.alert('Success!', `${reward.name} redeemed successfully!`);
        }},
      ]
    );
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading...</Text></View>;
  }

  const tierColor = getTierColor(tier);

  return (
    <ScrollView style={styles.container}>
      {/* Points Card */}
      <View style={[styles.pointsCard, { borderLeftColor: tierColor }]}>
        <View style={styles.pointsHeader}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierBadgeText}>{tier}</Text>
          </View>
        </View>
        <Text style={styles.pointsValue}>{points}</Text>

        {/* Progress Bar */}
        {tier !== 'Platinum' && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getTierProgress()}%`, backgroundColor: tierColor }]} />
            </View>
            <Text style={styles.progressText}>
              {tier === 'Bronze' ? 500 : tier === 'Silver' ? 2000 : 5000 - points} more points to {tier === 'Bronze' ? 'Silver' : tier === 'Silver' ? 'Gold' : 'Platinum'}
            </Text>
          </View>
        )}

        <Text style={styles.earnHint}>Earn 1 point for every ₹10 spent</Text>
      </View>

      {/* Rewards Section */}
      <Text style={styles.sectionTitle}>🎁 Redeem Rewards</Text>
      {rewards.map(reward => (
        <View key={reward.id} style={styles.rewardCard}>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardIcon}>{reward.icon}</Text>
            <View style={styles.rewardDetails}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardDesc}>{reward.description}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.redeemBtn, points < reward.points && styles.redeemBtnDisabled]}
            onPress={() => handleRedeem(reward)}
            disabled={points < reward.points}
          >
            <Text style={styles.redeemBtnText}>{reward.points} pts</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* History Section */}
      <Text style={styles.sectionTitle}>📊 Points History</Text>
      {history.map(entry => (
        <View key={entry.id} style={styles.historyItem}>
          <View style={styles.historyLeft}>
            <View style={[styles.historyDot, entry.amount > 0 ? styles.historyDotGreen : styles.historyDotRed]} />
            <View>
              <Text style={styles.historyDesc}>{entry.description}</Text>
              <Text style={styles.historyDate}>{entry.date}</Text>
            </View>
          </View>
          <Text style={[styles.historyAmount, entry.amount > 0 ? styles.amountGreen : styles.amountRed]}>
            {entry.amount > 0 ? '+' : ''}{entry.amount}
          </Text>
        </View>
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pointsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 3, borderLeftWidth: 5 },
  pointsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsLabel: { fontSize: 14, color: '#999' },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  tierBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  pointsValue: { fontSize: 42, fontWeight: 'bold', color: '#333', marginTop: 8 },
  progressSection: { marginTop: 12 },
  progressBar: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#999', marginTop: 4 },
  earnHint: { fontSize: 12, color: '#4CAF50', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, marginTop: 8 },
  rewardCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  rewardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rewardIcon: { fontSize: 28, marginRight: 12 },
  rewardDetails: { flex: 1 },
  rewardName: { fontSize: 15, fontWeight: '600', color: '#333' },
  rewardDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  redeemBtn: { backgroundColor: '#e91e63', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  redeemBtnDisabled: { backgroundColor: '#ccc' },
  redeemBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  historyDotGreen: { backgroundColor: '#4CAF50' },
  historyDotRed: { backgroundColor: '#f44336' },
  historyDesc: { fontSize: 13, color: '#333' },
  historyDate: { fontSize: 11, color: '#999', marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: 'bold' },
  amountGreen: { color: '#4CAF50' },
  amountRed: { color: '#f44336' },
});
