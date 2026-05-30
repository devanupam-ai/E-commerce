package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Data @Entity @Table(name = "users")
@JsonIgnoreProperties({"password", "authorities", "accountNonExpired", "accountNonLocked", "credentialsNonExpired", "enabled", "username"})
public class User implements UserDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique = true) private String email;
    @Column(unique = true) private String phone;
    private String password;
    @Enumerated(EnumType.STRING)
    private Role role = Role.CUSTOMER;
    private Boolean isActive = true;
    private String fcmToken;
    private java.math.BigDecimal walletBalance = java.math.BigDecimal.ZERO;
    private Integer loyaltyPoints = 0;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Role { CUSTOMER, ADMIN, DELIVERY_BOY }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return Boolean.TRUE.equals(isActive); }
}
