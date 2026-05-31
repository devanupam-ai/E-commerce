
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_festival_alerts")
public class FestivalAlert {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    @ManyToOne @JoinColumn(name = "festival_id")
    private Festival festival;

    @Enumerated(EnumType.STRING)
    private AlertStatus status = AlertStatus.PENDING;

    private Integer customersTargeted = 0;
    private Integer messagesSent = 0;
    private LocalDateTime alertedAt;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum AlertStatus { PENDING, SENT, DISMISSED, SCHEDULED }
}
