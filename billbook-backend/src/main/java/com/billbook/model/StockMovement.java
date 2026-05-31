package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_stock_movements")
public class StockMovement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    @ManyToOne @JoinColumn(name = "product_id")
    private BbProduct product;
    @ManyToOne @JoinColumn(name = "invoice_id")
    private Invoice invoice;
    @Enumerated(EnumType.STRING)
    private Type type;
    private BigDecimal quantity;
    private BigDecimal balanceAfter;
    private String reason;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Type { IN, OUT, ADJUSTMENT }
}
