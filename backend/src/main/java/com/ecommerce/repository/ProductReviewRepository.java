package com.ecommerce.repository;

import com.ecommerce.model.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);
    Optional<ProductReview> findByProductIdAndUserId(Long productId, Long userId);
    boolean existsByOrderIdAndUserId(Long orderId, Long userId);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId")
    Double getAvgRatingByProductId(Long productId);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.id = :productId")
    Long getReviewCountByProductId(Long productId);
}
