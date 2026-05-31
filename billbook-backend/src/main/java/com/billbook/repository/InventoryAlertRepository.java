
package com.billbook.repository;

import com.billbook.model.InventoryAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryAlertRepository extends JpaRepository<InventoryAlert, Long> {
    List<InventoryAlert> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<InventoryAlert> findByUserIdAndIsResolvedFalseOrderByCreatedAtDesc(Long userId);
    List<InventoryAlert> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    List<InventoryAlert> findByUserIdAndAlertTypeOrderByCreatedAtDesc(Long userId, InventoryAlert.AlertType alertType);
    long countByUserIdAndIsResolvedFalse(Long userId);
}
