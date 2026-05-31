
package com.billbook.service;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyPointRepository loyaltyPointRepo;
    private final LoyaltyRedemptionRepository redemptionRepo;
    private final CustomerRepository customerRepo;
    private final InvoiceRepository invoiceRepo;

    // Loyalty Config: ₹100 spent = 1 point, 100 points = ₹50 discount
    private static final BigDecimal POINTS_PER_RUPEE = new BigDecimal("0.01"); // 1 point per ₹100
    private static final BigDecimal RUPEES_PER_POINT = new BigDecimal("0.50"); // ₹0.50 per point on redemption
    private static final int MIN_POINTS_REDEEM = 100; // Minimum 100 points to redeem

    // ========== EARN POINTS ON INVOICE ==========
    @Transactional
    public Map<String, Object> earnPoints(Long userId, Long customerId, Long invoiceId, BigDecimal purchaseAmount) {
        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Calculate points: 1 point per ₹100
        BigDecimal pointsEarned = purchaseAmount.multiply(POINTS_PER_RUPEE).setScale(0, RoundingMode.DOWN);

        if (pointsEarned.compareTo(BigDecimal.ZERO) <= 0) {
            return Map.of("message", "No points earned for this amount", "pointsEarned", 0);
        }

        // Get current balance
        BigDecimal currentBalance = loyaltyPointRepo.getTotalBalance(userId, customerId);
        BigDecimal newBalance = currentBalance.add(pointsEarned);

        // Create loyalty transaction
        LoyaltyPoint lp = new LoyaltyPoint();
        lp.setUser(customer.getUser());
        lp.setCustomer(customer);
        lp.setPointsEarned(pointsEarned);
        lp.setPointsRedeemed(BigDecimal.ZERO);
        lp.setPointsBalance(newBalance);
        lp.setPurchaseAmount(purchaseAmount);
        lp.setTransactionType(LoyaltyPoint.TransactionType.EARN);
        lp.setDescription("Points earned on purchase of ₹" + purchaseAmount.setScale(0, RoundingMode.HALF_UP));

        if (invoiceId != null) {
            invoiceRepo.findById(invoiceId).ifPresent(lp::setInvoice);
        }

        loyaltyPointRepo.save(lp);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pointsEarned", pointsEarned);
        result.put("totalBalance", newBalance);
        result.put("purchaseAmount", purchaseAmount);
        result.put("rupeeValue", newBalance.multiply(RUPEES_PER_POINT));
        result.put("message", "🎉 You earned " + pointsEarned + " points!");
        return result;
    }

    // ========== REDEEM POINTS ==========
    @Transactional
    public Map<String, Object> redeemPoints(Long userId, Long customerId, BigDecimal pointsToRedeem, Long invoiceId) {
        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        BigDecimal currentBalance = loyaltyPointRepo.getTotalBalance(userId, customerId);

        // Validate
        if (pointsToRedeem.compareTo(BigDecimal.valueOf(MIN_POINTS_REDEEM)) < 0) {
            return Map.of("error", "Minimum " + MIN_POINTS_REDEEM + " points required to redeem",
                    "currentBalance", currentBalance);
        }
        if (pointsToRedeem.compareTo(currentBalance) > 0) {
            return Map.of("error", "Insufficient points", "currentBalance", currentBalance,
                    "requestedPoints", pointsToRedeem);
        }

        BigDecimal discountAmount = pointsToRedeem.multiply(RUPEES_PER_POINT);
        BigDecimal newBalance = currentBalance.subtract(pointsToRedeem);

        // Create redemption transaction
        LoyaltyPoint lp = new LoyaltyPoint();
        lp.setUser(customer.getUser());
        lp.setCustomer(customer);
        lp.setPointsEarned(BigDecimal.ZERO);
        lp.setPointsRedeemed(pointsToRedeem);
        lp.setPointsBalance(newBalance);
        lp.setPurchaseAmount(BigDecimal.ZERO);
        lp.setTransactionType(LoyaltyPoint.TransactionType.REDEEM);
        lp.setDescription("Redeemed " + pointsToRedeem + " points for ₹" + discountAmount.setScale(0, RoundingMode.HALF_UP) + " discount");

        if (invoiceId != null) {
            invoiceRepo.findById(invoiceId).ifPresent(lp::setInvoice);
        }

        loyaltyPointRepo.save(lp);

        // Create redemption record
        LoyaltyRedemption redemption = new LoyaltyRedemption();
        redemption.setUser(customer.getUser());
        redemption.setCustomer(customer);
        redemption.setPointsRedeemed(pointsToRedeem);
        redemption.setDiscountGiven(discountAmount);
        redemption.setRedemptionCode("LTY-" + System.currentTimeMillis());
        redemption.setIsApplied(false);
        if (invoiceId != null) {
            invoiceRepo.findById(invoiceId).ifPresent(redemption::setInvoice);
        }
        redemptionRepo.save(redemption);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pointsRedeemed", pointsToRedeem);
        result.put("discountAmount", discountAmount.setScale(0, RoundingMode.HALF_UP));
        result.put("remainingBalance", newBalance);
        result.put("redemptionCode", redemption.getRedemptionCode());
        result.put("message", "✅ Redeemed " + pointsToRedeem + " points for ₹" + discountAmount.setScale(0, RoundingMode.HALF_UP) + " discount!");
        return result;
    }

    // ========== GET CUSTOMER LOYALTY SUMMARY ==========
    public Map<String, Object> getCustomerSummary(Long userId, Long customerId) {
        BigDecimal totalBalance = loyaltyPointRepo.getTotalBalance(userId, customerId);
        BigDecimal totalEarned = loyaltyPointRepo.getTotalEarned(userId, customerId);
        BigDecimal totalRedeemed = loyaltyPointRepo.getTotalRedeemed(userId, customerId);
        BigDecimal rupeeValue = totalBalance.multiply(RUPEES_PER_POINT);

        // Get tier
        String tier = getTier(totalEarned);

        // Next tier info
        Map<String, Object> nextTier = getNextTierInfo(totalEarned);

        // Recent transactions
        List<LoyaltyPoint> recent = loyaltyPointRepo.findByUserIdAndCustomerIdOrderByCreatedAtDesc(userId, customerId)
                .stream().limit(10).toList();

        List<Map<String, Object>> transactions = new ArrayList<>();
        for (LoyaltyPoint lp : recent) {
            Map<String, Object> t = new LinkedHashMap<>();
            t.put("id", lp.getId());
            t.put("type", lp.getTransactionType().name());
            t.put("pointsEarned", lp.getPointsEarned());
            t.put("pointsRedeemed", lp.getPointsRedeemed());
            t.put("balance", lp.getPointsBalance());
            t.put("description", lp.getDescription());
            t.put("date", lp.getCreatedAt());
            transactions.add(t);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customerId", customerId);
        result.put("pointsBalance", totalBalance);
        result.put("totalEarned", totalEarned);
        result.put("totalRedeemed", totalRedeemed);
        result.put("rupeeValue", rupeeValue.setScale(0, RoundingMode.HALF_UP));
        result.put("tier", tier);
        result.put("nextTier", nextTier);
        result.put("minPointsToRedeem", MIN_POINTS_REDEEM);
        result.put("recentTransactions", transactions);
        return result;
    }

    // ========== GET ALL CUSTOMERS WITH LOYALTY SUMMARY ==========
    public List<Map<String, Object>> getAllCustomersSummary(Long userId) {
        List<Customer> customers = customerRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Customer c : customers) {
            BigDecimal balance = loyaltyPointRepo.getTotalBalance(userId, c.getId());
            BigDecimal earned = loyaltyPointRepo.getTotalEarned(userId, c.getId());

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("customerId", c.getId());
            map.put("customerName", c.getName());
            map.put("phone", c.getPhone());
            map.put("pointsBalance", balance);
            map.put("totalEarned", earned);
            map.put("rupeeValue", balance.multiply(RUPEES_PER_POINT).setScale(0, RoundingMode.HALF_UP));
            map.put("tier", getTier(earned));
            result.add(map);
        }
        return result;
    }

    // ========== ADD BONUS POINTS ==========
    @Transactional
    public Map<String, Object> addBonusPoints(Long userId, Long customerId, BigDecimal points, String reason) {
        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        BigDecimal currentBalance = loyaltyPointRepo.getTotalBalance(userId, customerId);
        BigDecimal newBalance = currentBalance.add(points);

        LoyaltyPoint lp = new LoyaltyPoint();
        lp.setUser(customer.getUser());
        lp.setCustomer(customer);
        lp.setPointsEarned(points);
        lp.setPointsRedeemed(BigDecimal.ZERO);
        lp.setPointsBalance(newBalance);
        lp.setPurchaseAmount(BigDecimal.ZERO);
        lp.setTransactionType(LoyaltyPoint.TransactionType.BONUS);
        lp.setDescription(reason != null ? reason : "Bonus points added");

        loyaltyPointRepo.save(lp);

        return Map.of(
                "bonusPoints", points,
                "newBalance", newBalance,
                "rupeeValue", newBalance.multiply(RUPEES_PER_POINT).setScale(0, RoundingMode.HALF_UP),
                "message", "🎁 Bonus " + points + " points added!"
        );
    }

    // ========== APPLY REDEMPTION TO INVOICE ==========
    @Transactional
    public Map<String, Object> applyRedemption(String redemptionCode, Long invoiceId) {
        LoyaltyRedemption redemption = redemptionRepo.findByRedemptionCode(redemptionCode)
                .orElseThrow(() -> new RuntimeException("Invalid redemption code"));

        if (redemption.getIsApplied()) {
            return Map.of("error", "This redemption code has already been used");
        }

        Invoice invoice = invoiceRepo.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        redemption.setInvoice(invoice);
        redemption.setIsApplied(true);
        redemptionRepo.save(redemption);

        return Map.of(
                "applied", true,
                "discountAmount", redemption.getDiscountGiven(),
                "pointsRedeemed", redemption.getPointsRedeemed(),
                "invoiceId", invoiceId,
                "message", "✅ Discount of ₹" + redemption.getDiscountGiven().setScale(0, RoundingMode.HALF_UP) + " applied to invoice"
        );
    }

    // ========== TIER SYSTEM ==========
    private String getTier(BigDecimal totalEarned) {
        long points = totalEarned.longValue();
        if (points >= 10000) return "🥇 PLATINUM";
        if (points >= 5000) return "🥈 GOLD";
        if (points >= 1000) return "🥉 SILVER";
        return "⭐ BRONZE";
    }

    private Map<String, Object> getNextTierInfo(BigDecimal totalEarned) {
        long points = totalEarned.longValue();
        if (points >= 10000) return Map.of("currentTier", "PLATINUM", "message", "You are at the highest tier! 🏆");
        if (points >= 5000) return Map.of("currentTier", "GOLD", "nextTier", "PLATINUM", "pointsNeeded", 10000 - points);
        if (points >= 1000) return Map.of("currentTier", "SILVER", "nextTier", "GOLD", "pointsNeeded", 5000 - points);
        return Map.of("currentTier", "BRONZE", "nextTier", "SILVER", "pointsNeeded", 1000 - points);
    }
}
