import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image
} from 'react-native';
import { useAuthStore } from '../store';
import { userAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      setProfile(res.data);
      setForm({
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone,
      });
    } catch (err) {
      console.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await userAPI.updateProfile(form);
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      loadProfile();
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', onPress: () => logout() },
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || '👤'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.role}>📱 {user?.role || 'Customer'}</Text>
      </View>

      {/* Profile Info Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, !editing && styles.disabledInput]}
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            editable={editing}
            placeholder="Enter name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, !editing && styles.disabledInput]}
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            editable={editing}
            placeholder="Enter email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, !editing && styles.disabledInput]}
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            editable={editing}
            placeholder="Enter phone"
            keyboardType="phone-pad"
          />
        </View>

        {editing ? (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>💾 Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); loadProfile(); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Account Stats */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>📦</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>💳</Text>
            <Text style={styles.statLabel}>Payments</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>⭐</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>❤️</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ChangePassword')}>
          <Text style={styles.menuIcon}>🔐</Text>
          <Text style={styles.menuText}>Change Password</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AddressManagement')}>
          <Text style={styles.menuIcon}>📍</Text>
          <Text style={styles.menuText}>My Addresses</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={styles.menuText}>Notifications</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HelpSupport')}>
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Help & Support</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    padding: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 42 },
  userName: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.textInverse, marginBottom: 4 },
  role: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding,
    marginTop: 16,
    borderRadius: SIZES.radiusXL,
    padding: SIZES.paddingXL,
    ...SIZES.shadow.small,
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', marginBottom: 16, color: COLORS.textPrimary },
  field: { marginBottom: 16 },
  label: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '600' },
  input: {
    height: SIZES.inputHeight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceSecondary,
  },
  disabledInput: { backgroundColor: COLORS.divider, color: COLORS.textTertiary },
  buttonGroup: { flexDirection: 'row', gap: 10, marginTop: 4 },
  saveBtn: {
    flex: 1,
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    ...SIZES.shadow.medium,
  },
  saveBtnText: { color: COLORS.textInverse, fontWeight: '700', fontSize: SIZES.md },
  cancelBtn: {
    flex: 1,
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: SIZES.md },
  editBtn: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    ...SIZES.shadow.medium,
  },
  editBtnText: { color: COLORS.textInverse, fontWeight: '700', fontSize: SIZES.md },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  stat: {
    alignItems: 'center',
    marginVertical: 12,
    flex: 0.45,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingVertical: 14,
  },
  statValue: { fontSize: 30, marginBottom: 4 },
  statLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuIcon: { fontSize: 20, marginRight: 14, width: 32 },
  menuText: { flex: 1, fontSize: SIZES.md, color: COLORS.textPrimary, fontWeight: '500' },
  arrow: { fontSize: 20, color: COLORS.textTertiary },
  logoutBtn: {
    backgroundColor: COLORS.error,
    marginHorizontal: SIZES.padding,
    marginTop: 24,
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    ...SIZES.shadow.medium,
  },
  logoutBtnText: { color: COLORS.textInverse, fontWeight: '700', fontSize: SIZES.lg },
  spacer: { height: 40 },
});