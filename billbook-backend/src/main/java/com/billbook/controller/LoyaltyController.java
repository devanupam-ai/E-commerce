
package com.billbook.controller;

import com.billbook.model.BbUser;
import com.billbook.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/bb/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    // ========== EARN POINTS ON PURCHASE ==========
    @PostMapping("/earn")
    public ResponseEntity<?> earnPoints(
            @AuthenticationPrincipal BbUser user,
            @RequestBody Map<String, Object> body) {

        Long customerId = Long.valueOf(body.get("customerId").toString());
        Long invoiceId = body.get("invoiceId") != null ? Long.valueOf(body.get("invoiceId").toString()) : null;
        BigDecimal purchaseAmount = new BigDecimal(body.get("purchaseAmount").toString());

        Map<String, Object> result = loyaltyService.earnPoints(user.getId(), customerId, invoiceId, purchaseAmount);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ========== REDEEM POINTS ==========
    @PostMapping("/redeem")
    public ResponseEntity<?> redeemPoints(
            @AuthenticationPrincipal BbUser user,
            @RequestBody Map<String, Object> body) {

        Long customerId = Long.valueOf(body.get("customerId").toString());
        BigDecimal pointsToRedeem = new BigDecimal(body.get("points").toString());
        Long invoiceId = body.get("invoiceId") != null ? Long.valueOf(body.get("invoiceId").toString()) : null;

        Map<String, Object> result = loyaltyService.redeemPoints(user.getId(), customerId, pointsToRedeem, invoiceId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ========== GET CUSTOMER LOYALTY SUMMARY ==========
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getCustomerSummary(
            @AuthenticationPrincipal BbUser user,
            @PathVariable Long customerId) {
        Map<String, Object> summary = loyaltyService.getCustomerSummary(user.getId(), customerId);
        return ResponseEntity.ok(summary);
    }

    // ========== GET ALL CUSTOMERS WITH LOYALTY ==========
    @GetMapping("/customers")
    public ResponseEntity<?> getAllCustomersSummary(@AuthenticationPrincipal BbUser user) {
        List<Map<String, Object>> summary = loyaltyService.getAllCustomersSummary(user.getId());
        return ResponseEntity.ok(Map.of("customers", summary, "total", summary.size()));
    }

    // ========== ADD BONUS POINTS ==========
    @PostMapping("/bonus")
    public ResponseEntity<?> addBonusPoints(
            @AuthenticationPrincipal BbUser user,
            @RequestBody Map<String, Object> body) {

        Long customerId = Long.valueOf(body.get("customerId").toString());
        BigDecimal points = new BigDecimal(body.get("points").toString());
        String reason = (String) body.getOrDefault("reason", "Bonus points added by business");

        Map<String, Object> result = loyaltyService.addBonusPoints(user.getId(), customerId, points, reason);
        return ResponseEntity.ok(result);
    }

    // ========== APPLY REDEMPTION CODE TO INVOICE ==========
    @PostMapping("/apply-redemption")
    public ResponseEntity<?> applyRedemption(@RequestBody Map<String, String> body) {
        String redemptionCode = body.get("redemptionCode");
        Long invoiceId = Long.valueOf(body.get("invoiceId").toString());

        Map<String, Object> result = loyaltyService.applyRedemption(redemptionCode, invoiceId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ========== GET LOYALTY CONFIG ==========
    @GetMapping("/config")
    public ResponseEntity<?> getLoyaltyConfig() {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("pointsPerHundredRupees", 1);
        config.put("rupeeValuePerPoint", 0.50);
        config.put("minPointsToRedeem", 100);
        config.put("tiers", List.of(
            Map.of("name", "BRONZE", "emoji", "⭐", "minPoints", 0, "benefit", "Base earning rate"),
            Map.of("name", "SILVER", "emoji", "🥉", "minPoints", 1000, "benefit", "1.5x earning rate"),
            Map.of("name", "GOLD", "emoji", "🥈", "minPoints", 5000, "benefit", "2x earning + birthday bonus"),
            Map.of("name", "PLATINUM", "emoji", "🥇", "minPoints", 10000, "benefit", "3x earning + exclusive offers")
        ));
        return ResponseEntity.ok(config);
    }
}
