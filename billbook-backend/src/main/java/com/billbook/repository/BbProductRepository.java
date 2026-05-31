package com.billbook.repository;

import com.billbook.model.BbProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BbProductRepository extends JpaRepository<BbProduct, Long> {
    List<BbProduct> findByUserIdAndIsActiveTrueOrderByNameAsc(Long userId);
    List<BbProduct> findByUserIdAndStockQuantityLessThanEqualAndIsActiveTrue(Long userId, java.math.BigDecimal level);
    List<BbProduct> findByUserIdAndNameContainingIgnoreCaseAndIsActiveTrue(Long userId, String name);
}
