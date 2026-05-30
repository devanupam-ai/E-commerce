
package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "wishlists", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "product_id"})
})
public class Wishlist {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "product_id")
    private Product product;
    private LocalDateTime createdAt = LocalDateTime.now();
}
