package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;

@Data @Entity @Table(name = "categories")
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String imageUrl;
    private String emoji;
    private Integer sortOrder = 0;
    private Boolean isActive = true;
}
