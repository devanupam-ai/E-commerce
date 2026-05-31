
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_business_cards")
public class BusinessCard {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    private String businessName;
    private String ownerName;
    private String designation;
    private String phone;
    private String email;
    private String website;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String gstin;
    private String upiId;
    private String logoUrl;
    private String primaryColor = "#6C3CE1";
    private String secondaryColor = "#1E1B4B";
    private String cardStyle = "MODERN"; // MODERN, CLASSIC, MINIMAL, BOLD
    private String whatsappNumber;
    private Boolean isActive = true;
    private Integer shareCount = 0;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
