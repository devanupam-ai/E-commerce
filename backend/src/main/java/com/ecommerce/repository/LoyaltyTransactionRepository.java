package com.ecommerce.repository;

import com.ecommerce.model.LoyaltyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {
    List<LoyaltyTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<LoyaltyTransaction> findByUserIdAndType(Long userId, LoyaltyTransaction.TransactionType type);

    @Query("SELECT COALESCE(SUM(lt.points), 0) FROM LoyaltyTransaction lt WHERE lt.user.id = :userId AND lt.type = :type")
    Integer sumPointsByUserIdAndType(@Param("userId") Long userId, @Param("type") LoyaltyTransaction.TransactionType type);
}
