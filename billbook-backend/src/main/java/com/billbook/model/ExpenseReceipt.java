
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_expense_receipts")
public class ExpenseReceipt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    private String imagePath;
    private String ocrRawText;
    private String vendorName;
    private BigDecimal amount = BigDecimal.ZERO;
    private String expenseDate;
    private String category; // RENT, SALARY, UTILITIES, MARKETING, TRANSPORT, FOOD, OFFICE, OTHER
    private String description;
    private String paymentMode; // CASH, UPI, CARD, BANK_TRANSFER
    private Long linkedExpenseId;
    @Enumerated(EnumType.STRING)
    private ScanStatus scanStatus = ScanStatus.PENDING;
    private String errorMessage;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ScanStatus { PENDING, PROCESSED, LINKED, FAILED }
}
