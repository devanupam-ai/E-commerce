package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "wallet_transactions")
public class WalletTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled","username","fcmToken"})
    private User user;

    @Enumerated(EnumType.STRING)
    private TransactionType type; // CREDIT / DEBIT

    private BigDecimal amount;
    private String description;
    private BigDecimal balanceAfter;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum TransactionType { CREDIT, DEBIT }
}
