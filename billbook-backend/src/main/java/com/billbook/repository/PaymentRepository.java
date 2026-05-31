package com.billbook.repository;

import com.billbook.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Payment> findByInvoiceId(Long invoiceId);
    List<Payment> findByUserIdAndCustomerIdOrderByCreatedAtDesc(Long userId, Long customerId);
    List<Payment> findByUserIdAndCustomerIdOrderByPaymentDateDesc(Long userId, Long customerId);
    List<Payment> findByUserIdOrderByPaymentDateDesc(Long userId);
}
