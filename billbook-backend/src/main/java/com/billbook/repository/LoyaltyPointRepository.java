
package com.billbook.repository;

import com.billbook.model.LoyaltyPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface LoyaltyPointRepository extends JpaRepository<LoyaltyPoint, Long> {
    List<LoyaltyPoint> findByUserIdAndCustomerIdOrderByCreatedAtDesc(Long userId, Long customerId);
    List<LoyaltyPoint> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COALESCE(SUM(lp.pointsBalance), 0) FROM LoyaltyPoint lp WHERE lp.user.id = :userId AND lp.customer.id = :customerId")
    BigDecimal getTotalBalance(Long userId, Long customerId);

    @Query("SELECT COALESCE(SUM(lp.pointsEarned), 0) FROM LoyaltyPoint lp WHERE lp.user.id = :userId AND lp.customer.id = :customerId AND lp.transactionType = 'EARN'")
    BigDecimal getTotalEarned(Long userId, Long customerId);

    @Query("SELECT COALESCE(SUM(lp.pointsRedeemed), 0) FROM LoyaltyPoint lp WHERE lp.user.id = :userId AND lp.customer.id = :customerId AND lp.transactionType = 'REDEEM'")
    BigDecimal getTotalRedeemed(Long userId, Long customerId);

    List<LoyaltyPoint> findByUserIdAndTransactionTypeOrderByCreatedAtDesc(Long userId, LoyaltyPoint.TransactionType type);
}
