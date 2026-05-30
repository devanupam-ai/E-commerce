package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "coupons")
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false)
    private BigDecimal discountValue;

    @Column(name = "min_order_value")
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    @Column(name = "max_discount")
    private BigDecimal maxDiscount;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "usage_limit")
    private Integer usageLimit = 0;

    @Column(name = "usage_count")
    private Integer usageCount = 0;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum DiscountType {
        PERCENTAGE, FLAT
    }
}