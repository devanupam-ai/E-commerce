package com.billbook.controller;

import com.billbook.model.BbUser;
import com.billbook.model.Vendor;
import com.billbook.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/bb/vendors") @RequiredArgsConstructor
public class VendorController {
    private final VendorRepository repo;

    @GetMapping
    public List<Vendor> list(@AuthenticationPrincipal BbUser user,
                              @RequestParam(required = false) String q) {
        if (q != null && !q.isBlank())
            return repo.findByUserIdAndNameContainingIgnoreCaseAndIsActiveTrue(user.getId(), q);
        return repo.findByUserIdAndIsActiveTrueOrderByNameAsc(user.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return repo.findById(id)
            .filter(v -> v.getUser().getId().equals(user.getId()))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal BbUser user, @RequestBody Vendor v) {
        v.setUser(user);
        v.setBalanceDue(v.getOpeningBalance() != null ? v.getOpeningBalance() : java.math.BigDecimal.ZERO);
        v.setTotalPurchaseAmount(java.math.BigDecimal.ZERO);
        v.setTotalPaidAmount(java.math.BigDecimal.ZERO);
        return ResponseEntity.ok(repo.save(v));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal BbUser user, @PathVariable Long id, @RequestBody Vendor body) {
        return repo.findById(id)
            .filter(v -> v.getUser().getId().equals(user.getId()))
            .map(v -> {
                v.setName(body.getName());
                v.setEmail(body.getEmail());
                v.setPhone(body.getPhone());
                v.setAddress(body.getAddress());
                v.setCity(body.getCity());
                v.setState(body.getState());
                v.setPincode(body.getPincode());
                v.setGstin(body.getGstin());
                v.setPanNumber(body.getPanNumber());
                v.setBankName(body.getBankName());
                v.setBankAccount(body.getBankAccount());
                v.setIfscCode(body.getIfscCode());
                v.setUpiId(body.getUpiId());
                v.setNotes(body.getNotes());
                return ResponseEntity.ok(repo.save(v));
            }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return repo.findById(id)
            .filter(v -> v.getUser().getId().equals(user.getId()))
            .map(v -> { v.setIsActive(false); repo.save(v); return ResponseEntity.ok(Map.of("ok", true)); })
            .orElse(ResponseEntity.notFound().build());
    }
}
