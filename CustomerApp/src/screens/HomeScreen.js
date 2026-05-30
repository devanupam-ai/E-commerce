import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Image,
  PermissionsAndroid, RefreshControl, StatusBar,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { productAPI } from '../api';
import { useCartStore, useWishlistStore } from '../store';
import { COLORS, SIZES } from '../utils/theme';

const BANNERS = [
  { id: 1, emoji: '⚡', title: '10 Min Delivery', subtitle: 'Get groceries at your door', bg: '#0C831F' },
  { id: 2, emoji: '🎉', title: 'Free Delivery', subtitle: 'On orders above ₹200', bg: '#FF6B35' },
  { id: 3, emoji: '💰', title: 'Best Prices', subtitle: 'Save more every day', bg: '#7C3AED' },
];

const ProductCard = React.memo(({ product, onPress }) => {
  const { addItem, items, updateQty } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const cartItem = items.find(i => i.product.id === product.id);
  const qty = cartItem?.quantity || 0;
  const outOfStock = product.stockQuantity <= 0;
  const price = product.sellingPrice || product.price || 0;
  const mrp = product.mrp || 0;
  const inWishlist = isInWishlist(product.id);

  const handleAdd = useCallback(() => {
    if (outOfStock) return Alert.alert('Out of Stock', `${product.name} is currently unavailable.`);
    addItem(product);
  }, [outOfStock, product, addItem]);

  const handleIncrease = useCallback(() => {
    if (qty >= product.stockQuantity)
      return Alert.alert('Stock Limit', `Only ${product.stockQuantity} units available.`);
    updateQty(product.id, qty + 1);
  }, [qty, product, updateQty]);

  const toggleWishlist = useCallback(() => {
    if (inWishlist) removeFromWishlist(product.id);
    else addToWishlist(product);
  }, [inWishlist, product, addToWishlist, removeFromWishlist]);

  return (
    <TouchableOpacity
      style={[styles.productCard, outOfStock && styles.outOfStockCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.productImageBox}>
        {(product.imageUrl || (product.images && product.images.length > 0)) ? (
          <Image source={{ uri: product.imageUrl || product.images[0].imageUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <Text style={styles.productEmoji}>{product.category?.emoji || '🛍️'}</Text>
        )}
        <TouchableOpacity style={styles.wishlistBtn} onPress={toggleWishlist}>
          <Text style={styles.wishlistIcon}>{inWishlist ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
        {product.discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{Math.round(product.discountPercent)}% OFF</Text>
          </View>
        )}
        {outOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>
      <Text style={styles.productUnit}>{product.unit}</Text>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
        <Text style={styles.lowStockText}>Only {product.stockQuantity} left!</Text>
      )}
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{price}</Text>
        {mrp > price && mrp > 0 && <Text style={styles.mrp}>₹{mrp}</Text>}
      </View>
      {qty === 0 ? (
        <TouchableOpacity
          style={[styles.addBtn, outOfStock && styles.addBtnDisabled]}
          onPress={handleAdd}
          activeOpacity={0.7}
        >
          <Text style={[styles.addBtnText, outOfStock && { color: COLORS.gray }]}>
            {outOfStock ? 'SOLD OUT' : 'ADD'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyControl}>
          <TouchableOpacity onPress={() => updateQty(product.id, qty - 1)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity onPress={handleIncrease} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const totalItems = useCartStore(s => s.getTotalItems());
  const subtotal = useCartStore(s => s.getSubtotal());
  const setUserLocation = useCartStore(s => s.setLocation);

  useEffect(() => {
    loadAll();
    requestLocation();
    const timer = setInterval(() => setBannerIndex(i => (i + 1) % BANNERS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        productAPI.getCategories(),
        productAPI.getAll(),
      ]);
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
    } catch {
      Alert.alert('Connection Error', 'Could not load products. Check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearch('');
    setSelectedCategory(null);
    loadAll();
  }, []);

  const requestLocation = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          pos => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocation(loc);
            setUserLocation(loc);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } catch {}
  };

  const handleSearch = useCallback(async (text) => {
    setSearch(text);
    setSelectedCategory(null);
    if (text.length > 2) {
      setLoading(true);
      try {
        const res = await productAPI.search(text);
        setProducts(res.data || []);
      } catch {} finally { setLoading(false); }
    } else if (text.length === 0) {
      loadAll();
    }
  }, []);

  const handleCategoryPress = useCallback((cat) => {
    if (selectedCategory?.id === cat.id) {
      setSelectedCategory(null);
      loadAll();
      return;
    }
    setSelectedCategory(cat);
    setSearch('');
    setLoading(true);
    productAPI.getByCategory(cat.id)
      .then(res => setProducts(res.data || []))
      .catch(() => Alert.alert('Error', 'Failed to load category products'))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const handleCategoryNavigate = useCallback((cat) => {
    navigation.navigate('CategoryProducts', { category: cat, allCategories: categories });
  }, [categories, navigation]);

  const handleProductPress = useCallback((product) => {
    navigation.navigate('ProductDetail', { product, productId: product.id });
  }, [navigation]);

  const banner = BANNERS[bannerIndex];
  const displayProducts = products;
  const featuredProducts = products.filter(p => p.discountPercent > 10 && p.stockQuantity > 0).slice(0, 6);

  const ListHeader = (
    <>
      {/* Banner */}
      {!search && !selectedCategory && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.banner, { backgroundColor: banner.bg }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
          </View>
          <Text style={styles.bannerEmoji}>{banner.emoji}</Text>
          <View style={styles.bannerDots}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
            ))}
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Features */}
      {!search && !selectedCategory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Quick Features</Text>
          <View style={styles.featureGrid}>
            <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('EMI')}>
              <View style={[styles.featureIconBox, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.featureIcon}>💳</Text>
              </View>
              <Text style={styles.featureLabel}>EMI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('ProductComparison')}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.featureIcon}>⚖️</Text>
              </View>
              <Text style={styles.featureLabel}>Compare</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('VoiceSearch')}>
              <View style={[styles.featureIconBox, { backgroundColor: '#F3E5F5' }]}>
                <Text style={styles.featureIcon}>🎤</Text>
              </View>
              <Text style={styles.featureLabel}>Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('LoyaltyPoints')}>
              <View style={[styles.featureIconBox, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.featureIcon}>🏆</Text>
              </View>
              <Text style={styles.featureLabel}>Rewards</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Category Grid */}
      {!search && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛍️ Shop by Category</Text>
            <TouchableOpacity onPress={() => {
              if (selectedCategory) { setSelectedCategory(null); loadAll(); }
            }}>
              {selectedCategory && <Text style={styles.clearFilter}>✕ Clear</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.categoryGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(cat)}
                onLongPress={() => handleCategoryNavigate(cat)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.categoryEmojiBox,
                  selectedCategory?.id === cat.id && styles.categoryEmojiBoxActive
                ]}>
                  <Text style={styles.categoryEmoji}>{cat.emoji || '📦'}</Text>
                </View>
                <Text style={[
                  styles.categoryName,
                  selectedCategory?.id === cat.id && styles.categoryNameActive
                ]} numberOfLines={2}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Featured / Deals Section */}
      {!search && !selectedCategory && featuredProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Best Deals</Text>
          <FlatList
            horizontal
            data={featuredProducts}
            keyExtractor={item => `feat-${item.id}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.featuredCard} onPress={() => handleProductPress(item)} activeOpacity={0.7}>
                <Text style={styles.featuredEmoji}>{item.category?.emoji || '🛍️'}</Text>
                <View style={styles.featuredDiscount}>
                  <Text style={styles.featuredDiscountText}>{Math.round(item.discountPercent)}% OFF</Text>
                </View>
                <Text style={styles.featuredName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.featuredPrice}>₹{item.sellingPrice || item.price}</Text>
                <TouchableOpacity
                  style={styles.featuredAddBtn}
                  onPress={() => {
                    const cartItem = useCartStore.getState().items.find(i => i.product.id === item.id);
                    if (cartItem) {
                      useCartStore.getState().updateQty(item.id, cartItem.quantity + 1);
                    } else {
                      useCartStore.getState().addItem(item);
                    }
                  }}
                >
                  <Text style={styles.featuredAddBtnText}>ADD</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Products Header */}
      <View style={styles.productsHeader}>
        <Text style={styles.sectionTitle}>
          {search
            ? `Results for "${search}"`
            : selectedCategory
            ? `${selectedCategory.emoji} ${selectedCategory.name}`
            : '🛒 All Products'}
        </Text>
        <Text style={styles.resultCount}>{displayProducts.length} items</Text>
      </View>

      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />}
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.deliveryText}>⚡ Delivery in 10 mins</Text>
          <Text style={styles.locationText}>
            📍 {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Fetching location...'}
          </Text>
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

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, brands..."
          placeholderTextColor={COLORS.textTertiary}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); loadAll(); }}>
            <Text style={{ fontSize: 18, color: COLORS.textTertiary }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={displayProducts}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} onPress={() => handleProductPress(item)} />}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={styles.emptyText}>No products found</Text>
              <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Cart Footer */}
      {totalItems > 0 && (
        <TouchableOpacity style={styles.cartFooter} onPress={() => navigation.navigate('Cart')}>
          <View>
            <Text style={styles.cartFooterItems}>{totalItems} item{totalItems > 1 ? 's' : ''}</Text>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SIZES.padding, backgroundColor: COLORS.primary,
    paddingBottom: 14, paddingTop: 14,
  },
  deliveryText: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.textInverse },
  locationText: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  cartBtn: { position: 'relative', padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  cartIcon: { fontSize: 22 },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: COLORS.secondary, borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  cartBadgeText: { color: COLORS.textInverse, fontSize: 10, fontWeight: 'bold' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, marginHorizontal: SIZES.padding, marginTop: -16,
    borderRadius: SIZES.radiusXL, paddingHorizontal: 14,
    ...SIZES.shadow.medium,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: SIZES.md, color: COLORS.textPrimary },

  banner: {
    marginHorizontal: SIZES.padding, marginBottom: 14, borderRadius: SIZES.radiusXL,
    padding: 20, flexDirection: 'row', alignItems: 'center', minHeight: 100,
    ...SIZES.shadow.small,
  },
  bannerTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.textInverse },
  bannerSubtitle: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  bannerEmoji: { fontSize: 52 },
  bannerDots: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 3 },
  dotActive: { backgroundColor: COLORS.textInverse, width: 18, borderRadius: 4 },

  section: {
    backgroundColor: COLORS.card, marginHorizontal: SIZES.padding, marginBottom: 12,
    borderRadius: SIZES.radiusXL, padding: 16, ...SIZES.shadow.small,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  clearFilter: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '700' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryCard: { width: '25%', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 },
  categoryEmojiBox: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center',
    marginBottom: 6, ...SIZES.shadow.small,
  },
  categoryEmojiBoxActive: { backgroundColor: COLORS.primaryLight, borderWidth: 2, borderColor: COLORS.primary },
  categoryEmoji: { fontSize: 30 },
  categoryName: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '500' },
  categoryNameActive: { color: COLORS.primary, fontWeight: '700' },

  // Featured
  featuredCard: {
    width: 130, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusXL,
    padding: 12, marginRight: 10, alignItems: 'center', ...SIZES.shadow.small,
  },
  featuredEmoji: { fontSize: 38, marginBottom: 4 },
  featuredDiscount: { backgroundColor: COLORS.error, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  featuredDiscountText: { color: COLORS.textInverse, fontSize: 9, fontWeight: 'bold' },
  featuredName: { fontSize: 11, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4, fontWeight: '600' },
  featuredPrice: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  featuredAddBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 18, paddingVertical: 5, backgroundColor: COLORS.primaryLighter,
  },
  featuredAddBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 11 },

  productsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingVertical: 10,
  },
  resultCount: { fontSize: SIZES.xs, color: COLORS.textTertiary },

  productList: { paddingHorizontal: 6, paddingBottom: 80 },
  productCard: {
    flex: 1, margin: 5, backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusXL, padding: 10, ...SIZES.shadow.small,
  },
  outOfStockCard: { opacity: 0.6 },
  productImageBox: {
    height: 100, backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, position: 'relative',
  },
  productEmoji: { fontSize: 44 },
  productImage: { width: '100%', height: '100%', borderRadius: SIZES.radius },
  wishlistBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: COLORS.surface, borderRadius: 20,
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center', zIndex: 10,
    ...SIZES.shadow.small,
  },
  wishlistIcon: { fontSize: 14 },
  discountBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: COLORS.error, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  discountText: { color: COLORS.textInverse, fontSize: 9, fontWeight: 'bold' },
  outOfStockBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)', borderBottomLeftRadius: SIZES.radius, borderBottomRightRadius: SIZES.radius,
    padding: 4, alignItems: 'center',
  },
  outOfStockText: { color: COLORS.textInverse, fontSize: 9, fontWeight: 'bold' },
  productUnit: { fontSize: SIZES.xs, color: COLORS.textTertiary },
  productName: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textPrimary, marginVertical: 3, lineHeight: 18 },
  lowStockText: { fontSize: 10, color: COLORS.warning, fontWeight: '700', marginBottom: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  price: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  mrp: { fontSize: SIZES.xs, color: COLORS.textTertiary, textDecorationLine: 'line-through', marginLeft: 4 },
  addBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 8,
    paddingVertical: 7, alignItems: 'center', backgroundColor: COLORS.primaryLighter,
  },
  addBtnDisabled: { borderColor: COLORS.border, backgroundColor: COLORS.surfaceSecondary },
  addBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: SIZES.sm },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 4,
  },
  qtyBtn: { padding: 6 },
  qtyBtnText: { color: COLORS.textInverse, fontSize: SIZES.lg, fontWeight: 'bold' },
  qtyText: { color: COLORS.textInverse, fontWeight: 'bold', fontSize: SIZES.md },

  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: SIZES.md, color: COLORS.textTertiary, marginTop: 12 },
  retryBtn: {
    marginTop: 16, backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    paddingHorizontal: 28, paddingVertical: 12, ...SIZES.shadow.medium,
  },
  retryBtnText: { color: COLORS.textInverse, fontWeight: '700' },

  cartFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.primary, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...SIZES.shadow.large,
    borderTopLeftRadius: SIZES.radiusXL,
    borderTopRightRadius: SIZES.radiusXL,
  },
  cartFooterItems: { color: COLORS.textInverse, fontSize: SIZES.xs, opacity: 0.85 },
  cartFooterAmount: { color: COLORS.textInverse, fontWeight: '800', fontSize: SIZES.lg },
  cartFooterAction: { color: COLORS.textInverse, fontWeight: '700', fontSize: SIZES.md },

  featureGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  featureItem: { alignItems: 'center', flex: 1 },
  featureIconBox: {
    width: 58, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    marginBottom: 6, ...SIZES.shadow.small,
  },
  featureIcon: { fontSize: 26 },
  featureLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
});
