package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "delivery_tracking")
public class DeliveryTracking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "order_id")
    private Order order;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "delivery_boy_id")
    private User deliveryBoy;
    private Double latitude;
    private Double longitude;
    private String status;
    private LocalDateTime updatedAt = LocalDateTime.now();
}
