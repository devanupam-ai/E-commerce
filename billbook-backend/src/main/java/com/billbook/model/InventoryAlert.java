
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_inventory_alerts")
public class InventoryAlert {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    @ManyToOne @JoinColumn(name = "product_id")
    private BbProduct product;
    @Enumerated(EnumType.STRING)
    private AlertType alertType = AlertType.LOW_STOCK;
    private BigDecimal currentValue = BigDecimal.ZERO;
    private BigDecimal thresholdValue = BigDecimal.ZERO;
    private String message;
    private Boolean isRead = false;
    private Boolean isResolved = false;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime resolvedAt;

    public enum AlertType { LOW_STOCK, OUT_OF_STOCK, OVERSTOCK, EXPIRY_WARNING, DEAD_STOCK, REORDER_SUGGESTION }
}
