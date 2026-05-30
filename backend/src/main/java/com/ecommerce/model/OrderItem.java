package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data @Entity @Table(name = "order_items")
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "order_id")
    @JsonIgnoreProperties({"items", "customer", "deliveryBoy", "address"})
    private Order order;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"category"})
    private Product product;
    private String productName;
    private String productImage;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
