package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "loyalty_rewards")
public class LoyaltyReward {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String icon;
    private Integer pointsRequired;
    private String couponCode;
    private BigDecimal discountAmount;
    private BigDecimal minOrderAmount;

    @Enumerated(EnumType.STRING)
    private RewardType type;

    private Boolean active = true;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum RewardType { COUPON, FREE_DELIVERY, MYSTERY_BOX, CASHBACK }
}
