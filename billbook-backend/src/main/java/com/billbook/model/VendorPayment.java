package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_vendor_payments")
public class VendorPayment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    @ManyToOne @JoinColumn(name = "vendor_id")
    private Vendor vendor;
    @ManyToOne @JoinColumn(name = "purchase_id")
    private Purchase purchase;
    private BigDecimal amount;
    private LocalDate paymentDate;
    @Enumerated(EnumType.STRING)
    private Purchase.PaymentMode paymentMode = Purchase.PaymentMode.CASH;
    private String referenceNumber;
    private String notes;
    private LocalDateTime createdAt = LocalDateTime.now();
}
