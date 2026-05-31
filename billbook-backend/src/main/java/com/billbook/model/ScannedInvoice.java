
package com.billbook.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Entity @Table(name = "bb_scanned_invoices")
public class ScannedInvoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password"})
    private BbUser user;
    @ManyToOne @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"user"})
    private Customer customer;

    private String originalImagePath;
    private String ocrRawText;
    private String extractedShopName;
    private String extractedInvoiceNumber;
    private String extractedDate;
    private BigDecimal extractedTotal = BigDecimal.ZERO;
    private BigDecimal extractedTax = BigDecimal.ZERO;
    private String extractedItems; // JSON string of extracted items

    @Enumerated(EnumType.STRING)
    private ScanStatus scanStatus = ScanStatus.PENDING;

    private Long convertedInvoiceId; // If converted to actual invoice
    private String errorMessage;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ScanStatus { PENDING, PROCESSED, CONVERTED, FAILED }
}
