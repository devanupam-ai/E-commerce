package com.ecommerce.repository;

import com.ecommerce.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeAndActiveTrue(String code);
    List<Coupon> findByActiveTrue();
    List<Coupon> findByActiveTrueOrderByCreatedAtDesc();
}