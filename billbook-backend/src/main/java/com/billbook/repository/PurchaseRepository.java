package com.billbook.repository;

import com.billbook.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Purchase> findByUserIdAndVendorIdOrderByCreatedAtDesc(Long userId, Long vendorId);
    List<Purchase> findByUserIdAndPaymentStatusOrderByCreatedAtDesc(Long userId, Purchase.PaymentStatus status);

    @Query(value = "SELECT COALESCE(SUM(total_amount),0) FROM bb_purchases WHERE user_id=:userId AND purchase_date BETWEEN :from AND :to", nativeQuery = true)
    BigDecimal totalPurchasesBetween(Long userId, LocalDate from, LocalDate to);

    @Query(value = "SELECT COALESCE(SUM(balance_due),0) FROM bb_purchases WHERE user_id=:userId AND payment_status IN ('UNPAID','PARTIAL','OVERDUE')", nativeQuery = true)
    BigDecimal totalPayable(Long userId);
}
