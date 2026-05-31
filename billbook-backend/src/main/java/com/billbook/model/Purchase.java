package com.billbook.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Entity @Table(name = "bb_purchases")
public class Purchase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password"})
    private BbUser user;
    @ManyToOne @JoinColumn(name = "vendor_id")
    @JsonIgnoreProperties({"user"})
    private Vendor vendor;
    @Column(unique = true)
    private String purchaseNumber;
    private LocalDate purchaseDate;
    private LocalDate dueDate;
    private Boolean isGst = false;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private BigDecimal discountPercent = BigDecimal.ZERO;
    private BigDecimal cgstAmount = BigDecimal.ZERO;
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    private BigDecimal igstAmount = BigDecimal.ZERO;
    private BigDecimal totalTax = BigDecimal.ZERO;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private BigDecimal paidAmount = BigDecimal.ZERO;
    private BigDecimal balanceDue = BigDecimal.ZERO;
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;
    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode = PaymentMode.CASH;
    private String invoiceNumber;
    private String notes;
    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"purchase"})
    private List<PurchaseItem> items;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum PaymentStatus { UNPAID, PARTIAL, PAID, OVERDUE }
    public enum PaymentMode { CASH, UPI, CARD, BANK_TRANSFER, CHEQUE, CREDIT }
}
