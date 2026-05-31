
package com.billbook.repository;

import com.billbook.model.FestivalAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FestivalAlertRepository extends JpaRepository<FestivalAlert, Long> {
    List<FestivalAlert> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<FestivalAlert> findByUserIdAndFestivalId(Long userId, Long festivalId);
    List<FestivalAlert> findByUserIdAndStatus(Long userId, FestivalAlert.AlertStatus status);
}
