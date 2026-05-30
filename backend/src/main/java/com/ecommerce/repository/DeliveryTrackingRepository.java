package com.ecommerce.repository;

import com.ecommerce.model.DeliveryTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DeliveryTrackingRepository extends JpaRepository<DeliveryTracking, Long> {
    Optional<DeliveryTracking> findTopByOrderIdOrderByUpdatedAtDesc(Long orderId);
}
