package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_vendors")
public class Vendor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String gstin;
    private String panNumber;
    private String bankName;
    private String bankAccount;
    private String ifscCode;
    private String upiId;
    private BigDecimal openingBalance = BigDecimal.ZERO;
    private BigDecimal totalPurchaseAmount = BigDecimal.ZERO;
    private BigDecimal totalPaidAmount = BigDecimal.ZERO;
    private BigDecimal balanceDue = BigDecimal.ZERO;
    private Boolean isActive = true;
    private String notes;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
