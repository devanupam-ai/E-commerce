package com.billbook.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_khata_entries")
public class KhataEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password"})
    private BbUser user;

    @ManyToOne @JoinColumn(name = "party_id")
    @JsonIgnoreProperties({"user"})
    private Customer party;

    @Enumerated(EnumType.STRING)
    private EntryType entryType = EntryType.CREDIT_GIVEN;

    private BigDecimal amount;
    private String description;
    private LocalDate entryDate;
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    private EntryStatus status = EntryStatus.PENDING;

    private BigDecimal interestRate = BigDecimal.ZERO;
    private BigDecimal interestAmount = BigDecimal.ZERO;

    private Long referenceId; // invoice id or payment id
    private String referenceType; // INVOICE, PAYMENT, MANUAL

    private Boolean reminderSent = false;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum EntryType { CREDIT_GIVEN, CREDIT_RECEIVED, DEBIT_GIVEN, DEBIT_RECEIVED, PAYMENT_RECEIVED, PAYMENT_MADE, INTEREST }
    public enum EntryStatus { PENDING, PARTIAL, SETTLED, OVERDUE }
}
