package com.ecommerce.service;

import com.ecommerce.model.LoyaltyReward;
import com.ecommerce.model.LoyaltyTransaction;
import com.ecommerce.model.User;
import com.ecommerce.repository.LoyaltyRewardRepository;
import com.ecommerce.repository.LoyaltyTransactionRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service @RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyTransactionRepository transactionRepository;
    private final LoyaltyRewardRepository rewardRepository;
    private final UserRepository userRepository;

    private static final int POINTS_PER_RUPEE = 1; // 1 point per ₹10 spent
    private static final int RUPEE_DIVISOR = 10;

    public Map<String, Object> getLoyaltyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integer earned = transactionRepository.sumPointsByUserIdAndType(userId, LoyaltyTransaction.TransactionType.EARNED);
        Integer redeemed = transactionRepository.sumPointsByUserIdAndType(userId, LoyaltyTransaction.TransactionType.REDEEMED);

        if (earned == null) earned = 0;
        if (redeemed == null) redeemed = 0;

        int balance = earned - redeemed;

        String tier = getTier(balance);
        List<LoyaltyTransaction> history = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<LoyaltyReward> rewards = rewardRepository.findByActiveTrue();

        Map<String, Object> info = new HashMap<>();
        info.put("points", balance);
        info.put("tier", tier);
        info.put("totalEarned", earned);
        info.put("totalRedeemed", redeemed);
        info.put("history", history);
        info.put("rewards", rewards);
        return info;
    }

    private String getTier(int points) {
        if (points >= 5000) return "Platinum";
        if (points >= 2000) return "Gold";
        if (points >= 500) return "Silver";
        return "Bronze";
    }

    @Transactional
    public void earnPoints(Long userId, BigDecimal orderAmount, Long orderId) {
        int points = orderAmount.divide(BigDecimal.valueOf(RUPEE_DIVISOR), 0, java.math.RoundingMode.DOWN).intValue();

        if (points <= 0) return;

        LoyaltyTransaction tx = new LoyaltyTransaction();
        tx.setUser(userRepository.findById(userId).orElseThrow());
        tx.setType(LoyaltyTransaction.TransactionType.EARNED);
        tx.setPoints(points);
        tx.setDescription("Points earned from order #" + orderId);
        tx.setReferenceId(orderId);
        transactionRepository.save(tx);

        User user = userRepository.findById(userId).orElseThrow();
        user.setLoyaltyPoints((user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0) + points);
        userRepository.save(user);
    }

    @Transactional
    public LoyaltyTransaction redeemReward(Long userId, Long rewardId) {
        LoyaltyReward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new RuntimeException("Reward not found"));

        if (!Boolean.TRUE.equals(reward.getActive())) {
            throw new RuntimeException("Reward is not available");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int currentPoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;

        if (currentPoints < reward.getPointsRequired()) {
            throw new RuntimeException("Insufficient points. You need " + (reward.getPointsRequired() - currentPoints) + " more points.");
        }

        // Deduct points
        user.setLoyaltyPoints(currentPoints - reward.getPointsRequired());
        userRepository.save(user);

        // Create transaction
        LoyaltyTransaction tx = new LoyaltyTransaction();
        tx.setUser(user);
        tx.setType(LoyaltyTransaction.TransactionType.REDEEMED);
        tx.setPoints(reward.getPointsRequired());
        tx.setDescription("Redeemed: " + reward.getName());
        tx.setReferenceId(rewardId);
        return transactionRepository.save(tx);
    }

    @Transactional
    public void addBonusPoints(Long userId, int points, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LoyaltyTransaction tx = new LoyaltyTransaction();
        tx.setUser(user);
        tx.setType(LoyaltyTransaction.TransactionType.BONUS);
        tx.setPoints(points);
        tx.setDescription(description);
        transactionRepository.save(tx);

        user.setLoyaltyPoints((user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0) + points);
        userRepository.save(user);
    }
}
