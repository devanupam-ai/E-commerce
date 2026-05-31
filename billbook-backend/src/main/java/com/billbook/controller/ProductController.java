package com.billbook.controller;

import com.billbook.model.BbProduct;
import com.billbook.model.BbUser;
import com.billbook.repository.BbProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/bb/products") @RequiredArgsConstructor
public class ProductController {
    private final BbProductRepository repo;

    @GetMapping
    public List<BbProduct> list(@AuthenticationPrincipal BbUser user,
                                @RequestParam(required = false) String q) {
        if (q != null && !q.isBlank())
            return repo.findByUserIdAndNameContainingIgnoreCaseAndIsActiveTrue(user.getId(), q);
        return repo.findByUserIdAndIsActiveTrueOrderByNameAsc(user.getId());
    }

    @GetMapping("/low-stock")
    public List<BbProduct> lowStock(@AuthenticationPrincipal BbUser user) {
        return repo.findByUserIdAndStockQuantityLessThanEqualAndIsActiveTrue(user.getId(), BigDecimal.valueOf(5));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal BbUser user, @RequestBody BbProduct p) {
        p.setUser(user);
        return ResponseEntity.ok(repo.save(p));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal BbUser user, @PathVariable Long id, @RequestBody BbProduct body) {
        return repo.findById(id)
            .filter(p -> p.getUser().getId().equals(user.getId()))
            .map(p -> {
                p.setName(body.getName()); p.setDescription(body.getDescription());
                p.setSku(body.getSku()); p.setHsnCode(body.getHsnCode());
                p.setCategory(body.getCategory()); p.setUnit(body.getUnit());
                p.setPurchasePrice(body.getPurchasePrice()); p.setSellingPrice(body.getSellingPrice());
                p.setMrp(body.getMrp()); p.setGstRate(body.getGstRate());
                p.setStockQuantity(body.getStockQuantity()); p.setReorderLevel(body.getReorderLevel());
                return ResponseEntity.ok(repo.save(p));
            }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return repo.findById(id)
            .filter(p -> p.getUser().getId().equals(user.getId()))
            .map(p -> { p.setIsActive(false); repo.save(p); return ResponseEntity.ok(Map.of("ok", true)); })
            .orElse(ResponseEntity.notFound().build());
    }
}
