package com.billbook.repository;

import com.billbook.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Invoice> findByUserIdAndPaymentStatusOrderByCreatedAtDesc(Long userId, Invoice.PaymentStatus status);
    List<Invoice> findByUserIdAndCustomerIdOrderByCreatedAtDesc(Long userId, Long customerId);

    @Query(value = "SELECT COALESCE(SUM(total_amount),0) FROM bb_invoices WHERE user_id=:userId AND invoice_type='SALE' AND invoice_date BETWEEN :from AND :to", nativeQuery = true)
    BigDecimal totalSalesBetween(Long userId, LocalDate from, LocalDate to);

    @Query(value = "SELECT COALESCE(SUM(balance_due),0) FROM bb_invoices WHERE user_id=:userId AND payment_status IN ('UNPAID','PARTIAL','OVERDUE')", nativeQuery = true)
    BigDecimal totalOutstanding(Long userId);

    List<Invoice> findByUserIdAndDueDateBeforeAndPaymentStatusNot(Long userId, LocalDate date, Invoice.PaymentStatus status);

    long countByUserId(Long userId);

    List<Invoice> findByUserIdAndInvoiceDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
