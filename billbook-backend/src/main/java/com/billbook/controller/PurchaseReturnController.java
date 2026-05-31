package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/bb/purchase-returns") @RequiredArgsConstructor
public class PurchaseReturnController {
    private final PurchaseRepository purchaseRepo;
    private final VendorRepository vendorRepo;
    private final BbProductRepository productRepo;
    private final StockMovementRepository stockMovementRepo;

    @GetMapping
    public List<Purchase> list(@AuthenticationPrincipal BbUser user) {
        return purchaseRepo.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
            .filter(p -> p.getPurchaseNumber() != null && p.getPurchaseNumber().startsWith("PR-"))
            .toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        Long vendorId = Long.valueOf(body.get("vendorId").toString());
        Vendor vendor = vendorRepo.findById(vendorId).orElseThrow();

        Purchase returnPur = new Purchase();
        returnPur.setUser(user);
        returnPur.setVendor(vendor);
        returnPur.setPurchaseNumber("PR-" + DateTimeFormatter.ofPattern("yyyyMM").format(LocalDateTime.now()) + "-" + String.format("%04d", purchaseRepo.findByUserIdOrderByCreatedAtDesc(user.getId()).size() + 1));
        returnPur.setPurchaseDate(LocalDate.parse(body.getOrDefault("returnDate", LocalDate.now().toString()).toString()));
        returnPur.setIsGst(Boolean.parseBoolean(body.getOrDefault("isGst", false).toString()));
        returnPur.setNotes(body.getOrDefault("notes", "Purchase Return").toString());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemsData = (List<Map<String, Object>>) body.get("items");

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        List<PurchaseItem> items = new java.util.ArrayList<>();

        for (Map<String, Object> itemData : itemsData) {
            PurchaseItem item = new PurchaseItem();
            item.setPurchase(returnPur);
            item.setProductName(itemData.get("productName").toString());
            item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
            item.setUnit(itemData.getOrDefault("unit", "PCS").toString());
            item.setUnitPrice(new BigDecimal(itemData.getOrDefault("unitPrice", "0").toString()));
            item.setDiscountPercent(new BigDecimal(itemData.getOrDefault("discountPercent", "0").toString()));
            item.setGstRate(new BigDecimal(itemData.getOrDefault("gstRate", "0").toString()));

            BigDecimal lineTotal = item.getQuantity().multiply(item.getUnitPrice());
            BigDecimal discAmt = lineTotal.multiply(item.getDiscountPercent()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            lineTotal = lineTotal.subtract(discAmt);

            if (returnPur.getIsGst() && item.getGstRate().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal taxAmt = lineTotal.multiply(item.getGstRate()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal half = taxAmt.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
                item.setCgstAmount(half);
                item.setSgstAmount(half);
                totalTax = totalTax.add(taxAmt);
                lineTotal = lineTotal.add(taxAmt);
            }
            item.setTotalPrice(lineTotal);
            subtotal = subtotal.add(item.getQuantity().multiply(item.getUnitPrice()).subtract(discAmt));
            items.add(item);

            // Deduct stock - prefer productId, fallback to name match
            if (itemData.get("productId") != null) {
                Long productId = Long.valueOf(itemData.get("productId").toString());
                productRepo.findById(productId).ifPresent(p -> {
                    BigDecimal newStock = p.getStockQuantity().subtract(item.getQuantity()).max(BigDecimal.ZERO);
                    p.setStockQuantity(newStock);
                    productRepo.save(p);

                    StockMovement sm = new StockMovement();
                    sm.setUser(user);
                    sm.setProduct(p);
                    sm.setType(StockMovement.Type.OUT);
                    sm.setQuantity(item.getQuantity());
                    sm.setBalanceAfter(newStock);
                    sm.setReason("Purchase Return - " + returnPur.getPurchaseNumber());
                    stockMovementRepo.save(sm);
                });
            } else {
                String productName = item.getProductName();
                productRepo.findByUserIdAndNameContainingIgnoreCaseAndIsActiveTrue(user.getId(), productName).stream().findFirst().ifPresent(p -> {
                    BigDecimal newStock = p.getStockQuantity().subtract(item.getQuantity()).max(BigDecimal.ZERO);
                    p.setStockQuantity(newStock);
                    productRepo.save(p);

                    StockMovement sm = new StockMovement();
                    sm.setUser(user);
                    sm.setProduct(p);
                    sm.setType(StockMovement.Type.OUT);
                    sm.setQuantity(item.getQuantity());
                    sm.setBalanceAfter(newStock);
                    sm.setReason("Purchase Return - " + returnPur.getPurchaseNumber());
                    stockMovementRepo.save(sm);
                });
            }
        }

        returnPur.setSubtotal(subtotal);
        returnPur.setTotalTax(totalTax);
        returnPur.setTotalAmount(subtotal.add(totalTax));
        returnPur.setBalanceDue(returnPur.getTotalAmount());
        returnPur.setPaymentStatus(Purchase.PaymentStatus.UNPAID);
        returnPur.setItems(items);

        return ResponseEntity.ok(purchaseRepo.save(returnPur));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return purchaseRepo.findById(id)
            .filter(p -> p.getUser().getId().equals(user.getId()) && p.getPurchaseNumber() != null && p.getPurchaseNumber().startsWith("PR-"))
            .map(p -> { purchaseRepo.delete(p); return ResponseEntity.ok(Map.of("ok", true)); })
            .orElse(ResponseEntity.notFound().build());
    }
}
