package com.ecommerce.repository;

import com.ecommerce.model.ExpenseReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseReceiptRepository extends JpaRepository<ExpenseReceipt, Long> {
    List<ExpenseReceipt> findByUserIdOrderByCreatedAtDesc(Long userId);
}
