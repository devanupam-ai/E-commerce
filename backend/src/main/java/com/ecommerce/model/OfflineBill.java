package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "offline_bills")
public class OfflineBill {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String billNumber;
    private String pdfUrl;
    private String customerName;
    private String customerPhone;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private String itemsSummary;
    private String paymentMode;
    private LocalDateTime billDate = LocalDateTime.now();
    private LocalDateTime createdAt = LocalDateTime.now();
}
