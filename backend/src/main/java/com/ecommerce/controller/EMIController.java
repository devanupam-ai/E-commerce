package com.ecommerce.controller;

import com.ecommerce.model.EMIPlan;
import com.ecommerce.model.User;
import com.ecommerce.service.EMIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/emi") @RequiredArgsConstructor
public class EMIController {

    private final EMIService emiService;

    @GetMapping("/plans")
    public ResponseEntity<List<Map<String, Object>>> getEMIPlans(@RequestParam BigDecimal amount) {
        return ResponseEntity.ok(emiService.calculateEMIPlans(amount));
    }

    @PostMapping("/apply/{orderId}")
    public ResponseEntity<EMIPlan> applyEMI(@AuthenticationPrincipal User user,
                                            @PathVariable Long orderId,
                                            @RequestBody Map<String, Integer> body) {
        int months = body.getOrDefault("months", 3);
        return ResponseEntity.ok(emiService.applyEMI(user.getId(), orderId, months));
    }

    @GetMapping("/my-plans")
    public ResponseEntity<List<EMIPlan>> getMyEMIPlans(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(emiService.getUserEMIPlans(user.getId()));
    }

    @GetMapping("/active-plans")
    public ResponseEntity<List<EMIPlan>> getActiveEMIPlans(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(emiService.getActiveEMIPlans(user.getId()));
    }

    @PostMapping("/pay/{planId}")
    public ResponseEntity<EMIPlan> payEMI(@AuthenticationPrincipal User user,
                                          @PathVariable Long planId) {
        return ResponseEntity.ok(emiService.payEMI(planId, user.getId()));
    }
}
