package com.billbook.config;

import com.billbook.model.BbUser;
import com.billbook.repository.BbUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor @Slf4j
public class DataInitializer implements CommandLineRunner {

    private final BbUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String adminEmail = "admin@billbook.com";
        String adminPassword = "password";

        var existingUser = userRepository.findByEmail(adminEmail);

        if (existingUser.isPresent()) {
            // UPDATE existing user (avoids foreign key constraint errors on DELETE)
            BbUser admin = existingUser.get();
            admin.setName("Admin");
            admin.setPhone("9000000000");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setBusinessName("My Business");
            admin.setRole(BbUser.Role.OWNER);
            admin.setIsActive(true);
            userRepository.save(admin);
            log.info(">>> Admin user updated: {} / {}", adminEmail, adminPassword);
        } else {
            // CREATE new admin user
            BbUser admin = new BbUser();
            admin.setName("Admin");
            admin.setEmail(adminEmail);
            admin.setPhone("9000000000");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setBusinessName("My Business");
            admin.setRole(BbUser.Role.OWNER);
            admin.setIsActive(true);
            userRepository.save(admin);
            log.info(">>> Admin user created: {} / {}", adminEmail, adminPassword);
        }
    }
}
