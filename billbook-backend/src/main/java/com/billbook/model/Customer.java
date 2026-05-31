package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_customers")
public class Customer {
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
    @Enumerated(EnumType.STRING)
    private Type type = Type.CUSTOMER;
    private BigDecimal openingBalance = BigDecimal.ZERO;
    private Boolean isActive = true;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Type { CUSTOMER, VENDOR, BOTH }
}
