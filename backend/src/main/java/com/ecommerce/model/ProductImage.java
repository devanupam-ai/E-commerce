package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "product_images")
public class ProductImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    private Product product;

    private String imageUrl;

    private Boolean isPrimary = false;

    private Integer sortOrder = 0;

    private LocalDateTime createdAt = LocalDateTime.now();
}
