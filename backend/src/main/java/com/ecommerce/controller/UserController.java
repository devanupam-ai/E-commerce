
package com.ecommerce.controller;

import com.ecommerce.model.LoyaltyTransaction;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/user") @RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoyaltyService loyaltyService;

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        if (body.containsKey("name")) user.setName(body.get("name"));
        if (body.containsKey("email")) user.setEmail(body.get("email"));
        if (body.containsKey("phone")) user.setPhone(body.get("phone"));
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (currentPassword == null || newPassword == null) return ResponseEntity.badRequest().body(Map.of("message", "Both passwords required"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
        if (newPassword.length() < 6) return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 6 characters"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping("/loyalty-points")
    public ResponseEntity<Map<String, Object>> getLoyaltyPoints(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(loyaltyService.getLoyaltyInfo(user.getId()));
    }

    @PostMapping("/loyalty-points/redeem")
    public ResponseEntity<LoyaltyTransaction> redeemLoyaltyPoints(@AuthenticationPrincipal User user,
                                                                  @RequestBody Map<String, Long> body) {
        Long rewardId = body.get("rewardId");
        return ResponseEntity.ok(loyaltyService.redeemReward(user.getId(), rewardId));
    }
}
