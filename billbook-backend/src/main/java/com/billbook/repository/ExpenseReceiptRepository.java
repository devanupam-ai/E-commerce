
package com.billbook.repository;

import com.billbook.model.ExpenseReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseReceiptRepository extends JpaRepository<ExpenseReceipt, Long> {
    List<ExpenseReceipt> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ExpenseReceipt> findByUserIdAndScanStatus(Long userId, ExpenseReceipt.ScanStatus status);
}
