package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "loyalty_transactions")
public class LoyaltyTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    private Integer points;
    private String description;
    private Long referenceId; // order id or reward id

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum TransactionType { EARNED, REDEEMED, EXPIRED, BONUS }
}
