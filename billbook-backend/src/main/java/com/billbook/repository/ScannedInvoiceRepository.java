
package com.billbook.repository;

import com.billbook.model.ScannedInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScannedInvoiceRepository extends JpaRepository<ScannedInvoice, Long> {
    List<ScannedInvoice> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ScannedInvoice> findByUserIdAndScanStatus(Long userId, ScannedInvoice.ScanStatus status);
}
