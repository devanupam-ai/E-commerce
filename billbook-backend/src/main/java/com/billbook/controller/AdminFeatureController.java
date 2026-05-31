
package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.service.AdminFeatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/bb/admin-features")
@RequiredArgsConstructor
public class AdminFeatureController {

    private final AdminFeatureService service;

    // ==================== 1. THEME ====================
    @GetMapping("/theme")
    public ResponseEntity<?> getTheme(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(service.getTheme(user.getId()));
    }

    @PutMapping("/theme")
    public ResponseEntity<?> updateTheme(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateTheme(user.getId(), body));
    }

    // ==================== 2. DASHBOARD BUILDER ====================
    @GetMapping("/dashboard-layout")
    public ResponseEntity<?> getDashboardLayout(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(service.getDashboardLayout(user.getId()));
    }

    @PostMapping("/dashboard-layout")
    public ResponseEntity<?> saveDashboardLayout(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.saveDashboardLayout(user.getId(), body.get("layout")));
    }

    // ==================== 3. HEATMAP CALENDAR ====================
    @GetMapping("/heatmap")
    public ResponseEntity<?> getHeatmap(
            @AuthenticationPrincipal BbUser user,
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "0") int month) {
        if (year == 0) year = java.time.LocalDate.now().getYear();
        if (month == 0) month = java.time.LocalDate.now().getMonthValue();
        return ResponseEntity.ok(Map.of("heatmap", service.getHeatmapData(user.getId(), year, month)));
    }

    // ==================== 4. AI INSIGHTS ====================
    @GetMapping("/ai-insights")
    public ResponseEntity<?> getAIInsights(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(service.getAIInsights(user.getId()));
    }

    // ==================== 5. INVENTORY ALERTS ====================
    @GetMapping("/inventory-alerts")
    public ResponseEntity<?> getInventoryAlerts(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(Map.of("alerts", service.getInventoryAlerts(user.getId())));
    }

    @PutMapping("/inventory-alerts/{alertId}/resolve")
    public ResponseEntity<?> resolveAlert(@AuthenticationPrincipal BbUser user, @PathVariable Long alertId) {
        return ResponseEntity.ok(service.resolveAlert(alertId));
    }

    // ==================== 6. CASH FLOW ====================
    @GetMapping("/cash-flow")
    public ResponseEntity<?> getCashFlow(
            @AuthenticationPrincipal BbUser user,
            @RequestParam(defaultValue = "MONTH") String period) {
        return ResponseEntity.ok(service.getCashFlowTimeline(user.getId(), period));
    }

    @PostMapping("/cash-flow")
    public ResponseEntity<?> addCashFlowEntry(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.addCashFlowEntry(user.getId(), body));
    }

    // ==================== 7. EXPENSE RECEIPT SCANNER ====================
    @PostMapping("/expense-receipt/scan")
    public ResponseEntity<?> scanExpenseReceipt(
            @AuthenticationPrincipal BbUser user,
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Please upload an image"));
        return ResponseEntity.ok(service.scanExpenseReceipt(user, file));
    }

    @PostMapping("/expense-receipt/{id}/confirm")
    public ResponseEntity<?> confirmExpenseReceipt(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.confirmExpenseReceipt(id, body));
    }

    @GetMapping("/expense-receipts")
    public ResponseEntity<?> getExpenseReceipts(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(Map.of("receipts", service.getExpenseReceipts(user.getId())));
    }

    // ==================== 8. NOTIFICATIONS ====================
    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(Map.of("notifications", service.getNotifications(user.getId())));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(Map.of("count", service.getUnreadCount(user.getId())));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(service.markNotificationRead(id));
    }

    @PutMapping("/notifications/mark-all-read")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(service.markAllRead(user.getId()));
    }

    @PutMapping("/notifications/{id}/pin")
    public ResponseEntity<?> togglePin(@PathVariable Long id) {
        return ResponseEntity.ok(service.togglePin(id));
    }

    @DeleteMapping("/notifications/clear-read")
    public ResponseEntity<?> clearRead(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(service.clearReadNotifications(user.getId()));
    }

    // ==================== 9. BUSINESS CARD ====================
    @GetMapping("/business-card")
    public ResponseEntity<?> getBusinessCard(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(service.getBusinessCard(user.getId()));
    }

    @PutMapping("/business-card")
    public ResponseEntity<?> updateBusinessCard(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateBusinessCard(user.getId(), body));
    }

    @PostMapping("/business-card/share")
    public ResponseEntity<?> shareBusinessCard(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(service.shareBusinessCard(user.getId()));
    }
}
