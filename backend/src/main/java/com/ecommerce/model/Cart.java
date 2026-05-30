package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "cart")
public class Cart {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled","username","fcmToken"})
    private User user;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"category"})
    private Product product;
    private Integer quantity = 1;
    private LocalDateTime createdAt = LocalDateTime.now();
}
