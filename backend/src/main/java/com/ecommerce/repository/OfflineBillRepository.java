package com.ecommerce.repository;

import com.ecommerce.model.OfflineBill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OfflineBillRepository extends JpaRepository<OfflineBill, Long> {
    List<OfflineBill> findAllByOrderByCreatedAtDesc();
}
