package com.ecommerce.repository;

import com.ecommerce.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryIdAndIsActiveTrue(Long categoryId);
    List<Product> findByIsActiveTrue();
    List<Product> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);
    List<Product> findByStockQuantityLessThanAndIsActiveTrue(int threshold);
}
