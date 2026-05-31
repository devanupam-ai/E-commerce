package com.billbook.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_khata_settlements")
public class KhataSettlement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password"})
    private BbUser user;

    @ManyToOne @JoinColumn(name = "party_id")
    @JsonIgnoreProperties({"user"})
    private Customer party;

    @ManyToOne @JoinColumn(name = "khata_entry_id")
    @JsonIgnoreProperties({"user", "party"})
    private KhataEntry khataEntry;

    private BigDecimal amount;
    private LocalDate settlementDate;

    @Enumerated(EnumType.STRING)
    private Invoice.PaymentMode paymentMode = Invoice.PaymentMode.CASH;

    private String referenceNumber;
    private String notes;
    private LocalDateTime createdAt = LocalDateTime.now();
}
