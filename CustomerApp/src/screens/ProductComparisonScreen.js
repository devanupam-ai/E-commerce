import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, Image } from 'react-native';
import { productAPI } from '../api';

export default function ProductComparisonScreen({ route, navigation }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch products');
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await productAPI.search(query);
      setSearchResults(res.data);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addProduct = (product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      Alert.alert('Already added', 'This product is already in comparison');
      return;
    }
    if (selectedProducts.length >= 4) {
      Alert.alert('Limit reached', 'You can compare up to 4 products');
      return;
    }
    setSelectedProducts([...selectedProducts, product]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const getAttr = (product, attrName) => {
    if (product.attributes && product.attributes[attrName]) return product.attributes[attrName];
    if (product.description) {
      const match = product.description.match(new RegExp(attrName + ':\s*([^,\n]+)', 'i'));
      if (match) return match[1];
    }
    return '-';
  };

  const comparisonAttrs = ['Brand', 'Price', 'Weight', 'Color', 'Material', 'Size', 'Warranty'];

  const getCompareValue = (product, attr) => {
    switch(attr) {
      case 'Brand': return product.brand || product.categoryName || '-';
      case 'Price': return `₹${product.price || product.sellingPrice || 0}`;
      case 'Weight': return getAttr(product, 'weight');
      case 'Color': return getAttr(product, 'color');
      case 'Material': return getAttr(product, 'material');
      case 'Size': return getAttr(product, 'size');
      case 'Warranty': return getAttr(product, 'warranty');
      default: return '-';
    }
  };

  const getBestForAttr = (attr) => {
    if (attr !== 'Price' || selectedProducts.length < 2) return -1;
    let minIdx = 0, minVal = Infinity;
    selectedProducts.forEach((p, i) => {
      const price = p.price || p.sellingPrice || Infinity;
      if (price < minVal) { minVal = price; minIdx = i; }
    });
    return minIdx;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compare Products</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products to compare..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchResults.length > 0 && (
          <View style={styles.searchDropdown}>
            {searchResults.slice(0, 5).map(item => (
              <TouchableOpacity key={item.id} style={styles.searchItem} onPress={() => addProduct(item)}>
                <Text style={styles.searchItemName}>{item.name}</Text>
                <Text style={styles.searchItemPrice}>₹{item.price || item.sellingPrice}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Selected Products */}
      {selectedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚖️</Text>
          <Text style={styles.emptyText}>Search & add products to compare</Text>
          <Text style={styles.emptySub}>You can compare up to 4 products</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsRow}>
          {selectedProducts.map(product => (
            <View key={product.id} style={styles.productCard}>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeProduct(product.id)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.placeholderText}>📦</Text>
                </View>
              )}
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <Text style={styles.productPrice}>₹{product.price || product.sellingPrice}</Text>
            </View>
          ))}
          {selectedProducts.length < 4 && (
            <TouchableOpacity style={styles.addMoreCard} onPress={() => setSearchQuery(' ')}>
              <Text style={styles.addMoreIcon}>+</Text>
              <Text style={styles.addMoreText}>Add Product</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Comparison Table */}
      {selectedProducts.length >= 2 && (
        <ScrollView style={styles.comparisonTable}>
          <Text style={styles.tableTitle}>Detailed Comparison</Text>
          {comparisonAttrs.map((attr, idx) => {
            const bestIdx = getBestForAttr(attr);
            return (
              <View key={idx} style={[styles.comparisonRow, idx % 2 === 0 && styles.comparisonRowAlt]}>
                <Text style={styles.attrLabel}>{attr}</Text>
                <View style={styles.attrValues}>
                  {selectedProducts.map((p, pIdx) => (
                    <Text key={p.id} style={[styles.attrValue, pIdx === bestIdx && styles.bestValue]}>
                      {getCompareValue(p, attr)} {pIdx === bestIdx ? '✓' : ''}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  searchContainer: { marginBottom: 16, zIndex: 10 },
  searchInput: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15, elevation: 2 },
  searchDropdown: { backgroundColor: '#fff', borderRadius: 10, marginTop: 4, elevation: 4, maxHeight: 200 },
  searchItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  searchItemName: { fontSize: 14, color: '#333', flex: 1 },
  searchItemPrice: { fontSize: 14, color: '#e91e63', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#666' },
  emptySub: { fontSize: 13, color: '#999', marginTop: 4 },
  productsRow: { maxHeight: 160, marginBottom: 16 },
  productCard: { width: 130, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginRight: 10, elevation: 2, alignItems: 'center' },
  removeBtn: { position: 'absolute', top: 4, right: 4, zIndex: 1, width: 22, height: 22, borderRadius: 11, backgroundColor: '#ff5252', justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  productImage: { width: 70, height: 70, borderRadius: 8, marginBottom: 6 },
  productImagePlaceholder: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  placeholderText: { fontSize: 28 },
  productName: { fontSize: 12, color: '#333', textAlign: 'center', marginBottom: 2 },
  productPrice: { fontSize: 14, color: '#e91e63', fontWeight: 'bold' },
  addMoreCard: { width: 100, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#e91e63', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  addMoreIcon: { fontSize: 28, color: '#e91e63' },
  addMoreText: { fontSize: 11, color: '#e91e63', marginTop: 4 },
  comparisonTable: { flex: 1 },
  tableTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  comparisonRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8 },
  comparisonRowAlt: { backgroundColor: '#fff', borderRadius: 8 },
  attrLabel: { width: 80, fontSize: 13, fontWeight: '600', color: '#666' },
  attrValues: { flex: 1, flexDirection: 'row' },
  attrValue: { flex: 1, fontSize: 13, color: '#333' },
  bestValue: { color: '#4CAF50', fontWeight: 'bold' },
});
