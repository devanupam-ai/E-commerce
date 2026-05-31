package com.billbook.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Entity @Table(name = "bb_invoices")
public class Invoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password"})
    private BbUser user;
    @ManyToOne @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"user"})
    private Customer customer;
    @Column(unique = true) private String invoiceNumber;
    @Enumerated(EnumType.STRING)
    private InvoiceType invoiceType = InvoiceType.SALE;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private Boolean isGst = false;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private BigDecimal discountPercent = BigDecimal.ZERO;
    private BigDecimal cgstAmount = BigDecimal.ZERO;
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    private BigDecimal igstAmount = BigDecimal.ZERO;
    private BigDecimal totalTax = BigDecimal.ZERO;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount = BigDecimal.ZERO;
    private BigDecimal balanceDue = BigDecimal.ZERO;
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;
    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode = PaymentMode.CASH;
    private String notes;
    private String terms;
    private Boolean isOnline = true;
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"invoice"})
    private List<InvoiceItem> items;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum InvoiceType { SALE, PURCHASE, SALE_RETURN, PURCHASE_RETURN }
    public enum PaymentStatus { UNPAID, PARTIAL, PAID, OVERDUE }
    public enum PaymentMode { CASH, UPI, CARD, BANK_TRANSFER, CHEQUE, CREDIT }
}
