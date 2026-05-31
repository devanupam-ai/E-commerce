
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bb_cash_register")
public class CashRegister {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;

    private LocalDate registerDate;

    @Enumerated(EnumType.STRING)
    private RegisterStatus status = RegisterStatus.OPEN;

    // Opening balance
    private BigDecimal openingCash = BigDecimal.ZERO;

    // Denomination breakdown at opening
    private Integer denom2000 = 0;
    private Integer denom500 = 0;
    private Integer denom200 = 0;
    private Integer denom100 = 0;
    private Integer denom50 = 0;
    private Integer denom20 = 0;
    private Integer denom10 = 0;
    private Integer denom5 = 0;
    private Integer denom2 = 0;
    private Integer denom1 = 0;

    // Computed totals from system
    private BigDecimal totalCashSales = BigDecimal.ZERO;
    private BigDecimal totalUpiSales = BigDecimal.ZERO;
    private BigDecimal totalCardSales = BigDecimal.ZERO;
    private BigDecimal totalBankTransferSales = BigDecimal.ZERO;
    private BigDecimal totalChequeSales = BigDecimal.ZERO;
    private BigDecimal totalCreditSales = BigDecimal.ZERO;

    private BigDecimal totalCashExpenses = BigDecimal.ZERO;
    private BigDecimal totalCashReceived = BigDecimal.ZERO;  // from khata settlements
    private BigDecimal totalCashPaidOut = BigDecimal.ZERO;   // vendor payments, etc.

    // Closing
    private BigDecimal closingCashSystem = BigDecimal.ZERO;  // what system calculates
    private BigDecimal closingCashActual = BigDecimal.ZERO;   // what you physically count
    private BigDecimal difference = BigDecimal.ZERO;          // actual - system (negative = shortage)

    // Closing denomination breakdown
    private Integer closeDenom2000 = 0;
    private Integer closeDenom500 = 0;
    private Integer closeDenom200 = 0;
    private Integer closeDenom100 = 0;
    private Integer closeDenom50 = 0;
    private Integer closeDenom20 = 0;
    private Integer closeDenom10 = 0;
    private Integer closeDenom5 = 0;
    private Integer closeDenom2 = 0;
    private Integer closeDenom1 = 0;

    private String closingNotes;
    private LocalDateTime openedAt = LocalDateTime.now();
    private LocalDateTime closedAt;

    public enum RegisterStatus { OPEN, CLOSED }
}
