
package com.ecommerce.controller;

import com.ecommerce.model.Coupon;
import com.ecommerce.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/coupons") @RequiredArgsConstructor
public class CouponController {
    private final CouponRepository couponRepository;

    @GetMapping
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findByActiveTrueOrderByCreatedAtDesc());
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateCoupon(@RequestBody Map<String, Object> body) {
        String code = (String) body.get("code");
        Object amtObj = body.get("orderAmount");
        BigDecimal orderAmount = amtObj != null ? new BigDecimal(amtObj.toString()) : BigDecimal.ZERO;
        if (code == null || code.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Coupon code is required"));
        Coupon coupon = couponRepository.findByCodeAndActiveTrue(code.toUpperCase()).orElse(null);
        if (coupon == null) return ResponseEntity.badRequest().body(Map.of("message", "Invalid coupon code"));
        if (coupon.getExpiryDate().isBefore(LocalDate.now())) return ResponseEntity.badRequest().body(Map.of("message", "Coupon has expired"));
        if (coupon.getUsageLimit() > 0 && coupon.getUsageCount() >= coupon.getUsageLimit()) return ResponseEntity.badRequest().body(Map.of("message", "Coupon usage limit reached"));
        if (coupon.getMinOrderValue() != null && orderAmount.compareTo(coupon.getMinOrderValue()) < 0) return ResponseEntity.badRequest().body(Map.of("message", "Minimum order value is Rs." + coupon.getMinOrderValue()));
        BigDecimal discount;
        if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            discount = orderAmount.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
            if (coupon.getMaxDiscount() != null) discount = discount.min(coupon.getMaxDiscount());
        } else {
            discount = coupon.getDiscountValue();
            if (coupon.getMaxDiscount() != null) discount = discount.min(coupon.getMaxDiscount());
        }
        coupon.setUsageCount(coupon.getUsageCount() + 1);
        couponRepository.save(coupon);
        return ResponseEntity.ok(Map.of("valid", true, "discount", discount, "discountType", coupon.getDiscountType().name(), "discountValue", coupon.getDiscountValue(), "code", coupon.getCode(), "message", "Coupon applied successfully!"));
    }
}
