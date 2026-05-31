package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data @Entity @Table(name = "bb_purchase_items")
public class PurchaseItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "purchase_id")
    private Purchase purchase;
    @ManyToOne @JoinColumn(name = "product_id")
    private BbProduct product;
    private String productName;
    private BigDecimal quantity = BigDecimal.ONE;
    private String unit = "PCS";
    private BigDecimal unitPrice = BigDecimal.ZERO;
    private BigDecimal purchasePrice = BigDecimal.ZERO;
    private BigDecimal discountPercent = BigDecimal.ZERO;
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private BigDecimal gstRate = BigDecimal.ZERO;
    private BigDecimal cgstAmount = BigDecimal.ZERO;
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    private BigDecimal totalPrice = BigDecimal.ZERO;
}
