package com.ecommerce.controller;

import com.ecommerce.model.LoyaltyTransaction;
import com.ecommerce.model.User;
import com.ecommerce.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController @RequestMapping("/api/loyalty") @RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getLoyaltyInfo(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(loyaltyService.getLoyaltyInfo(user.getId()));
    }

    @PostMapping("/redeem")
    public ResponseEntity<LoyaltyTransaction> redeemReward(@AuthenticationPrincipal User user,
                                                           @RequestBody Map<String, Long> body) {
        Long rewardId = body.get("rewardId");
        return ResponseEntity.ok(loyaltyService.redeemReward(user.getId(), rewardId));
    }

    @PostMapping("/admin/bonus")
    public ResponseEntity<String> addBonusPoints(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        int points = Integer.parseInt(body.get("points").toString());
        String description = body.getOrDefault("description", "Admin bonus").toString();
        loyaltyService.addBonusPoints(userId, points, description);
        return ResponseEntity.ok("Bonus points added successfully");
    }
}
