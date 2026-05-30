package com.ecommerce.repository;

import com.ecommerce.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByIsActiveTrueOrderBySortOrderAsc();
    List<Category> findByIsActiveTrue();
}
