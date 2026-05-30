package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Entity @Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Category category;
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private BigDecimal sellingPrice;
    private BigDecimal mrp;
    private BigDecimal discountPercent = BigDecimal.ZERO;
    private String unit;
    private Integer stockQuantity = 0;
    private Boolean isActive = true;
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "product", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "product"})
    @OrderBy("sortOrder ASC")
    private List<ProductImage> images;
}
