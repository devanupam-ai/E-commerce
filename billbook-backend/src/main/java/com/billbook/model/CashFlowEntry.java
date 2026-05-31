
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_cash_flow")
public class CashFlowEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    private LocalDate entryDate;
    @Enumerated(EnumType.STRING)
    private FlowType flowType; // INFLOW, OUTFLOW
    private BigDecimal amount = BigDecimal.ZERO;
    private String category; // SALES, PAYMENT_RECEIVED, EXPENSE, SALARY, RENT, PURCHASE, TAX, OTHER
    private String description;
    private String referenceType; // INVOICE, EXPENSE, PAYMENT, MANUAL
    private Long referenceId;
    private BigDecimal runningBalance = BigDecimal.ZERO;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum FlowType { INFLOW, OUTFLOW }
}
