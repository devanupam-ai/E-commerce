import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert
} from 'react-native';
import { useWishlistStore, useCartStore } from '../store';
import { wishlistAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

export default function WishlistScreen({ navigation }) {
  const { wishlist, removeFromWishlist, setWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncWishlistFromBackend();
  }, []);

  const syncWishlistFromBackend = async () => {
    try {
      const res = await wishlistAPI.getWishlist();
      const items = res.data || [];
      setWishlist(items.map(item => item.product || item));
    } catch {
      // Backend wishlist may be empty or endpoint not available yet
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addItem(product);
    Alert.alert('Added', `${product.name} added to cart`);
  };

  const handleRemove = async (productId) => {
    removeFromWishlist(productId);
    try {
      await wishlistAPI.removeFromWishlist(productId);
    } catch {}
    Alert.alert('Removed from wishlist');
  };

  const WishlistCard = ({ product }) => (
    <View style={styles.card}>
      <View style={styles.productInfo}>
        <Text style={styles.emoji}>{product.category?.emoji || '🛍️'}</Text>
        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price}</Text>
          {product.stockQuantity <= 0 && (
            <Text style={styles.outOfStock}>Out of Stock</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleAddToCart(product)}
          disabled={product.stockQuantity <= 0}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(product.id)}>
          <Text style={styles.removeBtnText}>❌</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>❤️ My Wishlist</Text>
        <Text style={styles.count}>{wishlist.length} items</Text>
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyText}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtext}>Save items for later!</Text>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <WishlistCard product={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    paddingBottom: 18,
  },
  title: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.textInverse, marginBottom: 4 },
  count: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  list: { padding: SIZES.padding },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusXL,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SIZES.shadow.small,
  },
  productInfo: { flexDirection: 'row', flex: 1 },
  emoji: { fontSize: 42, marginRight: 12 },
  details: { flex: 1 },
  name: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4, lineHeight: 20 },
  price: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  outOfStock: { fontSize: SIZES.sm, color: COLORS.error, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: SIZES.radius,
  },
  addBtnText: { color: COLORS.textInverse, fontWeight: '700', fontSize: SIZES.sm },
  removeBtn: {
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: SIZES.radius,
  },
  removeBtnText: { fontSize: 14 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  emptySubtext: { fontSize: SIZES.md, color: COLORS.textTertiary },
});