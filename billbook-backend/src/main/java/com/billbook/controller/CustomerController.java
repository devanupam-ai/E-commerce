package com.billbook.controller;

import com.billbook.model.BbUser;
import com.billbook.model.Customer;
import com.billbook.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/bb/customers") @RequiredArgsConstructor
public class CustomerController {
    private final CustomerRepository repo;

    @GetMapping
    public List<Customer> list(@AuthenticationPrincipal BbUser user) {
        return repo.findByUserIdAndIsActiveTrueOrderByNameAsc(user.getId());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal BbUser user, @RequestBody Customer c) {
        c.setUser(user);
        return ResponseEntity.ok(repo.save(c));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal BbUser user, @PathVariable Long id, @RequestBody Customer body) {
        return repo.findById(id)
            .filter(c -> c.getUser().getId().equals(user.getId()))
            .map(c -> {
                c.setName(body.getName()); c.setEmail(body.getEmail()); c.setPhone(body.getPhone());
                c.setAddress(body.getAddress()); c.setCity(body.getCity()); c.setState(body.getState());
                c.setPincode(body.getPincode()); c.setGstin(body.getGstin()); c.setType(body.getType());
                return ResponseEntity.ok(repo.save(c));
            }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return repo.findById(id)
            .filter(c -> c.getUser().getId().equals(user.getId()))
            .map(c -> { c.setIsActive(false); repo.save(c); return ResponseEntity.ok(Map.of("ok", true)); })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<?> summary(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return repo.findById(id)
            .filter(c -> c.getUser().getId().equals(user.getId()))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
