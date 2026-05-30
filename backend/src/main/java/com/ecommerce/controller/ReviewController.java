package com.ecommerce.controller;

import com.ecommerce.model.ProductReview;
import com.ecommerce.model.User;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/reviews") @RequiredArgsConstructor
public class ReviewController {
    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductReview>> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewRepository.findByProductIdOrderByCreatedAtDesc(productId));
    }

    @GetMapping("/product/{productId}/summary")
    public ResponseEntity<Map<String, Object>> getReviewSummary(@PathVariable Long productId) {
        Double avg = reviewRepository.getAvgRatingByProductId(productId);
        Long count = reviewRepository.getReviewCountByProductId(productId);
        return ResponseEntity.ok(Map.of(
            "avgRating", avg != null ? avg : 0.0,
            "reviewCount", count != null ? count : 0L
        ));
    }

    @PostMapping("/product/{productId}")
    public ResponseEntity<?> addReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {

        Long orderId = Long.valueOf(body.get("orderId").toString());
        Integer rating = Integer.valueOf(body.get("rating").toString());
        String reviewText = (String) body.get("review");

        if (rating < 1 || rating > 5)
            return ResponseEntity.badRequest().body(Map.of("message", "Rating must be 1-5"));

        if (reviewRepository.existsByOrderIdAndUserId(orderId, user.getId()))
            return ResponseEntity.badRequest().body(Map.of("message", "You already reviewed this order"));

        var product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        ProductReview review = new ProductReview();
        review.setProduct(product);
        review.setUser(user);
        review.setOrder(order);
        review.setRating(rating);
        review.setReview(reviewText);
        review.setCreatedAt(LocalDateTime.now());

        return ResponseEntity.ok(reviewRepository.save(review));
    }
}
