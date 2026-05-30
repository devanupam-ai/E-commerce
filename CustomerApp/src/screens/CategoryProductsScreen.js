import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, ScrollView
} from 'react-native';
import { productAPI } from '../api';
import { useCartStore } from '../store';
import { COLORS, SIZES } from '../utils/theme';

const SORT_OPTIONS = [
  { id: 'default', label: 'Relevance' },
  { id: 'price_asc', label: 'Price ↑' },
  { id: 'price_desc', label: 'Price ↓' },
  { id: 'discount', label: 'Discount' },
];

const getPrice = (p) => p.sellingPrice || p.price || 0;

const ProductRow = React.memo(({ product }) => {
  const { addItem, items, updateQty } = useCartStore();
  const cartItem = items.find(i => i.product.id === product.id);
  const qty = cartItem?.quantity || 0;
  const outOfStock = product.stockQuantity <= 0;
  const price = getPrice(product);
  const mrp = product.mrp || 0;
  const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleAdd = () => {
    if (outOfStock) return Alert.alert('Out of Stock', `${product.name} is currently unavailable.`);
    addItem(product);
  };

  const handleIncrease = () => {
    if (qty >= product.stockQuantity)
      return Alert.alert('Stock Limit', `Only ${product.stockQuantity} units available.`);
    updateQty(product.id, qty + 1);
  };

  return (
    <View style={[styles.productRow, outOfStock && { opacity: 0.55 }]}>
      {/* Image */}
      <View style={styles.imageBox}>
        <Text style={styles.productEmoji}>{product.category?.emoji || '🛍️'}</Text>
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}%{'\n'}OFF</Text>
          </View>
        )}
        {outOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT{'\n'}OF{'\n'}STOCK</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productUnit}>{product.unit}</Text>
        {!!product.description && (
          <Text style={styles.productDesc} numberOfLines={1}>{product.description}</Text>
        )}
        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
          <Text style={styles.lowStock}>⚠️ Only {product.stockQuantity} left</Text>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price}</Text>
          {mrp > price && mrp > 0 && <Text style={styles.mrp}>₹{mrp}</Text>}
          {discount > 0 && <Text style={styles.saving}>Save ₹{(mrp - price).toFixed(0)}</Text>}
        </View>
      </View>

      {/* Cart control */}
      <View style={styles.cartControl}>
        {qty === 0 ? (
          <TouchableOpacity
            style={[styles.addBtn, outOfStock && styles.addBtnDisabled]}
            onPress={handleAdd}
            activeOpacity={0.7}
          >
            <Text style={[styles.addBtnText, outOfStock && { color: COLORS.gray }]}>
              {outOfStock ? 'SOLD\nOUT' : 'ADD'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyBox}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(product.id, qty - 1)}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrease}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

