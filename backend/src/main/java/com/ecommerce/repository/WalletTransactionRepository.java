package com.ecommerce.repository;

import com.ecommerce.model.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COALESCE(SUM(CASE WHEN t.type = 'CREDIT' THEN t.amount ELSE -t.amount END), 0) FROM WalletTransaction t WHERE t.user.id = :userId")
    BigDecimal getWalletBalance(Long userId);
}
