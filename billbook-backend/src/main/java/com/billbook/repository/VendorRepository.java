package com.billbook.repository;

import com.billbook.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findByUserIdAndIsActiveTrueOrderByNameAsc(Long userId);
    List<Vendor> findByUserIdOrderByNameAsc(Long userId);
    List<Vendor> findByUserIdAndNameContainingIgnoreCaseAndIsActiveTrue(Long userId, String name);
}
