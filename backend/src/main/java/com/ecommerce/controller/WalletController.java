package com.ecommerce.controller;

import com.ecommerce.model.User;
import com.ecommerce.model.WalletTransaction;
import com.ecommerce.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/wallet") @RequiredArgsConstructor
public class WalletController {
    private final WalletTransactionRepository walletRepository;

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getBalance(@AuthenticationPrincipal User user) {
        BigDecimal balance = walletRepository.getWalletBalance(user.getId());
        return ResponseEntity.ok(Map.of("balance", balance, "userId", user.getId()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransaction>> getTransactions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }
}
