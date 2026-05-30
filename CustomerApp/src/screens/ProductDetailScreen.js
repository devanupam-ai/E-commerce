
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, FlatList, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { productAPI, reviewAPI } from '../api';
import { useCartStore, useWishlistStore } from '../store';
import { COLORS, SIZES } from '../utils/theme';

const STAR_OPTIONS = [1, 2, 3, 4, 5];

export default function ProductDetailScreen({ route, navigation }) {
  const { product: initialProduct, productId } = route.params || {};
  const [product, setProduct] = useState(initialProduct || null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { addItem, items, updateQty } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();

  const cartItem = product ? items.find(i => i.product.id === product.id) : null;
  const qty = cartItem?.quantity || 0;
  const inWishlist = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    if (!product && productId) {
      loadProduct();
    }
    loadReviews();
  }, [productId, product]);

  const loadProduct = async () => {
    try {
      const res = await productAPI.getAll();
      const found = (res.data || []).find(p => p.id === productId);
      if (found) setProduct(found);
    } catch {
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    const id = product?.id || productId;
    if (!id) return;
    try {
      const res = await reviewAPI.getProductReviews(id);
      setReviews(res.data || []);
    } catch {
      // Reviews may not exist yet
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAdd = useCallback(() => {
    if (product.stockQuantity <= 0) return Alert.alert('Out of Stock', `${product.name} is currently unavailable.`);
    addItem(product);
  }, [product, addItem]);

  const handleIncrease = useCallback(() => {
    if (qty >= product.stockQuantity) return Alert.alert('Stock Limit', `Only ${product.stockQuantity} units available.`);
    updateQty(product.id, qty + 1);
  }, [qty, product, updateQty]);

  const handleDecrease = useCallback(() => {
    updateQty(product.id, qty - 1);
  }, [product, qty, updateQty]);

  const toggleWishlist = useCallback(() => {
    if (inWishlist) removeFromWishlist(product.id);
    else addToWishlist(product);
  }, [inWishlist, product, addToWishlist, removeFromWishlist]);

  const handleSubmitReview = async () => {
    if (rating === 0) return Alert.alert('Rating Required', 'Please select a star rating.');
    if (!reviewText.trim()) return Alert.alert('Review Required', 'Please write your review.');

    setSubmittingReview(true);
    try {
      await reviewAPI.addReview(product.id || productId, {
        rating,
        comment: reviewText.trim(),
      });
      Alert.alert('Thank You!', 'Your review has been submitted.');
      setReviewText('');
      setRating(0);
      setShowReviewForm(false);
      loadReviews();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const price = product.sellingPrice || product.price || 0;
  const mrp = product.mrp || 0;
  const savings = mrp > price ? mrp - price : 0;
  const savingsPercent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const ReviewCard = ({ review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>
            {review.userName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewName}>{review.userName || 'Anonymous'}</Text>
          <View style={styles.reviewStars}>
            {[1, 2, 3, 4, 5].map(s => (
              <Text key={s} style={s <= review.rating ? styles.starFilled : styles.starEmpty}>★</Text>
            ))}
            <Text style={styles.reviewDate}>
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={toggleWishlist} style={styles.wishlistHeaderBtn}>
          <Text style={styles.wishlistIcon}>{inWishlist ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image Area */}
        <View style={styles.imageSection}>
          <View style={styles.imageBox}>
            {(product.imageUrl || (product.images && product.images.length > 0)) ? (
              <Image source={{ uri: product.imageUrl || product.images[0].imageUrl }} style={styles.productDetailImage} resizeMode="cover" />
            ) : (
              <Text style={styles.productEmoji}>{product.category?.emoji || '🛍️'}</Text>
            )}
          </View>
          {/* Image thumbnails */}
          {product.images && product.images.length > 1 && (
            <View style={styles.thumbnailRow}>
              {product.images.map((img, i) => (
                <TouchableOpacity key={i} style={styles.thumbnail}>
                  <Image source={{ uri: img.imageUrl }} style={styles.thumbnailImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {product.discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{Math.round(product.discountPercent)}% OFF</Text>
            </View>
          )}
          {product.stockQuantity <= 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryBadge}>{product.category?.emoji || '📦'} {product.category?.name || 'General'}</Text>
            {product.unit && <Text style={styles.unitText}>{product.unit}</Text>}
          </View>

          {/* Rating Summary */}
          <View style={styles.ratingRow}>
            {avgRating ? (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>★ {avgRating}</Text>
              </View>
            ) : (
              <Text style={styles.noRatingText}>No ratings yet</Text>
            )}
            <Text style={styles.reviewCountText}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.sellingPrice}>₹{price}</Text>
            {mrp > price && mrp > 0 && (
              <>
                <Text style={styles.mrpPrice}>₹{mrp}</Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save ₹{savings.toFixed(0)} ({savingsPercent}%)</Text>
                </View>
              </>
            )}
          </View>

          {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
            <Text style={styles.lowStockText}>🔥 Only {product.stockQuantity} left - order soon!</Text>
          )}

          {/* Tax info */}
          <Text style={styles.taxText}>Inclusive of all taxes</Text>
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        )}

        {/* Product Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Product Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{product.category?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unit</Text>
            <Text style={styles.detailValue}>{product.unit || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Availability</Text>
            <Text style={[styles.detailValue, { color: product.stockQuantity > 0 ? COLORS.success : COLORS.red }]}>
              {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity})` : 'Out of Stock'}
            </Text>
          </View>
          {product.brand && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand</Text>
              <Text style={styles.detailValue}>{product.brand}</Text>
            </View>
          )}
        </View>

        {/* Delivery Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚚 Delivery Information</Text>
          <View style={styles.deliveryItem}>
            <Text style={styles.deliveryIcon}>⚡</Text>
            <View>
              <Text style={styles.deliveryTitle}>10 Min Delivery</Text>
              <Text style={styles.deliverySub}>Fastest delivery available</Text>
            </View>
          </View>
          <View style={styles.deliveryItem}>
            <Text style={styles.deliveryIcon}>🎉</Text>
            <View>
              <Text style={styles.deliveryTitle}>Free Delivery</Text>
              <Text style={styles.deliverySub}>On orders above ₹200</Text>
            </View>
          </View>
          <View style={styles.deliveryItem}>
            <Text style={styles.deliveryIcon}>🔄</Text>
            <View>
              <Text style={styles.deliveryTitle}>Easy Returns</Text>
              <Text style={styles.deliverySub}>7 day return policy</Text>
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.card}>
          <View style={styles.reviewSectionHeader}>
            <Text style={styles.cardTitle}>⭐ Ratings & Reviews</Text>
            <TouchableOpacity onPress={() => setShowReviewForm(!showReviewForm)}>
              <Text style={styles.writeReviewBtn}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Summary Bar */}
          {reviews.length > 0 && (
            <View style={styles.ratingSummary}>
              <View style={styles.ratingBig}>
                <Text style={styles.ratingBigNumber}>{avgRating}</Text>
                <Text style={styles.ratingBigTotal}>/5</Text>
              </View>
              <View style={styles.ratingBars}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <View key={star} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarStar}>{star}★</Text>
                      <View style={styles.ratingBarBg}>
                        <View style={[styles.ratingBarFill, { width: `${percent}%` }]} />
                      </View>
                      <Text style={styles.ratingBarCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Write Review Form */}
          {showReviewForm && (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormTitle}>Write a Review</Text>
              <View style={styles.starSelector}>
                {STAR_OPTIONS.map(s => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Text style={[styles.starSelectorItem, s <= rating && styles.starSelectorActive]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.selectedRatingText}>
                  {rating > 0 ? `${rating} Star${rating > 1 ? 's' : ''}` : 'Select rating'}
                </Text>
              </View>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience with this product..."
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.reviewFormActions}>
                <TouchableOpacity
                  style={styles.submitReviewBtn}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitReviewBtnText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelReviewBtn}
                  onPress={() => { setShowReviewForm(false); setRating(0); setReviewText(''); }}
                >
                  <Text style={styles.cancelReviewBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsIcon}>💬</Text>
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
            </View>
          ) : (
            reviews.slice(0, 5).map((review, idx) => (
              <ReviewCard key={review.id || idx} review={review} />
            ))
          )}

          {reviews.length > 5 && (
            <TouchableOpacity style={styles.seeAllReviewsBtn}>
              <Text style={styles.seeAllReviewsText}>See All {reviews.length} Reviews →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Spacer for sticky bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Price</Text>
          <Text style={styles.bottomPriceValue}>₹{price}</Text>
        </View>
        {product.stockQuantity <= 0 ? (
          <View style={[styles.addBtn, styles.addBtnDisabled]}>
            <Text style={styles.addBtnTextDisabled}>SOLD OUT</Text>
          </View>
        ) : qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.7}>
            <Text style={styles.addBtnText}>ADD TO CART</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyControl}>
            <TouchableOpacity onPress={handleDecrease} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity onPress={handleIncrease} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: SIZES.padding,
    backgroundColor: COLORS.white, elevation: 2,
  },
  backBtn: { fontSize: 24, marginRight: 12, color: COLORS.black },
  headerTitle: { flex: 1, fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  wishlistHeaderBtn: { padding: 8 },
  wishlistIcon: { fontSize: 24 },
  scrollContent: { flex: 1 },

  // Image Section
  imageSection: {
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 32, position: 'relative',
  },
  imageBox: {
    width: 180, height: 180, backgroundColor: '#F0FFF0', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  productEmoji: { fontSize: 80 },
  discountBadge: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: COLORS.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  discountText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.sm },
  outOfStockOverlay: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: '#999', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  outOfStockText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.sm },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.padding, marginTop: 12,
    borderRadius: SIZES.radius, padding: SIZES.padding, elevation: 1,
  },
  productName: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.black, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  categoryBadge: {
    backgroundColor: '#F0FFF0', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '600',
  },
  unitText: { fontSize: SIZES.xs, color: COLORS.gray },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  ratingBadge: {
    backgroundColor: COLORS.success, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  ratingBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.sm },
  noRatingText: { fontSize: SIZES.sm, color: COLORS.gray },
  reviewCountText: { fontSize: SIZES.sm, color: COLORS.gray },
  priceSection: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sellingPrice: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.black },
  mrpPrice: { fontSize: SIZES.md, color: COLORS.gray, textDecorationLine: 'line-through' },
  savingsBadge: {
    backgroundColor: '#FFF3CD', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  savingsText: { fontSize: SIZES.xs, color: '#856404', fontWeight: '600' },
  lowStockText: { fontSize: SIZES.sm, color: COLORS.red, fontWeight: '600', marginBottom: 4 },
  taxText: { fontSize: SIZES.xs, color: COLORS.gray, marginTop: 4 },

  // Generic Card
  card: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.padding, marginTop: 12,
    borderRadius: SIZES.radius, padding: SIZES.padding, elevation: 1,
  },
  cardTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },
  descriptionText: { fontSize: SIZES.md, color: COLORS.gray, lineHeight: 22 },

  // Product Details
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  detailLabel: { fontSize: SIZES.md, color: COLORS.gray },
  detailValue: { fontSize: SIZES.md, color: COLORS.black, fontWeight: '500' },

  // Delivery Info
  deliveryItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deliveryIcon: { fontSize: 24, marginRight: 12 },
  deliveryTitle: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.black },
  deliverySub: { fontSize: SIZES.xs, color: COLORS.gray },

  // Reviews Section
  reviewSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  writeReviewBtn: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: 'bold' },

  // Rating Summary
  ratingSummary: { flexDirection: 'row', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  ratingBig: { alignItems: 'center', marginRight: 20, justifyContent: 'center' },
  ratingBigNumber: { fontSize: 36, fontWeight: 'bold', color: COLORS.black },
  ratingBigTotal: { fontSize: SIZES.md, color: COLORS.gray },
  ratingBars: { flex: 1, justifyContent: 'center' },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingBarStar: { fontSize: SIZES.xs, color: COLORS.gray, width: 24 },
  ratingBarBg: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginHorizontal: 6 },
  ratingBarFill: { height: 6, backgroundColor: COLORS.success, borderRadius: 3 },
  ratingBarCount: { fontSize: SIZES.xs, color: COLORS.gray, width: 20, textAlign: 'right' },

  // Review Form
  reviewForm: {
    backgroundColor: '#F9FFF9', borderRadius: SIZES.radius, padding: SIZES.padding,
    marginBottom: 16, borderWidth: 1, borderColor: '#E8F5E9',
  },
  reviewFormTitle: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black, marginBottom: 10 },
  starSelector: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 4 },
  starSelectorItem: { fontSize: 32, color: '#D1D5DB' },
  starSelectorActive: { color: '#F59E0B' },
  selectedRatingText: { fontSize: SIZES.sm, color: COLORS.gray, marginLeft: 8 },
  reviewInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12,
    fontSize: SIZES.md, backgroundColor: COLORS.white, minHeight: 80, marginBottom: 10,
  },
  reviewFormActions: { flexDirection: 'row', gap: 8 },
  submitReviewBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 8, flex: 1, alignItems: 'center',
  },
  submitReviewBtnText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.md },
  cancelReviewBtn: {
    backgroundColor: '#E5E7EB', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 8, alignItems: 'center',
  },
  cancelReviewBtnText: { color: '#666', fontWeight: 'bold', fontSize: SIZES.md },

  // Review Card
  reviewCard: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  reviewAvatarText: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.primary },
  reviewInfo: { flex: 1 },
  reviewName: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.black },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  starFilled: { color: '#F59E0B', fontSize: 12 },
  starEmpty: { color: '#D1D5DB', fontSize: 12 },
  reviewDate: { fontSize: SIZES.xs, color: COLORS.gray, marginLeft: 8 },
  reviewComment: { fontSize: SIZES.md, color: '#444', lineHeight: 20 },

  // No Reviews
  noReviews: { alignItems: 'center', paddingVertical: 20 },
  noReviewsIcon: { fontSize: 40, marginBottom: 8 },
  noReviewsText: { fontSize: SIZES.md, color: COLORS.gray, textAlign: 'center' },

  // See All
  seeAllReviewsBtn: { alignItems: 'center', paddingVertical: 12 },
  seeAllReviewsText: { fontSize: SIZES.md, color: COLORS.primary, fontWeight: 'bold' },

  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, padding: SIZES.padding, elevation: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  bottomPrice: {},
  bottomPriceLabel: { fontSize: SIZES.xs, color: COLORS.gray },
  bottomPriceValue: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.black },
  addBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: SIZES.radius,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.lg },
  addBtnDisabled: { backgroundColor: '#D1D5DB' },
  addBtnTextDisabled: { color: '#999', fontWeight: 'bold', fontSize: SIZES.lg },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
  },
  qtyBtn: { padding: 12 },
  qtyBtnText: { color: '#fff', fontSize: SIZES.xl, fontWeight: 'bold' },
  qtyText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.lg, minWidth: 28, textAlign: 'center' },
});
