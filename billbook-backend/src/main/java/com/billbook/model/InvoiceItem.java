package com.billbook.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data @Entity @Table(name = "bb_invoice_items")
public class InvoiceItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "invoice_id")
    @JsonIgnoreProperties({"items", "user", "customer"})
    private Invoice invoice;
    @ManyToOne @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"user"})
    private BbProduct product;
    private String productName;
    private String hsnCode;
    private BigDecimal quantity;
    private String unit = "PCS";
    private BigDecimal unitPrice;
    private BigDecimal discountPercent = BigDecimal.ZERO;
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private BigDecimal gstRate = BigDecimal.ZERO;
    private BigDecimal cgstAmount = BigDecimal.ZERO;
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    private BigDecimal igstAmount = BigDecimal.ZERO;
    private BigDecimal totalPrice;
}