export default function CategoryProductsScreen({ navigation, route }) {
  const { category } = route.params;
  const passedCategories = route.params.allCategories || [];

  const [allCategories, setAllCategories] = useState(passedCategories);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [selectedCat, setSelectedCat] = useState(category);

  const totalItems = useCartStore(s => s.getTotalItems());
  const subtotal = useCartStore(s => s.getSubtotal());

  // Load categories if not passed (race condition fallback)
  useEffect(() => {
    if (passedCategories.length === 0) {
      productAPI.getCategories()
        .then(res => setAllCategories(res.data))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    loadProducts(selectedCat.id);
    setSearch('');
    setSortBy('default');
  }, [selectedCat.id]);

  const loadProducts = async (catId) => {
    setLoading(true);
    try {
      const res = await productAPI.getByCategory(catId);
      setProducts(res.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load products. Check your connection.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (text) => {
    setSearch(text);
    if (text.length > 2) {
      setLoading(true);
      try {
        const res = await productAPI.search(text);
        setProducts((res.data || []).filter(p => p.category?.id === selectedCat.id));
      } finally { setLoading(false); }
    } else if (text.length === 0) {
      loadProducts(selectedCat.id);
    }
  }, [selectedCat.id]);

  const getSorted = () => {
    const list = [...products];
    if (sortBy === 'price_asc') return list.sort((a, b) => getPrice(a) - getPrice(b));
    if (sortBy === 'price_desc') return list.sort((a, b) => getPrice(b) - getPrice(a));
    if (sortBy === 'discount') return list.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    return list;
  };

  const displayProducts = getSorted();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${selectedCat.name}...`}
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); loadProducts(selectedCat.id); }}>
              <Text style={{ color: COLORS.gray, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {allCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.sidebarItem, selectedCat.id === cat.id && styles.sidebarItemActive]}
                onPress={() => setSelectedCat(cat)}
              >
                <Text style={styles.sidebarEmoji}>{cat.emoji || '📦'}</Text>
                <Text style={[styles.sidebarLabel, selectedCat.id === cat.id && styles.sidebarLabelActive]} numberOfLines={2}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right Product Area */}
        <View style={styles.productArea}>
          {/* Category title + count */}
          <View style={styles.catHeader}>
            <Text style={styles.catTitle}>{selectedCat.emoji} {selectedCat.name}</Text>
            <Text style={styles.productCount}>{products.length} items</Text>
          </View>

          {/* Sort pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sortPill, sortBy === opt.id && styles.sortPillActive]}
                onPress={() => setSortBy(opt.id)}
              >
                <Text style={[styles.sortPillText, sortBy === opt.id && styles.sortPillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : displayProducts.length === 0 ? (
            <View style={styles.centered}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubText}>Try a different category or search</Text>
            </View>
          ) : (
            <FlatList
              data={displayProducts}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => <ProductRow product={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </View>

      {/* Cart Footer */}
      {totalItems > 0 && (
        <TouchableOpacity style={styles.cartFooter} onPress={() => navigation.navigate('Cart')}>
          <View>
            <Text style={styles.cartFooterItems}>{totalItems} item{totalItems > 1 ? 's' : ''} added</Text>
            <Text style={styles.cartFooterAmount}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <Text style={styles.cartFooterAction}>View Cart →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: COLORS.gray, fontSize: SIZES.sm },

  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, paddingHorizontal: 8, paddingVertical: 10, elevation: 3,
  },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 22, color: COLORS.black },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 8,
    paddingHorizontal: 10, marginHorizontal: 8, height: 40,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: SIZES.sm, color: COLORS.black, padding: 0 },
  cartBtn: { position: 'relative', padding: 6 },
  cartIcon: { fontSize: 24 },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.primary, borderRadius: 10,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: 'bold' },

  body: { flex: 1, flexDirection: 'row' },

  sidebar: {
    width: 82, backgroundColor: COLORS.white,
    borderRightWidth: 1, borderRightColor: COLORS.lightGray,
  },
  sidebarItem: {
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
    borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  sidebarItemActive: { borderLeftColor: COLORS.primary, backgroundColor: '#F0FFF4' },
  sidebarEmoji: { fontSize: 22, marginBottom: 3 },
  sidebarLabel: { fontSize: 9, color: COLORS.gray, textAlign: 'center', fontWeight: '500' },
  sidebarLabelActive: { color: COLORS.primary, fontWeight: 'bold' },

  productArea: { flex: 1 },
  catHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4,
  },
  catTitle: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black },
  productCount: { fontSize: SIZES.xs, color: COLORS.gray },

  sortRow: { paddingHorizontal: 8, paddingVertical: 6, flexGrow: 0 },
  sortPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white, marginRight: 6,
  },
  sortPillActive: { borderColor: COLORS.primary, backgroundColor: '#F0FFF4' },
  sortPillText: { fontSize: SIZES.xs, color: COLORS.gray },
  sortPillTextActive: { color: COLORS.primary, fontWeight: 'bold' },

  productRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 12,
  },
  separator: { height: 1, backgroundColor: COLORS.lightGray },
  imageBox: {
    width: 70, height: 70, backgroundColor: COLORS.background,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    marginRight: 10, position: 'relative',
  },
  productEmoji: { fontSize: 36 },
  discountBadge: {
    position: 'absolute', top: 2, left: 2,
    backgroundColor: '#FF4444', borderRadius: 3,
    paddingHorizontal: 3, paddingVertical: 1,
  },
  discountText: { color: COLORS.white, fontSize: 7, fontWeight: 'bold', textAlign: 'center' },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  outOfStockText: { color: COLORS.white, fontSize: 8, fontWeight: 'bold', textAlign: 'center' },

  productInfo: { flex: 1, marginRight: 6 },
  productName: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.black, marginBottom: 2 },
  productUnit: { fontSize: SIZES.xs, color: COLORS.gray, marginBottom: 1 },
  productDesc: { fontSize: SIZES.xs, color: COLORS.gray, marginBottom: 2 },
  lowStock: { fontSize: SIZES.xs, color: '#FF6B00', fontWeight: 'bold', marginBottom: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  price: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black },
  mrp: { fontSize: SIZES.xs, color: COLORS.gray, textDecorationLine: 'line-through' },
  saving: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: 'bold' },

  cartControl: { alignItems: 'center', justifyContent: 'center', width: 76 },
  addBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 8,
    width: 68, height: 36, justifyContent: 'center', alignItems: 'center',
  },
  addBtnDisabled: { borderColor: COLORS.lightGray },
  addBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: SIZES.sm, textAlign: 'center' },
  qtyBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, borderRadius: 8, width: 80, height: 36,
  },
  qtyBtn: { paddingHorizontal: 8, height: '100%', justifyContent: 'center' },
  qtyBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: 'bold' },
  qtyText: { color: COLORS.white, fontWeight: 'bold', fontSize: SIZES.md },

  emptyText: { fontSize: SIZES.md, color: COLORS.gray, marginTop: 12, fontWeight: 'bold' },
  emptySubText: { fontSize: SIZES.sm, color: COLORS.gray, marginTop: 4 },

  cartFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.primary, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 10,
  },
  cartFooterItems: { color: COLORS.white, fontSize: SIZES.xs, opacity: 0.85 },
  cartFooterAmount: { color: COLORS.white, fontWeight: 'bold', fontSize: SIZES.md },
  cartFooterAction: { color: COLORS.white, fontWeight: 'bold', fontSize: SIZES.md },
});
