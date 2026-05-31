package com.billbook.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_users")
public class BbUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique = true) private String email;
    @Column(unique = true) private String phone;
    @JsonIgnore
    private String password;
    private String businessName;
    private String businessAddress;
    private String gstin;
    private String pan;
    private String logoUrl;
    @Enumerated(EnumType.STRING)
    private Role role = Role.OWNER;
    private Boolean isActive = true;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role { OWNER, STAFF, ACCOUNTANT }
}
