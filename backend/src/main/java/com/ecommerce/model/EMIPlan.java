package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "emi_plans")
public class EMIPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    private BigDecimal principalAmount;
    private Integer tenureMonths;
    private BigDecimal interestRate;
    private BigDecimal monthlyEmi;
    private BigDecimal totalPayable;
    private BigDecimal interestAmount;

    @Enumerated(EnumType.STRING)
    private EMIStatus status = EMIStatus.ACTIVE;

    private Integer paidMonths = 0;
    private BigDecimal paidAmount = BigDecimal.ZERO;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum EMIStatus { ACTIVE, COMPLETED, DEFAULTED, CANCELLED }
}
