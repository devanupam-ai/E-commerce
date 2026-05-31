package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_payments")
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    @ManyToOne @JoinColumn(name = "invoice_id")
    private Invoice invoice;
    @ManyToOne @JoinColumn(name = "customer_id")
    private Customer customer;
    private BigDecimal amount;
    private LocalDate paymentDate;
    @Enumerated(EnumType.STRING)
    private Invoice.PaymentMode paymentMode = Invoice.PaymentMode.CASH;
    private String referenceNumber;
    private String notes;
    @Enumerated(EnumType.STRING)
    private Type type = Type.RECEIVED;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Type { RECEIVED, PAID }
}
