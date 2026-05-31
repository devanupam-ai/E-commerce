package com.billbook.repository;

import com.billbook.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByUserIdAndIsActiveTrueOrderByNameAsc(Long userId);
    List<Customer> findByUserIdAndTypeAndIsActiveTrue(Long userId, Customer.Type type);
    Optional<Customer> findByUserIdAndPhone(Long userId, String phone);
    List<Customer> findByUserIdOrderByNameAsc(Long userId);
    boolean existsByUserIdAndPhone(Long userId, String phone);
}
