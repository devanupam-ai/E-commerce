package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_expenses")
public class Expense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    private String description;
    @Enumerated(EnumType.STRING)
    private Category category = Category.OTHER;
    private BigDecimal amount;
    private LocalDate expenseDate;
    @Enumerated(EnumType.STRING)
    private Invoice.PaymentMode paymentMode = Invoice.PaymentMode.CASH;
    private String referenceNumber;
    private String notes;
    private String attachmentUrl;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Category {
        RENT, SALARY, UTILITIES, TRANSPORT, MARKETING, OFFICE_SUPPLIES,
        MAINTENANCE, INSURANCE, TAX, FOOD, TELECOM, OTHER
    }
}
