package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "expense_receipts")
public class ExpenseReceipt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    private String vendorName;
    private BigDecimal amount;
    private String category;
    private String paymentMode;
    private LocalDate expenseDate;
    private String description;
    private String scanStatus; // SCANNED, CONFIRMED, PROCESSED
    private String merchantName;
    private Double confidence;
    private LocalDateTime createdAt = LocalDateTime.now();
}
