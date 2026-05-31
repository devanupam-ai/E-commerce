package com.billbook.repository;

import com.billbook.model.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    List<Quotation> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Quotation> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, Quotation.Status status);
    List<Quotation> findByUserIdAndCustomerIdOrderByCreatedAtDesc(Long userId, Long customerId);
}
