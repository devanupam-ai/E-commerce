package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data @Entity @Table(name = "bb_quotation_items")
public class QuotationItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "quotation_id")
    private Quotation quotation;
    private String productName;
    private BigDecimal quantity = BigDecimal.ONE;
    private String unit = "pcs";
    private BigDecimal unitPrice = BigDecimal.ZERO;
    private BigDecimal purchasePrice = BigDecimal.ZERO;
    private BigDecimal discountPercent = BigDecimal.ZERO;
    private BigDecimal taxPercent = BigDecimal.ZERO;
    private BigDecimal totalPrice = BigDecimal.ZERO;
}
