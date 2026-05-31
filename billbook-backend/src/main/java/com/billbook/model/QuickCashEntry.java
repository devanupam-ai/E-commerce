
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bb_quick_cash_entries")
public class QuickCashEntry {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;

    @ManyToOne @JoinColumn(name = "register_id")
    private CashRegister register;

    @Enumerated(EnumType.STRING)
    private EntryType entryType = EntryType.CASH_SALE;

    private BigDecimal amount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode = PaymentMode.CASH;

    private String description;
    private String customerName;
    private Long linkedInvoiceId;

    // Short payment tracking
    private BigDecimal expectedAmount = BigDecimal.ZERO;
    private BigDecimal shortAmount = BigDecimal.ZERO;
    private String shortReason;

    private LocalDateTime entryTime = LocalDateTime.now();

    public enum EntryType {
        CASH_SALE,           // Quick cash sale (no full invoice)
        UPI_SALE,            // UPI payment received
        CASH_RECEIVED,       // Cash received from customer (khata settlement etc.)
        CASH_PAID_OUT,       // Cash paid out (vendor, expense, etc.)
        EXPENSE,             // Quick expense entry
        SHORT_PAYMENT,       // Customer paid less than bill
        ADJUSTMENT           // Manual adjustment
    }

    public enum PaymentMode { CASH, UPI, CARD, BANK_TRANSFER, CHEQUE }
}
