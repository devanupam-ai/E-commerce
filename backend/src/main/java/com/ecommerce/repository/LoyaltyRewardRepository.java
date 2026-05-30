package com.ecommerce.repository;

import com.ecommerce.model.LoyaltyReward;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoyaltyRewardRepository extends JpaRepository<LoyaltyReward, Long> {
    List<LoyaltyReward> findByActiveTrue();
}
