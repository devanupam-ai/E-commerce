package com.billbook.repository;

import com.billbook.model.VendorPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VendorPaymentRepository extends JpaRepository<VendorPayment, Long> {
    List<VendorPayment> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
    List<VendorPayment> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<VendorPayment> findByPurchaseIdOrderByCreatedAtDesc(Long purchaseId);
    List<VendorPayment> findByUserIdAndVendorIdOrderByPaymentDateDesc(Long userId, Long vendorId);
}
