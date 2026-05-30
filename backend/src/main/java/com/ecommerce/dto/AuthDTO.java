package com.ecommerce.dto;

import lombok.Data;

public class AuthDTO {

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String phone;
        private String password;
        private String role; // optional, defaults to CUSTOMER
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private Long userId;
        private String name;
        private String email;
        private String role;

        public AuthResponse(String token, Long userId, String name, String email, String role) {
            this.token = token; this.userId = userId;
            this.name = name; this.email = email; this.role = role;
        }
    }
}
