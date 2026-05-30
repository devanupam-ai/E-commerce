package com.ecommerce.service;

import com.ecommerce.model.EMIPlan;
import com.ecommerce.model.Order;
import com.ecommerce.repository.EMIPlanRepository;
import com.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service @RequiredArgsConstructor
public class EMIService {

    private final EMIPlanRepository emiPlanRepository;
    private final OrderRepository orderRepository;

    public List<Map<String, Object>> calculateEMIPlans(BigDecimal amount) {
        List<Integer> tenures = List.of(3, 6, 9, 12);
        return tenures.stream().map(months -> {
            double rate = months <= 6 ? 12.0 : 14.0;
            BigDecimal monthlyEmi = calculateEMI(amount, months, rate);
            BigDecimal totalPayable = monthlyEmi.multiply(BigDecimal.valueOf(months));
            BigDecimal interest = totalPayable.subtract(amount);

            Map<String, Object> plan = new HashMap<>();
            plan.put("months", months);
            plan.put("interestRate", rate);
            plan.put("monthlyEmi", monthlyEmi);
            plan.put("totalPayable", totalPayable);
            plan.put("interestAmount", interest);
            return plan;
        }).toList();
    }

    private BigDecimal calculateEMI(BigDecimal principal, int months, double annualRate) {
        double monthlyRate = annualRate / 12 / 100;
        double emi = principal.doubleValue() * monthlyRate * Math.pow(1 + monthlyRate, months)
                / (Math.pow(1 + monthlyRate, months) - 1);
        return BigDecimal.valueOf(emi).setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional
    public EMIPlan applyEMI(Long userId, Long orderId, int months) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Not your order");
        }

        if (order.getTotalAmount().compareTo(new BigDecimal("3000")) < 0) {
            throw new RuntimeException("Order amount must be at least ₹3000 for EMI");
        }

        if (Boolean.TRUE.equals(order.getEmiActive())) {
            throw new RuntimeException("EMI already active on this order");
        }

        List<EMIPlan> existing = emiPlanRepository.findByOrderId(orderId);
        if (!existing.stream().filter(e -> e.getStatus() == EMIPlan.EMIStatus.ACTIVE).toList().isEmpty()) {
            throw new RuntimeException("Active EMI already exists for this order");
        }

        double rate = months <= 6 ? 12.0 : 14.0;
        BigDecimal monthlyEmi = calculateEMI(order.getTotalAmount(), months, rate);
        BigDecimal totalPayable = monthlyEmi.multiply(BigDecimal.valueOf(months));

        EMIPlan plan = new EMIPlan();
        plan.setOrder(order);
        plan.setUser(order.getCustomer());
        plan.setPrincipalAmount(order.getTotalAmount());
        plan.setTenureMonths(months);
        plan.setInterestRate(BigDecimal.valueOf(rate));
        plan.setMonthlyEmi(monthlyEmi);
        plan.setTotalPayable(totalPayable);
        plan.setInterestAmount(totalPayable.subtract(order.getTotalAmount()));
        plan.setStatus(EMIPlan.EMIStatus.ACTIVE);

        order.setEmiActive(true);
        orderRepository.save(order);

        return emiPlanRepository.save(plan);
    }

    public List<EMIPlan> getUserEMIPlans(Long userId) {
        return emiPlanRepository.findByUserId(userId);
    }

    public List<EMIPlan> getActiveEMIPlans(Long userId) {
        return emiPlanRepository.findByUserIdAndStatus(userId, EMIPlan.EMIStatus.ACTIVE);
    }

    @Transactional
    public EMIPlan payEMI(Long planId, Long userId) {
        EMIPlan plan = emiPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("EMI plan not found"));

        if (!plan.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not your EMI plan");
        }

        if (plan.getStatus() != EMIPlan.EMIStatus.ACTIVE) {
            throw new RuntimeException("EMI plan is not active");
        }

        plan.setPaidMonths(plan.getPaidMonths() + 1);
        plan.setPaidAmount(plan.getPaidAmount().add(plan.getMonthlyEmi()));

        if (plan.getPaidMonths() >= plan.getTenureMonths()) {
            plan.setStatus(EMIPlan.EMIStatus.COMPLETED);
        }

        return emiPlanRepository.save(plan);
    }
}
