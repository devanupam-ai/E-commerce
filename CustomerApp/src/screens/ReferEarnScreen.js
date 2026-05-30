
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { referEarnAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

export default function ReferEarnScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await referEarnAPI.getReferralInfo();
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleShare = async () => {
    try {
      const res = await referEarnAPI.shareReferral();
      const shareLink = res.data.shareLink || `https://freshcart.app/ref/${data?.referralCode}`;
      await Share.share({
        message: `🛒 Shop on FreshCart & get ₹100 OFF! Use my referral code: ${data?.referralCode}

Download: ${shareLink}`,
        title: 'Invite Friends to FreshCart',
      });
    } catch (e) { Alert.alert('Error', 'Failed to share'); }
  };

  const copyCode = () => {
    if (data?.referralCode) {
      Alert.alert('Code Copied!', `Referral code: ${data.referralCode}`);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: 'center' }} />;
  if (!data) return <View style={styles.container}><Text style={{ textAlign: 'center', marginTop: 60 }}>Failed to load</Text></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🎁</Text>
        <Text style={styles.heroTitle}>Refer & Earn ₹100</Text>
        <Text style={styles.heroSub}>Share with friends. You both get ₹100!</Text>
      </View>

      {/* Referral Code */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{data.referralCode}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
            <Text style={styles.copyBtnText}>📋 Copy</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>📤 Share with Friends</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.totalReferrals}</Text>
          <Text style={styles.statLabel}>Friends Invited</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.successfulReferrals}</Text>
          <Text style={styles.statLabel}>Successful</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{data.totalEarned}</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howCard}>
        <Text style={styles.howTitle}>How It Works</Text>
        {[
          { step: 1, emoji: '📤', title: 'Share Your Code', desc: 'Send your referral code to friends' },
          { step: 2, emoji: '🛒', title: 'Friend Signs Up', desc: 'They sign up using your code' },
          { step: 3, emoji: '💰', title: 'Both Earn ₹100', desc: 'You & your friend both get ₹100' },
        ].map((item, i) => (
          <View key={i} style={styles.howStep}>
            <View style={styles.howStepLeft}>
              <View style={styles.howStepCircle}><Text style={styles.howStepEmoji}>{item.emoji}</Text></View>
              {i < 2 && <View style={styles.howStepLine} />}
            </View>
            <View style={styles.howStepRight}>
              <Text style={styles.howStepTitle}>{item.title}</Text>
              <Text style={styles.howStepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Referrals */}
      <View style={styles.referralsCard}>
        <Text style={styles.referralsTitle}>Recent Referrals</Text>
        {data.recentReferrals.map((r, i) => (
          <View key={i} style={styles.referralRow}>
            <View style={styles.referralAvatar}><Text style={styles.referralAvatarText}>{r.name.charAt(0)}</Text></View>
            <View style={styles.referralInfo}>
              <Text style={styles.referralName}>{r.name}</Text>
              <Text style={styles.referralDate}>{r.date}</Text>
            </View>
            <View style={[styles.referralStatus, r.status === 'SUCCESS' ? styles.referralStatusSuccess : styles.referralStatusPending]}>
              <Text style={[styles.referralStatusText, r.status === 'SUCCESS' && styles.referralStatusTextSuccess]}>
                {r.status === 'SUCCESS' ? '✅ ₹100 Earned' : '⏳ Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { backgroundColor: COLORS.primary, padding: 28, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 36 },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 8 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  codeCard: { backgroundColor: COLORS.card, margin: 16, borderRadius: 16, padding: 20, alignItems: 'center', ...SIZES.shadow?.small || { elevation: 3 } },
  codeLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 1.5 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  codeText: { fontSize: 28, fontWeight: '800', color: COLORS.primary, letterSpacing: 3, fontFamily: 'monospace' },
  copyBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  shareBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16, width: '100%' },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 14, alignItems: 'center', ...SIZES.shadow?.small || { elevation: 2 } },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2, fontWeight: '500' },
  howCard: { backgroundColor: COLORS.card, margin: 16, borderRadius: 16, padding: 18, ...SIZES.shadow?.small || { elevation: 3 } },
  howTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  howStep: { flexDirection: 'row', gap: 14 },
  howStepLeft: { width: 40, alignItems: 'center' },
  howStepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  howStepEmoji: { fontSize: 18 },
  howStepLine: { width: 2, flex: 1, backgroundColor: COLORS.primary, marginTop: 4, minHeight: 20 },
  howStepRight: { flex: 1, paddingBottom: 16 },
  howStepTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  howStepDesc: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  referralsCard: { backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 16, padding: 18, ...SIZES.shadow?.small || { elevation: 3 } },
  referralsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  referralRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: COLORS.divider, gap: 10 },
  referralAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  referralAvatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  referralDate: { fontSize: 11, color: COLORS.textTertiary },
  referralStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  referralStatusSuccess: { backgroundColor: COLORS.successLight },
  referralStatusPending: { backgroundColor: COLORS.warningLight },
  referralStatusText: { fontSize: 11, fontWeight: '600' },
  referralStatusTextSuccess: { color: COLORS.success },
});
