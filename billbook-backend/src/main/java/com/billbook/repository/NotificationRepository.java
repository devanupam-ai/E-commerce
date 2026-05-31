
package com.billbook.repository;

import com.billbook.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndCategoryOrderByCreatedAtDesc(Long userId, String category);
    long countByUserIdAndIsReadFalse(Long userId);
    void deleteByUserIdAndIsReadTrue(Long userId);
}
