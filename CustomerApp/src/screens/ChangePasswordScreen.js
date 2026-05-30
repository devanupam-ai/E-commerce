
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { userAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      return Alert.alert('Missing Field', 'Please enter your current password.');
    }
    if (!newPassword.trim()) {
      return Alert.alert('Missing Field', 'Please enter a new password.');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Weak Password', 'New password must be at least 6 characters.');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Mismatch', 'New password and confirm password do not match.');
    }
    if (currentPassword === newPassword) {
      return Alert.alert('Same Password', 'New password must be different from current password.');
    }

    setLoading(true);
    try {
      await userAPI.changePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Password changed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔐 Change Password</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoTitle}>Secure Your Account</Text>
          <Text style={styles.infoText}>
            Choose a strong password with at least 6 characters, including numbers and special characters.
          </Text>
        </View>

        {/* Current Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
              <Text style={styles.eyeIcon}>{showCurrent ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
              <Text style={styles.eyeIcon}>{showNew ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View style={[
                  styles.strengthFill,
                  { width: `${Math.min((newPassword.length / 8) * 100, 100)}%`, backgroundColor: newPassword.length < 4 ? COLORS.red : newPassword.length < 6 ? COLORS.yellow : COLORS.success },
                ]} />
              </View>
              <Text style={[styles.strengthText, { color: newPassword.length < 4 ? COLORS.red : newPassword.length < 6 ? COLORS.yellow : COLORS.success }]}>
                {newPassword.length < 4 ? 'Weak' : newPassword.length < 6 ? 'Fair' : 'Strong'}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
              <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <Text style={styles.mismatchText}>❌ Passwords do not match</Text>
          )}
          {confirmPassword.length > 0 && newPassword === confirmPassword && (
            <Text style={styles.matchText}>✅ Passwords match</Text>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Password Tips</Text>
          <Text style={styles.tipItem}>• At least 6 characters long</Text>
          <Text style={styles.tipItem}>• Mix of letters and numbers</Text>
          <Text style={styles.tipItem}>• Include special characters (!@#$)</Text>
          <Text style={styles.tipItem}>• Avoid using your name or email</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>🔒 Change Password</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: { padding: SIZES.padding },
  infoCard: {
    backgroundColor: COLORS.primary + '10', borderRadius: SIZES.radius,
    padding: 16, alignItems: 'center', marginBottom: 24,
  },
  infoIcon: { fontSize: 36, marginBottom: 8 },
  infoTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  infoText: { fontSize: SIZES.sm, color: COLORS.gray, textAlign: 'center' },
  field: { marginBottom: 16 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: '#555', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8,
    backgroundColor: COLORS.white, paddingRight: 4,
  },
  input: {
    flex: 1, padding: 12, fontSize: SIZES.md, color: COLORS.black,
  },
  eyeBtn: { padding: 10 },
  eyeIcon: { fontSize: 18 },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  strengthBar: {
    flex: 1, height: 4, backgroundColor: COLORS.lightGray, borderRadius: 2,
  },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthText: { fontSize: SIZES.xs, fontWeight: '600' },
  mismatchText: { fontSize: SIZES.xs, color: COLORS.red, marginTop: 4 },
  matchText: { fontSize: SIZES.xs, color: COLORS.success, marginTop: 4 },
  tipsCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.lightGray,
  },
  tipsTitle: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black, marginBottom: 8 },
  tipItem: { fontSize: SIZES.sm, color: COLORS.gray, marginBottom: 4 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    padding: 16, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: 'bold' },
});
