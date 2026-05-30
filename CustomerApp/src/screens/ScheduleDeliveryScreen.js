
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { scheduleDeliveryAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

export default function ScheduleDeliveryScreen({ navigation, route }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => { loadSlots(); }, []);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const res = await scheduleDeliveryAPI.getSlots();
      setSlots(res.data.dates || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSchedule = async () => {
    if (!selectedSlot) return Alert.alert('Select Slot', 'Please choose a delivery time slot');
    setScheduling(true);
    try {
      const date = slots[selectedDate];
      const slot = date.slots[selectedSlot];
      await scheduleDeliveryAPI.schedule({ date: date.date, slotId: slot.id, time: slot.time });
      Alert.alert('✅ Scheduled!', `Delivery scheduled for ${date.label} ${slot.time}`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) { Alert.alert('Error', 'Failed to schedule delivery'); }
    setScheduling(false);
  };

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: 'center' }} />;

  const currentDates = slots.length > 0 ? slots : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Schedule Delivery</Text>
        <Text style={styles.headerSub}>Choose your preferred delivery time</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Date Selection */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {currentDates.map((date, index) => (
            <TouchableOpacity key={index} style={[styles.dateCard, selectedDate === index && styles.dateCardActive]} onPress={() => { setSelectedDate(index); setSelectedSlot(null); }}>
              <Text style={[styles.dateDay, selectedDate === index && styles.dateDayActive]}>{date.day}</Text>
              <Text style={[styles.dateNum, selectedDate === index && styles.dateNumActive]}>{date.dateNum}</Text>
              <Text style={[styles.dateLabel, selectedDate === index && styles.dateLabelActive]}>{date.label}</Text>
              {date.isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>TODAY</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time Slots */}
        {currentDates[selectedDate] && (
          <>
            <Text style={styles.sectionTitle}>Select Time Slot</Text>
            <View style={styles.slotsGrid}>
              {currentDates[selectedDate].slots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.slotCard, selectedSlot === index && styles.slotCardActive, !slot.available && styles.slotCardDisabled]}
                  onPress={() => slot.available && setSelectedSlot(index)}
                  disabled={!slot.available}
                >
                  <Text style={styles.slotEmoji}>{slot.emoji}</Text>
                  <Text style={[styles.slotTime, selectedSlot === index && styles.slotTimeActive]}>{slot.time}</Text>
                  <Text style={[styles.slotLabel, selectedSlot === index && styles.slotLabelActive]}>{slot.label}</Text>
                  {!slot.available && <Text style={styles.slotUnavailable}>Unavailable</Text>}
                  {slot.available && slot.popular && <Text style={styles.slotPopular}>🔥 Popular</Text>}
                  {slot.available && <Text style={styles.slotFee}>{slot.fee === 0 ? 'FREE' : `₹${slot.fee}`}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Summary */}
        {selectedSlot !== null && currentDates[selectedDate] && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📋 Delivery Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{currentDates[selectedDate].day}, {currentDates[selectedDate].dateNum}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{currentDates[selectedDate].slots[selectedSlot].time}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>{currentDates[selectedDate].slots[selectedSlot].fee === 0 ? 'FREE' : `₹${currentDates[selectedDate].slots[selectedSlot].fee}`}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Schedule Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.scheduleBtn, (!selectedSlot && selectedSlot !== 0) && styles.scheduleBtnDisabled]} onPress={handleSchedule} disabled={scheduling || (selectedSlot === null)}>
          <Text style={styles.scheduleBtnText}>{scheduling ? '⏳ Scheduling...' : '✅ Confirm Schedule'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, marginTop: 8 },
  dateScroll: { marginBottom: 8 },
  dateCard: { width: 80, backgroundColor: COLORS.card, borderRadius: 14, padding: 12, alignItems: 'center', marginRight: 10, borderWidth: 2, borderColor: 'transparent', ...SIZES.shadow?.small || { elevation: 2 } },
  dateCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  dateDay: { fontSize: 12, fontWeight: '600', color: COLORS.textTertiary },
  dateDayActive: { color: COLORS.primary },
  dateNum: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  dateNumActive: { color: COLORS.primary },
  dateLabel: { fontSize: 10, color: COLORS.textTertiary, marginTop: 2 },
  dateLabelActive: { color: COLORS.primary },
  todayBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  todayBadgeText: { fontSize: 8, fontWeight: '800', color: '#fff' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', ...SIZES.shadow?.small || { elevation: 2 } },
  slotCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  slotCardDisabled: { opacity: 0.5 },
  slotEmoji: { fontSize: 24, marginBottom: 4 },
  slotTime: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  slotTimeActive: { color: COLORS.primary },
  slotLabel: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
  slotLabelActive: { color: COLORS.primary },
  slotUnavailable: { fontSize: 10, color: COLORS.error, fontWeight: '600', marginTop: 4 },
  slotPopular: { fontSize: 10, color: COLORS.secondary, fontWeight: '700', marginTop: 4 },
  slotFee: { fontSize: 11, fontWeight: '700', color: COLORS.success, marginTop: 2 },
  summaryCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginTop: 16, ...SIZES.shadow?.small || { elevation: 3 } },
  summaryTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: COLORS.divider },
  summaryLabel: { fontSize: 13, color: COLORS.textTertiary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  bottomBar: { padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.divider },
  scheduleBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  scheduleBtnDisabled: { backgroundColor: COLORS.textTertiary },
  scheduleBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
