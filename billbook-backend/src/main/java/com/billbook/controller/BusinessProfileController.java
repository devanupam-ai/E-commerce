package com.billbook.controller;

import com.billbook.model.BusinessProfile;
import com.billbook.model.BbUser;
import com.billbook.repository.BusinessProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/bb/business-profile") @RequiredArgsConstructor
public class BusinessProfileController {
    private final BusinessProfileRepository profileRepo;

    @GetMapping
    public ResponseEntity<BusinessProfile> get(@AuthenticationPrincipal BbUser user) {
        return ResponseEntity.ok(profileRepo.findByUserId(user.getId()).orElse(null));
    }

    @PostMapping
    public BusinessProfile create(@AuthenticationPrincipal BbUser user, @RequestBody BusinessProfile body) {
        body.setUser(user);
        return profileRepo.save(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusinessProfile> update(@AuthenticationPrincipal BbUser user, @PathVariable Long id, @RequestBody BusinessProfile body) {
        BusinessProfile p = profileRepo.findById(id).orElseThrow();
        if (!p.getUser().getId().equals(user.getId())) return ResponseEntity.status(403).build();
        p.setBusinessName(body.getBusinessName());
        p.setOwnerName(body.getOwnerName());
        p.setPhone(body.getPhone());
        p.setEmail(body.getEmail());
        p.setAddress(body.getAddress());
        p.setCity(body.getCity());
        p.setState(body.getState());
        p.setPincode(body.getPincode());
        p.setGstin(body.getGstin());
        p.setPanNumber(body.getPanNumber());
        p.setBankName(body.getBankName());
        p.setBankAccount(body.getBankAccount());
        p.setIfscCode(body.getIfscCode());
        p.setUpiId(body.getUpiId());
        p.setBusinessType(body.getBusinessType());
        return ResponseEntity.ok(profileRepo.save(p));
    }
}
