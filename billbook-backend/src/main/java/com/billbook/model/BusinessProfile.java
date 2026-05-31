package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_business_profiles")
public class BusinessProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne @JoinColumn(name = "user_id")
    private BbUser user;
    private String businessName;
    private String ownerName;
    private String phone;
    private String email;
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
    private String logoUrl;
    private String signatureUrl;
    @Enumerated(EnumType.STRING)
    private BusinessType businessType = BusinessType.RETAILER;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum BusinessType { RETAILER, WHOLESALER, MANUFACTURER, DISTRIBUTOR, SERVICE_PROVIDER, FREELANCER }
}
