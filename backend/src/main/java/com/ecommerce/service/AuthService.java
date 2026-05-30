package com.ecommerce.service;

import com.ecommerce.dto.AuthDTO;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already registered");
        if (userRepository.existsByPhone(req.getPhone()))
            throw new RuntimeException("Phone already registered");

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        if (req.getRole() != null && !req.getRole().isEmpty())
            user.setRole(User.Role.valueOf(req.getRole()));
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthDTO.AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword()))
            throw new RuntimeException("Invalid credentials");
        if (Boolean.FALSE.equals(user.getIsActive()))
            throw new RuntimeException("Account is deactivated");

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthDTO.AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    public void updateFcmToken(Long userId, String fcmToken) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setFcmToken(fcmToken);
            userRepository.save(user);
        });
    }
}
