
package com.ecommerce.controller;

import com.ecommerce.model.Notification;
import com.ecommerce.model.User;
import com.ecommerce.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("count", notificationRepository.countByUserIdAndIsReadFalse(user.getId())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@AuthenticationPrincipal User user, @PathVariable Long id) {
        Notification notif = notificationRepository.findById(id).orElse(null);
        if (notif != null && notif.getUser().getId().equals(user.getId())) {
            notif.setIsRead(true);
            notificationRepository.save(notif);
            return ResponseEntity.ok(Map.of("message", "Marked as read"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Notification not found"));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal User user) {
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        notifs.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifs);
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@AuthenticationPrincipal User user, @PathVariable Long id) {
        Notification notif = notificationRepository.findById(id).orElse(null);
        if (notif != null && notif.getUser().getId().equals(user.getId())) {
            notificationRepository.delete(notif);
            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Notification not found"));
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAll(@AuthenticationPrincipal User user) {
        notificationRepository.deleteByUserId(user.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications cleared"));
    }
}
