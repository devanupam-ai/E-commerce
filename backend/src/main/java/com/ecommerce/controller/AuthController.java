package com.ecommerce.controller;

import com.ecommerce.dto.AuthDTO;
import com.ecommerce.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthDTO.RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDTO.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PutMapping("/fcm-token/{userId}")
    public ResponseEntity<?> updateFcmToken(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        authService.updateFcmToken(userId, body.get("fcmToken"));
        return ResponseEntity.ok(Map.of("message", "FCM token updated"));
    }
}
