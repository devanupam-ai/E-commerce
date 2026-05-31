
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_loyalty_redemptions")
public class LoyaltyRedemption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    @ManyToOne @JoinColumn(name = "customer_id")
    private Customer customer;
    @ManyToOne @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    private BigDecimal pointsRedeemed = BigDecimal.ZERO;
    private BigDecimal discountGiven = BigDecimal.ZERO;
    private String redemptionCode;
    private Boolean isApplied = false;
    private LocalDateTime redeemedAt = LocalDateTime.now();
}
