package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/bb/stock") @RequiredArgsConstructor
public class StockController {
    private final BbProductRepository productRepo;
    private final StockMovementRepository stockRepo;
    private final InvoiceRepository invoiceRepo;

    @GetMapping("/low-stock")
    public List<BbProduct> lowStock(@AuthenticationPrincipal BbUser user) {
        return productRepo.findByUserIdAndStockQuantityLessThanEqualAndIsActiveTrue(user.getId(), BigDecimal.valueOf(5));
    }

    @GetMapping("/movements")
    public List<StockMovement> movements(@AuthenticationPrincipal BbUser user) {
        return stockRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @PostMapping("/adjust")
    public ResponseEntity<?> adjustStock(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        Long productId = Long.valueOf(body.get("productId").toString());
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());
        String reason = body.getOrDefault("reason", "Manual adjustment").toString();
        String type = body.getOrDefault("type", "ADJUSTMENT").toString();

        return productRepo.findById(productId)
            .filter(p -> p.getUser().getId().equals(user.getId()))
            .map(p -> {
                BigDecimal oldStock = p.getStockQuantity();
                BigDecimal newStock;
                if ("IN".equals(type)) {
                    newStock = oldStock.add(quantity);
                } else if ("OUT".equals(type)) {
                    newStock = oldStock.subtract(quantity);
                    if (newStock.compareTo(BigDecimal.ZERO) < 0) newStock = BigDecimal.ZERO;
                } else {
                    newStock = quantity; // ADJUSTMENT = set to value
                }
                p.setStockQuantity(newStock);
                productRepo.save(p);

                StockMovement sm = new StockMovement();
                sm.setUser(user);
                sm.setProduct(p);
                sm.setType(StockMovement.Type.valueOf(type));
                sm.setQuantity(quantity);
                sm.setBalanceAfter(newStock);
                sm.setReason(reason);
                stockRepo.save(sm);

                return ResponseEntity.ok(Map.of("ok", true, "oldStock", oldStock, "newStock", newStock));
            }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> stockDashboard(@AuthenticationPrincipal BbUser user) {
        Long uid = user.getId();
        List<BbProduct> allProducts = productRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(uid);
        List<BbProduct> lowStock = productRepo.findByUserIdAndStockQuantityLessThanEqualAndIsActiveTrue(uid, BigDecimal.valueOf(5));
        BigDecimal totalStockValue = allProducts.stream()
            .map(p -> p.getStockQuantity().multiply(p.getPurchasePrice() != null ? p.getPurchasePrice() : BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRetailValue = allProducts.stream()
            .map(p -> p.getStockQuantity().multiply(p.getSellingPrice() != null ? p.getSellingPrice() : BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(Map.of(
            "totalProducts", allProducts.size(),
            "lowStockCount", lowStock.size(),
            "lowStockItems", lowStock,
            "totalStockValue", totalStockValue,
            "totalRetailValue", totalRetailValue,
            "recentMovements", stockRepo.findByUserIdOrderByCreatedAtDesc(uid).stream().limit(10).toList()
        ));
    }
}
