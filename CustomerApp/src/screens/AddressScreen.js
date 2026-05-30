
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal,
  ScrollView, StatusBar,
} from 'react-native';
import { addressAPI } from '../api';
import { COLORS, SIZES, PRESETS } from '../utils/theme';

const LABELS = ['Home', 'Work', 'Other'];
const EMPTY_FORM = { label: 'Home', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };

export default function AddressScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => { loadAddresses(); }, []);

  const loadAddresses = async () => {
    try {
      const res = await addressAPI.getAddresses();
      setAddresses(res.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingAddress(null);
    setForm(EMPTY_FORM);
    setFocusedField('');
    setShowModal(true);
  };

  const openEdit = (addr) => {
    setEditingAddress(addr);
    setForm({
      label: addr.label || 'Home',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
    setFocusedField('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.addressLine1.trim() || !form.city.trim() || !form.pincode.trim())
      return Alert.alert('Missing Fields', 'Address, City and Pincode are required.');
    if (form.pincode.length !== 6)
      return Alert.alert('Invalid Pincode', 'Pincode must be 6 digits.');

    setSaving(true);
    try {
      if (editingAddress) {
        const res = await addressAPI.updateAddress(editingAddress.id, form);
        setAddresses(prev => prev.map(a => a.id === editingAddress.id ? res.data : a));
        Alert.alert('Updated', 'Address updated successfully.');
      } else {
        const res = await addressAPI.addAddress(form);
        setAddresses(prev => [...prev, res.data]);
        Alert.alert('Added', 'New address added successfully.');
      }
      setShowModal(false);
    } catch {
      Alert.alert('Error', 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (addr) => {
    Alert.alert('Delete Address', `Remove "${addr.label}" address?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await addressAPI.deleteAddress(addr.id);
            setAddresses(prev => prev.filter(a => a.id !== addr.id));
          } catch {
            Alert.alert('Error', 'Failed to delete address.');
          }
        },
      },
    ]);
  };

  const LABEL_ICONS = { Home: '🏠', Work: '🏢', Other: '📍' };
  const LABEL_COLORS = { Home: COLORS.primary, Work: COLORS.info, Other: COLORS.secondary };

  const AddressCard = ({ addr }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressCardInner}>
        <View style={styles.addressTopRow}>
          <View style={[styles.labelBadge, { backgroundColor: (LABEL_COLORS[addr.label] || COLORS.primary) + '15' }]}>
            <Text style={styles.labelIcon}>{LABEL_ICONS[addr.label] || '📍'}</Text>
            <Text style={[styles.labelText, { color: LABEL_COLORS[addr.label] || COLORS.primary }]}>{addr.label}</Text>
          </View>
          <View style={styles.addressActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(addr)}>
              <Text style={styles.editBtnIcon}>✏️</Text>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(addr)}>
              <Text style={styles.deleteBtnIcon}>🗑️</Text>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.addressDivider} />
        <View style={styles.addressBody}>
          <Text style={styles.addressLine}>{addr.addressLine1}</Text>
          {addr.addressLine2 ? <Text style={styles.addressLine}>{addr.addressLine2}</Text> : null}
          <Text style={styles.addressCityLine}>{addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.pincode}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Addresses</Text>
          <Text style={styles.headerSubtitle}>{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.headerAddBtn} onPress={openAdd}>
          <Text style={styles.headerAddIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Text style={styles.emptyIcon}>📍</Text>
          </View>
          <Text style={styles.emptyTitle}>No saved addresses</Text>
          <Text style={styles.emptySubtext}>Add an address for faster checkout</Text>
          <TouchableOpacity style={styles.addNewBtn} onPress={openAdd}>
            <Text style={styles.addNewBtnText}>+ Add New Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <AddressCard addr={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAddress ? 'Edit Address' : 'Add New Address'}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Label Selector */}
              <Text style={styles.fieldLabel}>Address Type</Text>
              <View style={styles.labelSelector}>
                {LABELS.map(label => (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.labelOption,
                      form.label === label && { borderColor: LABEL_COLORS[label], backgroundColor: LABEL_COLORS[label] + '10' }
                    ]}
                    onPress={() => setForm({ ...form, label })}
                  >
                    <Text style={styles.labelOptionIcon}>{LABEL_ICONS[label]}</Text>
                    <Text style={[styles.labelOptionText, form.label === label && { color: LABEL_COLORS[label], fontWeight: '700' }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Address Line 1 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, focusedField === 'addressLine1' && styles.inputFocused]}
                value={form.addressLine1}
                onChangeText={t => setForm({ ...form, addressLine1: t })}
                onFocus={() => setFocusedField('addressLine1')}
                onBlur={() => setFocusedField('')}
                placeholder="House no., Building, Street"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={styles.fieldLabel}>Address Line 2</Text>
              <TextInput
                style={[styles.input, focusedField === 'addressLine2' && styles.inputFocused]}
                value={form.addressLine2}
                onChangeText={t => setForm({ ...form, addressLine2: t })}
                onFocus={() => setFocusedField('addressLine2')}
                onBlur={() => setFocusedField('')}
                placeholder="Area, Landmark (optional)"
                placeholderTextColor={COLORS.textTertiary}
              />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>City <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, focusedField === 'city' && styles.inputFocused]}
                    value={form.city}
                    onChangeText={t => setForm({ ...form, city: t })}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField('')}
                    placeholder="City"
                    placeholderTextColor={COLORS.textTertiary}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'state' && styles.inputFocused]}
                    value={form.state}
                    onChangeText={t => setForm({ ...form, state: t })}
                    onFocus={() => setFocusedField('state')}
                    onBlur={() => setFocusedField('')}
                    placeholder="State"
                    placeholderTextColor={COLORS.textTertiary}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Pincode <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, focusedField === 'pincode' && styles.inputFocused]}
                value={form.pincode}
                onChangeText={t => setForm({ ...form, pincode: t.replace(/[^0-9]/g, '') })}
                onFocus={() => setFocusedField('pincode')}
                onBlur={() => setFocusedField('')}
                placeholder="6-digit pincode"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingAddress ? 'Update Address' : 'Save Address'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingVertical: 14,
    backgroundColor: COLORS.primary,
    ...SIZES.shadow.medium,
  },
  headerBack: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerBackIcon: { fontSize: 24, color: COLORS.textInverse, fontWeight: '700' },
  headerCenter: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.textInverse },
  headerSubtitle: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerAddBtn: {
    width: 38, height: 38, borderRadius: SIZES.radius,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAddIcon: { fontSize: 24, color: COLORS.textInverse, fontWeight: '700' },

  // List
  list: { padding: SIZES.padding, paddingBottom: 30 },

  // Address Card
  addressCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusXL,
    marginBottom: 14,
    ...SIZES.shadow.small,
    overflow: 'hidden',
  },
  addressCardInner: { padding: SIZES.paddingXL },
  addressTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  labelBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: SIZES.radius,
  },
  labelIcon: { fontSize: 16, marginRight: 6 },
  labelText: { fontSize: SIZES.sm, fontWeight: '700', letterSpacing: 0.3 },
  addressActions: { flexDirection: 'row', alignItems: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  editBtnIcon: { fontSize: 13, marginRight: 4 },
  editBtnText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  actionDivider: { width: 1, height: 16, backgroundColor: COLORS.divider },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  deleteBtnIcon: { fontSize: 13, marginRight: 4 },
  deleteBtnText: { fontSize: SIZES.sm, color: COLORS.error, fontWeight: '600' },
  addressDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 12 },
  addressBody: {},
  addressLine: { fontSize: SIZES.md, color: COLORS.textSecondary, marginBottom: 3, lineHeight: 20 },
  addressCityLine: { fontSize: SIZES.md, color: COLORS.textPrimary, fontWeight: '500', marginTop: 2 },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconBox: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  emptySubtext: { fontSize: SIZES.md, color: COLORS.textTertiary, marginBottom: 28, textAlign: 'center' },
  addNewBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    paddingHorizontal: 36, paddingVertical: 16,
    ...SIZES.shadow.medium,
  },
  addNewBtnText: { color: COLORS.textInverse, fontWeight: '700', fontSize: SIZES.lg, letterSpacing: 0.3 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radiusXXL, borderTopRightRadius: SIZES.radiusXXL,
    maxHeight: '92%',
    ...SIZES.shadow.large,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.paddingXL, paddingTop: SIZES.paddingXL, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { fontSize: 16, color: COLORS.textTertiary, fontWeight: '600' },
  modalScroll: { paddingHorizontal: SIZES.paddingXL, paddingBottom: 30 },

  // Form Fields
  fieldLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 16 },
  required: { color: COLORS.error },
  input: {
    height: SIZES.inputHeight,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: SIZES.radius, paddingHorizontal: 16,
    fontSize: SIZES.md, color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
    ...SIZES.shadow.small,
  },
  labelSelector: { flexDirection: 'row', gap: 10, marginTop: 4 },
  labelOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: SIZES.radius,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    gap: 6,
  },
  labelOptionIcon: { fontSize: 18 },
  labelOptionText: { fontSize: SIZES.md, color: COLORS.textTertiary, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },

  // Save Button
  saveBtn: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 28, marginBottom: 20,
    ...SIZES.shadow.medium,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.textInverse, fontWeight: '700', fontSize: SIZES.lg, letterSpacing: 0.3 },
});

