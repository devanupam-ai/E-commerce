
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_festivals")
public class Festival {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String nameHindi;
    private LocalDate festivalDate;
    private String category; // NATIONAL, HINDU, MUSLIM, SIKH, CHRISTIAN, JAIN, BUDDHIST, REGIONAL
    private String description;
    private String suggestedDiscount; // e.g. "10%", "Flat ₹500"
    private BigDecimal discountPercent = BigDecimal.ZERO;
    private String marketingMessage;
    private String emoji;
    private Integer daysBeforeAlert = 15; // How many days before to start alerting
    private Boolean isActive = true;
    private LocalDateTime createdAt = LocalDateTime.now();
}
