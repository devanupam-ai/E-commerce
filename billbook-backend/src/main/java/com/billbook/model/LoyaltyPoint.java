
package com.billbook.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_loyalty_points")
public class LoyaltyPoint {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password"})
    private BbUser user;
    @ManyToOne @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"user"})
    private Customer customer;
    @ManyToOne @JoinColumn(name = "invoice_id")
    @JsonIgnoreProperties({"user", "customer"})
    private Invoice invoice;

    private BigDecimal pointsEarned = BigDecimal.ZERO;
    private BigDecimal pointsRedeemed = BigDecimal.ZERO;
    private BigDecimal pointsBalance = BigDecimal.ZERO;
    private BigDecimal purchaseAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private TransactionType transactionType = TransactionType.EARN;

    private String description;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum TransactionType { EARN, REDEEM, EXPIRE, BONUS }
}
