
package com.billbook.repository;

import com.billbook.model.LoyaltyRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LoyaltyRedemptionRepository extends JpaRepository<LoyaltyRedemption, Long> {
    List<LoyaltyRedemption> findByUserIdAndCustomerIdOrderByRedeemedAtDesc(Long userId, Long customerId);
    List<LoyaltyRedemption> findByUserIdOrderByRedeemedAtDesc(Long userId);
    Optional<LoyaltyRedemption> findByRedemptionCode(String code);
}
