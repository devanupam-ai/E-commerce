
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { orderTrackingAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

export default function OrderTrackingScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTracking(); }, []);

  const loadTracking = async () => {
    setLoading(true);
    try {
      const res = await orderTrackingAPI.track(orderId || 1);
      setTracking(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: 'center' }} />;
  if (!tracking) return <View style={styles.container}><Text style={{ textAlign: 'center', marginTop: 60 }}>Failed to load tracking</Text></View>;

  const callAgent = () => {
    if (tracking.deliveryAgentPhone) Linking.openURL(`tel:${tracking.deliveryAgentPhone}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Map Placeholder */}
      <View style={styles.mapArea}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <Text style={styles.mapTitle}>Live Tracking</Text>
          <Text style={styles.mapSub}>Order #{orderId}</Text>
          {tracking.deliveryAgentLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>📍 Agent is on the way</Text>
              <Text style={styles.locationCoords}>
                {tracking.deliveryAgentLocation.lat.toFixed(4)}, {tracking.deliveryAgentLocation.lng.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
        {/* ETA Banner */}
        <View style={styles.etaBanner}>
          <Text style={styles.etaEmoji}>🕐</Text>
          <View>
            <Text style={styles.etaLabel}>Estimated Delivery</Text>
            <Text style={styles.etaTime}>{new Date(tracking.estimatedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={styles.etaStatus}>
            <Text style={styles.etaStatusText}>{tracking.currentStatus.replace(/_/g, ' ')}</Text>
          </View>
        </View>
      </View>

      {/* Delivery Agent Card */}
      {tracking.deliveryAgentName && (
        <View style={styles.agentCard}>
          <View style={styles.agentInfo}>
            <View style={styles.agentAvatar}><Text style={styles.agentAvatarText}>🚴</Text></View>
            <View>
              <Text style={styles.agentName}>{tracking.deliveryAgentName}</Text>
              <Text style={styles.agentRole}>Delivery Partner</Text>
            </View>
          </View>
          <View style={styles.agentActions}>
            <TouchableOpacity style={styles.callBtn} onPress={callAgent}>
              <Text style={styles.callBtnText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatBtn}>
              <Text style={styles.chatBtnText}>💬 Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tracking Steps */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>📦 Order Progress</Text>
        {tracking.steps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepDot, step.completed && styles.stepDotActive]}>
                <Text style={styles.stepDotEmoji}>{step.emoji}</Text>
              </View>
              {index < tracking.steps.length - 1 && (
                <View style={[styles.stepLine, step.completed && styles.stepLineActive]} />
              )}
            </View>
            <View style={styles.stepRight}>
              <Text style={[styles.stepLabel, step.completed && styles.stepLabelActive]}>{step.label}</Text>
              {step.timestamp && (
                <Text style={styles.stepTime}>{new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              )}
              {!step.completed && step.duration && (
                <Text style={styles.stepDuration}>~{step.duration}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Refresh */}
      <TouchableOpacity style={styles.refreshBtn} onPress={loadTracking}>
        <Text style={styles.refreshBtnText}>🔄 Refresh Tracking</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapArea: { backgroundColor: COLORS.primary, paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  mapPlaceholder: { height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', margin: 16, borderRadius: 16 },
  mapEmoji: { fontSize: 48 },
  mapTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 4 },
  mapSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  locationInfo: { marginTop: 8, alignItems: 'center' },
  locationText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  locationCoords: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  etaBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16, borderRadius: 14, padding: 14, gap: 12 },
  etaEmoji: { fontSize: 28 },
  etaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  etaTime: { fontSize: 18, fontWeight: '800', color: '#fff' },
  etaStatus: { marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  etaStatusText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  agentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, margin: 16, borderRadius: 16, padding: 14, ...SIZES.shadow?.small || { elevation: 3 } },
  agentInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  agentAvatarText: { fontSize: 22 },
  agentName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  agentRole: { fontSize: 12, color: COLORS.textTertiary },
  agentActions: { flexDirection: 'row', gap: 8 },
  callBtn: { backgroundColor: COLORS.successLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  callBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  chatBtn: { backgroundColor: COLORS.infoLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  chatBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.info },
  stepsCard: { backgroundColor: COLORS.card, margin: 16, borderRadius: 16, padding: 18, ...SIZES.shadow?.small || { elevation: 3 } },
  stepsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  stepRow: { flexDirection: 'row', gap: 14, minHeight: 60 },
  stepLeft: { width: 36, alignItems: 'center' },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.divider, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: COLORS.primaryLight },
  stepDotEmoji: { fontSize: 16 },
  stepLine: { width: 2, flex: 1, backgroundColor: COLORS.divider, marginTop: 4 },
  stepLineActive: { backgroundColor: COLORS.primary },
  stepRight: { flex: 1, paddingBottom: 12 },
  stepLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textTertiary },
  stepLabelActive: { color: COLORS.textPrimary },
  stepTime: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
  stepDuration: { fontSize: 11, color: COLORS.warning, marginTop: 2, fontWeight: '500' },
  refreshBtn: { backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  refreshBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
