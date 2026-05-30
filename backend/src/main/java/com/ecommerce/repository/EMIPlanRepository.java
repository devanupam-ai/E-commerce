package com.ecommerce.repository;

import com.ecommerce.model.EMIPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EMIPlanRepository extends JpaRepository<EMIPlan, Long> {
    List<EMIPlan> findByUserId(Long userId);
    List<EMIPlan> findByOrderId(Long orderId);
    List<EMIPlan> findByUserIdAndStatus(Long userId, EMIPlan.EMIStatus status);
}
