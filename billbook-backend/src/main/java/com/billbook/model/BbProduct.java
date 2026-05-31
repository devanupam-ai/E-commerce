package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_products")
public class BbProduct {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    private String name;
    private String description;
    private String sku;
    private String hsnCode;
    private String category;
    private String unit = "PCS";
    private BigDecimal purchasePrice = BigDecimal.ZERO;
    private BigDecimal sellingPrice;
    private BigDecimal mrp = BigDecimal.ZERO;
    private BigDecimal gstRate = BigDecimal.ZERO;
    private BigDecimal stockQuantity = BigDecimal.ZERO;
    private BigDecimal reorderLevel = BigDecimal.valueOf(5);
    private Boolean isActive = true;
    private LocalDateTime createdAt = LocalDateTime.now();
}
