package com.ecommerce.controller;

import com.ecommerce.model.Category;
import com.ecommerce.model.Product;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/products") @RequiredArgsConstructor
public class ProductController {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findByIsActiveTrueOrderBySortOrderAsc());
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findByIsActiveTrue());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Product>> getByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productRepository.findByCategoryIdAndIsActiveTrue(categoryId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> search(@RequestParam String q) {
        return ResponseEntity.ok(productRepository.findByNameContainingIgnoreCaseAndIsActiveTrue(q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
