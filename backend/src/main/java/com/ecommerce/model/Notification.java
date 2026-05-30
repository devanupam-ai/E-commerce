package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "notifications")
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "user_id")
    private User user;
    private String title;
    private String body;
    private String type;
    private Long referenceId;
    private Boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();
}
