
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_notifications")
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    private String title;
    private String message;
    private String category; // PAYMENT, STOCK, FESTIVAL, SYSTEM, INSIGHT, ORDER
    private String icon;
    private String link; // navigation link
    private Boolean isRead = false;
    private Boolean isPinned = false;
    private Integer priority = 0; // 0=normal, 1=high, 2=urgent
    private LocalDateTime createdAt = LocalDateTime.now();
}
