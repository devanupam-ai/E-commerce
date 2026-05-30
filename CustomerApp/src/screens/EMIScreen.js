import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { orderAPI } from '../api';

export default function EMIScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [emiPlans, setEmiPlans] = useState([]);
  const [emiAmount, setEmiAmount] = useState('');

  useEffect(() => {
    fetchEligibleOrders();
  }, []);

  const fetchEligibleOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders();
      const eligible = res.data.filter(o => o.totalAmount >= 3000 && (!o.emi || !o.emi.active));
      setOrders(eligible);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateEMI = (principal, months, rate = 12) => {
    const monthlyRate = rate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi * 100) / 100;
  };

  const getEmiPlans = (amount) => {
    return [
      { months: 3, emi: calculateEMI(amount, 3), total: calculateEMI(amount, 3) * 3, rate: 12 },
      { months: 6, emi: calculateEMI(amount, 6), total: calculateEMI(amount, 6) * 6, rate: 12 },
      { months: 9, emi: calculateEMI(amount, 9), total: calculateEMI(amount, 9) * 9, rate: 14 },
      { months: 12, emi: calculateEMI(amount, 12), total: calculateEMI(amount, 12) * 12, rate: 14 },
    ];
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setEmiPlans(getEmiPlans(order.totalAmount));
  };

  const handleApplyEMI = (plan) => {
    Alert.alert(
      'Confirm EMI',
      `₹${plan.emi}/month for ${plan.months} months
Total: ₹${Math.round(plan.total)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => applyEMI(plan) },
      ]
    );
  };

  const applyEMI = async (plan) => {
    try {
      await orderAPI.applyEMI(selectedOrder.id, { months: plan.months, emiAmount: plan.emi });
      Alert.alert('Success', 'EMI applied successfully!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to apply EMI');
    }
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading...</Text></View>;
  }

  if (selectedOrder) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>EMI Plans for Order #{selectedOrder.id}</Text>
        <Text style={styles.amount}>Order Amount: ₹{selectedOrder.totalAmount}</Text>

        {emiPlans.map((plan, idx) => (
          <TouchableOpacity key={idx} style={styles.planCard} onPress={() => handleApplyEMI(plan)}>
            <View style={styles.planHeader}>
              <Text style={styles.planMonths}>{plan.months} Months</Text>
              <Text style={styles.planRate}>{plan.rate}% p.a.</Text>
            </View>
            <View style={styles.planDetails}>
              <View style={styles.planItem}>
                <Text style={styles.planLabel}>Monthly EMI</Text>
                <Text style={styles.planValue}>₹{plan.emi}</Text>
              </View>
              <View style={styles.planItem}>
                <Text style={styles.planLabel}>Total Amount</Text>
                <Text style={styles.planValue}>₹{Math.round(plan.total)}</Text>
              </View>
              <View style={styles.planItem}>
                <Text style={styles.planLabel}>Interest</Text>
                <Text style={styles.planValue}>₹{Math.round(plan.total - selectedOrder.totalAmount)}</Text>
              </View>
            </View>
            <View style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply EMI</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedOrder(null)}>
          <Text style={styles.backBtnText}>← Back to Orders</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EMI Options</Text>
      <Text style={styles.subtitle}>Select an order (₹3000+) to apply EMI</Text>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No eligible orders for EMI</Text>
          <Text style={styles.emptySub}>Orders above ₹3000 are eligible</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.orderCard} onPress={() => handleSelectOrder(item)}>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={styles.orderAmount}>₹{item.totalAmount}</Text>
              <Text style={styles.orderDate}>{item.orderDate}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  amount: { fontSize: 18, color: '#e91e63', fontWeight: '600', marginBottom: 16 },
  orderCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  orderId: { fontSize: 16, fontWeight: '600', color: '#333' },
  orderAmount: { fontSize: 20, fontWeight: 'bold', color: '#e91e63', marginTop: 4 },
  orderDate: { fontSize: 12, color: '#999', marginTop: 4 },
  planCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  planMonths: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  planRate: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  planDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  planItem: { alignItems: 'center' },
  planLabel: { fontSize: 11, color: '#999' },
  planValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  applyBtn: { backgroundColor: '#e91e63', padding: 10, borderRadius: 8, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  backBtn: { marginTop: 16, marginBottom: 32, alignItems: 'center' },
  backBtnText: { color: '#e91e63', fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb', marginTop: 4 },
});
