
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Image } from 'react-native';
import { smartSearchAPI, productAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';
import { useCartStore, useWishlistStore } from '../store';

const SORT_OPTIONS = [
  { label: 'Relevance', value: '' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Newest First', value: 'newest_desc' },
];

export default function SmartSearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  const { addItem, items, updateQty } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await productAPI.getCategories();
      setCategories(res.data || []);
    } catch (e) {}
  };

  const handleSearch = async () => {
    if (!query.trim() && !selectedCategory && !minPrice && !maxPrice) return;
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.q = query.trim();
      if (selectedCategory) params.categoryId = selectedCategory;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      if (inStock) params.inStock = true;
      if (sortBy) {
        const parts = sortBy.split('_');
        params.sortBy = parts[0];
        params.sortDir = parts[1];
      }
      const res = await smartSearchAPI.search(params);
      setProducts(res.data.products || []);
      setTotalResults(res.data.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setMinPrice(''); setMaxPrice(''); setInStock(false); setSelectedCategory(null); setSortBy('');
  };

  const renderProduct = ({ item }) => {
    const cartItem = items.find(i => i.product.id === item.id);
    const qty = cartItem?.quantity || 0;
    const price = item.sellingPrice || item.price || 0;
    const mrp = item.mrp || 0;
    const inWl = isInWishlist(item.id);

    return (
      <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product: item })} activeOpacity={0.7}>
        <View style={styles.productImageBox}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Text style={styles.productEmoji}>{item.category?.emoji || '🛍️'}</Text>
          )}
          <TouchableOpacity style={styles.wishlistBtn} onPress={() => inWl ? removeFromWishlist(item.id) : addToWishlist(item)}>
            <Text style={styles.wishlistIcon}>{inWl ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.sellingPrice}>₹{price}</Text>
          {mrp > price && <Text style={styles.mrp}>₹{mrp}</Text>}
          {item.discountPercent > 0 && <Text style={styles.discount}>{item.discountPercent}% OFF</Text>}
        </View>
        {qty > 0 ? (
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, qty - 1)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, qty + 1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item)}>
            <Text style={styles.addBtnText}>ADD</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
          <Text style={styles.filterBtnText}>{showFilters ? '🔼' : '🔽'} Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceInputs}>
              <TextInput style={styles.priceInput} placeholder="Min" value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
              <Text style={styles.priceDash}>—</Text>
              <TextInput style={styles.priceInput} placeholder="Max" value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <TouchableOpacity style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]} onPress={() => setSelectedCategory(null)}>
                <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All</Text>
              </TouchableOpacity>
              {categories.map(c => (
                <TouchableOpacity key={c.id} style={[styles.categoryChip, selectedCategory === c.id && styles.categoryChipActive]} onPress={() => setSelectedCategory(c.id)}>
                  <Text style={[styles.categoryChipText, selectedCategory === c.id && styles.categoryChipTextActive]}>{c.emoji} {c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.value} style={[styles.categoryChip, sortBy === opt.value && styles.categoryChipActive]} onPress={() => setSortBy(opt.value)}>
                  <Text style={[styles.categoryChipText, sortBy === opt.value && styles.categoryChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.inStockRow} onPress={() => setInStock(!inStock)}>
              <Text style={{ fontSize: 18 }}>{inStock ? '✅' : '⬜'}</Text>
              <Text style={styles.filterLabel}>In Stock Only</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearFilters}><Text style={styles.clearText}>Clear All</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {totalResults > 0 && <Text style={styles.resultCount}>{totalResults} products found</Text>}
          <FlatList
            data={products}
            keyExtractor={item => item.id?.toString()}
            renderItem={renderProduct}
            numColumns={2}
            contentContainerStyle={styles.productList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 48 }}>🔍</Text>
                <Text style={styles.emptyText}>Search for products with filters</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: COLORS.surface, gap: 8 },
  searchInput: { flex: 1, height: 44, backgroundColor: COLORS.surfaceSecondary, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  filterBtn: { height: 44, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: COLORS.surfaceSecondary, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  searchBtn: { height: 44, width: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 12 },
  searchBtnText: { fontSize: 18 },
  filtersContainer: { backgroundColor: COLORS.surface, padding: 16, borderBottomWidth: 1, borderColor: COLORS.divider },
  filterRow: { marginBottom: 12 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInput: { flex: 1, height: 40, backgroundColor: COLORS.surfaceSecondary, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  priceDash: { color: COLORS.textTertiary, fontSize: 16 },
  categoryScroll: { flexDirection: 'row' },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.surfaceSecondary, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  categoryChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  categoryChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  inStockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearText: { color: COLORS.error, fontSize: 13, fontWeight: '600' },
  resultCount: { padding: 12, fontSize: 13, color: COLORS.textTertiary, fontWeight: '600' },
  productList: { padding: 8 },
  productCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, margin: 6, padding: 8, maxWidth: '50%', ...SIZES.shadow?.small || { elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 } },
  productImageBox: { height: 110, backgroundColor: COLORS.surfaceSecondary, borderRadius: 10, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  productImage: { width: '100%', height: '100%', borderRadius: 10 },
  productEmoji: { fontSize: 36 },
  wishlistBtn: { position: 'absolute', top: 4, right: 4, zIndex: 2 },
  wishlistIcon: { fontSize: 16 },
  productName: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, marginTop: 6, lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  sellingPrice: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  mrp: { fontSize: 11, color: COLORS.textTertiary, textDecorationLine: 'line-through' },
  discount: { fontSize: 10, color: COLORS.success, fontWeight: '700' },
  addBtn: { marginTop: 6, height: 30, borderRadius: 8, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.primary },
  addBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6, height: 30, borderRadius: 8, backgroundColor: COLORS.primary, gap: 12 },
  qtyBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: COLORS.textInverse, fontSize: 16, fontWeight: '700' },
  qtyText: { color: COLORS.textInverse, fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: COLORS.textTertiary, marginTop: 8 },
});

import { ScrollView } from 'react-native';
