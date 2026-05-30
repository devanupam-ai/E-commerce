package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "product_reviews")
public class ProductReview {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"category", "description", "imageUrl", "isActive", "createdAt"})
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled","username","fcmToken","role","isActive"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "order_id")
    @JsonIgnoreProperties({"items","customer","deliveryBoy","address","deliveryOtp","otpVerified","customerLatitude","customerLongitude","customerLocationAddress"})
    private Order order;

    private Integer rating; // 1-5
    private String review;
    private LocalDateTime createdAt = LocalDateTime.now();
}
