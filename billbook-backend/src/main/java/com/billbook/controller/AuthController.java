package com.billbook.controller;

import com.billbook.model.BbUser;
import com.billbook.repository.BbUserRepository;
import com.billbook.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/bb/auth") @RequiredArgsConstructor
public class AuthController {
    private final BbUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        if (userRepository.existsByEmail(body.get("email")))
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        if (userRepository.existsByPhone(body.get("phone")))
            return ResponseEntity.badRequest().body(Map.of("error", "Phone already registered"));

        BbUser user = new BbUser();
        user.setName(body.get("name"));
        user.setEmail(body.get("email"));
        user.setPhone(body.get("phone"));
        user.setPassword(passwordEncoder.encode(body.get("password")));
        user.setBusinessName(body.getOrDefault("businessName", "My Business"));
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(buildResponse(user, token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String rawPassword = body.get("password");
        System.out.println(">>> LOGIN ATTEMPT: email=" + email);

        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            System.out.println(">>> LOGIN FAIL: User not found for email=" + email);
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials - user not found"));
        }

        BbUser user = userOpt.get();
        System.out.println(">>> USER FOUND: id=" + user.getId() + " role=" + user.getRole() + " isActive=" + user.getIsActive() + " passwordHash=" + user.getPassword());

        boolean passwordMatch = passwordEncoder.matches(rawPassword, user.getPassword());
        System.out.println(">>> PASSWORD MATCH: " + passwordMatch + " (raw=" + rawPassword + ")");

        boolean isActive = Boolean.TRUE.equals(user.getIsActive());
        System.out.println(">>> IS ACTIVE: " + isActive);

        if (!passwordMatch) {
            System.out.println(">>> LOGIN FAIL: Wrong password");
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials - wrong password"));
        }
        if (!isActive) {
            System.out.println(">>> LOGIN FAIL: User inactive");
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials - user inactive"));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        System.out.println(">>> LOGIN SUCCESS: " + email);
        return ResponseEntity.ok(buildResponse(user, token));
    }

    private Map<String, Object> buildResponse(BbUser user, String token) {
        return Map.of(
            "token", token,
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "businessName", user.getBusinessName() != null ? user.getBusinessName() : "",
            "role", user.getRole().name(),
            "gstin", user.getGstin() != null ? user.getGstin() : ""
        );
    }
}
