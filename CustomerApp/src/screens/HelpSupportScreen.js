
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Linking,
} from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'We offer 10-minute instant delivery, 30-minute express delivery, and 2-hour standard delivery depending on your location and product availability.',
  },
  {
    q: 'How can I cancel my order?',
    a: 'You can cancel your order from the Orders section before it is picked up for delivery. Once out for delivery, cancellation is not possible.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept UPI (Google Pay, PhonePe, Paytm), Net Banking, Credit/Debit Cards, and Cash on Delivery (COD).',
  },
  {
    q: 'How do I apply a coupon code?',
    a: 'You can apply coupon codes during checkout. Enter the code in the "Apply Coupon" section and the discount will be reflected in your bill.',
  },
  {
    q: 'What is the return/refund policy?',
    a: 'We offer a 7-day return policy on most items. Refunds are processed within 3-5 business days to your original payment method.',
  },
  {
    q: 'How do I track my order?',
    a: 'Go to the Orders tab and tap on any active order to see its real-time status. You will also receive push notifications for status updates.',
  },
  {
    q: 'Is there a minimum order value?',
    a: 'There is no minimum order value! However, orders above ₹200 qualify for free delivery. A nominal delivery fee applies for orders below ₹200.',
  },
  {
    q: 'How do I add a delivery address?',
    a: 'You can add addresses during checkout or from Profile > My Addresses. You can save multiple addresses (Home, Work, etc.).',
  },
];

const CONTACT_OPTIONS = [
  { icon: '📞', title: 'Call Us', subtitle: '1800-XXX-XXXX (Toll Free)', action: 'tel:+911800XXXXXX' },
  { icon: '📧', title: 'Email', subtitle: 'support@quickcommerce.in', action: 'mailto:support@quickcommerce.in' },
  { icon: '💬', title: 'WhatsApp', subtitle: 'Chat with us', action: 'https://wa.me/919876543210' },
];

export default function HelpSupportScreen({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('suggestion');

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleContact = (action) => {
    Linking.canOpenURL(action).then(supported => {
      if (supported) Linking.openURL(action);
      else Alert.alert('Error', 'Cannot open this link on your device.');
    });
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      return Alert.alert('Empty Feedback', 'Please write your feedback before submitting.');
    }
    // In a real app, this would call an API
    Alert.alert('Thank You! 🙏', 'Your feedback has been submitted. We appreciate your input!', [
      { text: 'OK', onPress: () => { setFeedbackText(''); setFeedbackType('suggestion'); } },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>❓ Help & Support</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contact Us</Text>
          <View style={styles.contactGrid}>
            {CONTACT_OPTIONS.map((opt, i) => (
              <TouchableOpacity key={i} style={styles.contactCard} onPress={() => handleContact(opt.action)}>
                <Text style={styles.contactIcon}>{opt.icon}</Text>
                <Text style={styles.contactTitle}>{opt.title}</Text>
                <Text style={styles.contactSubtitle}>{opt.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Frequently Asked Questions</Text>
          {FAQS.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqCard}
              onPress={() => toggleFaq(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Text style={styles.faqArrow}>{expandedFaq === index ? '▲' : '▼'}</Text>
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Send Us Feedback</Text>
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackTypeRow}>
              {['suggestion', 'complaint', 'other'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.feedbackTypeBtn, feedbackType === type && styles.feedbackTypeBtnActive]}
                  onPress={() => setFeedbackType(type)}
                >
                  <Text style={[styles.feedbackTypeText, feedbackType === type && styles.feedbackTypeTextActive]}>
                    {type === 'suggestion' ? '💡' : type === 'complaint' ? '😤' : '📝'} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.feedbackInput}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Tell us what's on your mind..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.submitFeedbackBtn} onPress={handleSubmitFeedback}>
              <Text style={styles.submitFeedbackBtnText}>📤 Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>QuickCommerce v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>Made with ❤️ in India</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },
  contactGrid: { gap: 10 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: SIZES.radius, padding: 16, elevation: 1,
  },
  contactIcon: { fontSize: 28, marginRight: 12 },
  contactTitle: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black, flex: 1 },
  contactSubtitle: { fontSize: SIZES.sm, color: COLORS.gray },
  faqCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 16, marginBottom: 8, elevation: 1,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.black, flex: 1, marginRight: 8 },
  faqArrow: { fontSize: SIZES.xs, color: COLORS.gray },
  faqAnswer: { fontSize: SIZES.md, color: COLORS.gray, marginTop: 10, lineHeight: 20 },
  feedbackCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16, elevation: 1,
  },
  feedbackTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  feedbackTypeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.lightGray, backgroundColor: '#F9F9F9',
  },
  feedbackTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  feedbackTypeText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.gray },
  feedbackTypeTextActive: { color: COLORS.primary },
  feedbackInput: {
    borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8,
    padding: 12, fontSize: SIZES.md, backgroundColor: '#F9F9F9',
    minHeight: 100, marginBottom: 12,
  },
  submitFeedbackBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, padding: 14, alignItems: 'center',
  },
  submitFeedbackBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: SIZES.md },
  appInfo: { alignItems: 'center', marginTop: 8 },
  appInfoText: { fontSize: SIZES.sm, color: COLORS.gray },
  appInfoSubtext: { fontSize: SIZES.xs, color: COLORS.lightGray, marginTop: 4 },
});
