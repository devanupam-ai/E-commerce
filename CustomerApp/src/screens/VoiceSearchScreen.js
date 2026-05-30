import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, Animated, PermissionsAndroid, Platform, TextInput } from 'react-native';
import { productAPI } from '../api';

export default function VoiceSearchScreen({ navigation }) {
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      stopPulse();
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
      return;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is needed for voice search');
      return;
    }

    setIsListening(true);
    setSearchQuery('');
    startPulse();

    // Simulate voice recognition (in production, use a real speech-to-text service)
    // For now, we'll use text input as fallback
    setTimeout(() => {
      setIsListening(false);
      stopPulse();
      if (!searchQuery.trim()) {
        Alert.alert('Voice Search', 'Tap the mic and type your search query, then tap again to search');
      }
    }, 5000);
  };

  const performSearch = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await productAPI.search(query);
      setResults(res.data);
    } catch (e) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Text style={styles.placeholderIcon}>📦</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.categoryName}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.sellingPrice || item.price}</Text>
          {item.mrp && item.mrp > (item.sellingPrice || item.price) && (
            <Text style={styles.productMrp}>₹{item.mrp}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Voice Button */}
      <View style={styles.voiceSection}>
        <Animated.View style={[styles.micButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={toggleListening}
          >
            <Text style={styles.micIcon}>{isListening ? '🎙️' : '🎤'}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.voiceStatus}>
          {isListening ? 'Listening...' : 'Tap to speak'}
        </Text>

        {/* Text Input Fallback */}
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Or type your search here..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => performSearch(searchQuery)}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={() => performSearch(searchQuery)}>
            <Text style={styles.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.resultsList}
        />
      ) : searchQuery && !isListening ? (
        <View style={styles.centerContent}>
          <Text style={styles.noResults}>No products found for "{searchQuery}"</Text>
        </View>
      ) : (
        <View style={styles.centerContent}>
          <Text style={styles.hintIcon}>🗣️</Text>
          <Text style={styles.hintText}>Try saying "Milk", "Rice", or "Soap"</Text>
          <View style={styles.suggestions}>
            {['Milk', 'Rice', 'Oil', 'Soap', 'Flour'].map(s => (
              <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => { setSearchQuery(s); performSearch(s); }}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  voiceSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 3 },
  micButtonContainer: { marginBottom: 8 },
  micButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e91e63', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  micButtonActive: { backgroundColor: '#c2185b' },
  micIcon: { fontSize: 36 },
  voiceStatus: { fontSize: 14, color: '#999', marginTop: 4 },
  textInputContainer: { flexDirection: 'row', marginTop: 16, paddingHorizontal: 16, width: '100%' },
  textInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14, fontSize: 15 },
  searchBtn: { backgroundColor: '#e91e63', borderRadius: 10, width: 44, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  searchBtnText: { fontSize: 18 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, color: '#666' },
  noResults: { fontSize: 16, color: '#999', textAlign: 'center' },
  hintIcon: { fontSize: 48, marginBottom: 8 },
  hintText: { fontSize: 15, color: '#666', marginBottom: 16 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  suggestionChip: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, margin: 4, elevation: 1 },
  suggestionText: { fontSize: 14, color: '#e91e63' },
  resultsList: { padding: 12 },
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, elevation: 2 },
  productImage: { width: 70, height: 70, borderRadius: 8 },
  productImagePlaceholder: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 28 },
  productInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  productName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  productCategory: { fontSize: 12, color: '#999', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#e91e63' },
  productMrp: { fontSize: 12, color: '#999', textDecorationLine: 'line-through', marginLeft: 8 },
});
