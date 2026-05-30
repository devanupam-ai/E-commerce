package com.ecommerce.controller;

import com.ecommerce.model.Category;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductImage;
import com.ecommerce.model.User;
import com.ecommerce.model.Coupon;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.math.BigDecimal;

@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
public class AdminController {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final CouponRepository couponRepository;
    private final ProductImageRepository productImageRepository;

    @Value("${app.upload.dir:uploads/products/}")
    private String uploadDir;

    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    @GetMapping("/delivery-boys")
    public ResponseEntity<List<User>> getDeliveryBoys() {
        return ResponseEntity.ok(userRepository.findByRole(User.Role.DELIVERY_BOY));
    }

    @GetMapping("/customers")
    public ResponseEntity<List<User>> getCustomers() {
        return ResponseEntity.ok(userRepository.findByRole(User.Role.CUSTOMER));
    }

    // Dashboard stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", orderRepository.count());
        stats.put("totalProducts", productRepository.count());
        stats.put("totalCustomers", userRepository.findByRole(User.Role.CUSTOMER).size());
        stats.put("lowStockProducts", productRepository.findByStockQuantityLessThanAndIsActiveTrue(10));
        return ResponseEntity.ok(stats);
    }

    // Product management
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @PostMapping("/products")
    public ResponseEntity<Product> addProduct(@RequestBody Product product) {
        // Auto-calculate discount percent
        if (product.getMrp() != null && product.getPrice() != null && product.getMrp().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discount = product.getMrp().subtract(product.getPrice())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(product.getMrp(), 2, BigDecimal.ROUND_HALF_UP);
            product.setDiscountPercent(discount);
        }
        // Set selling price if not provided
        if (product.getSellingPrice() == null) {
            product.setSellingPrice(product.getPrice());
        }
        Product saved = productRepository.save(product);
        // Save images if provided
        if (product.getImages() != null) {
            for (ProductImage img : product.getImages()) {
                if (img.getImageUrl() != null && !img.getImageUrl().isEmpty()) {
                    img.setProduct(saved);
                    productImageRepository.save(img);
                }
            }
        }
        return ResponseEntity.ok(productRepository.findById(saved.getId()).orElse(saved));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product updated) {
        return productRepository.findById(id).map(p -> {
            p.setName(updated.getName());
            p.setPrice(updated.getPrice());
            p.setSellingPrice(updated.getSellingPrice());
            p.setMrp(updated.getMrp());
            p.setDiscountPercent(updated.getDiscountPercent());
            p.setUnit(updated.getUnit());
            p.setStockQuantity(updated.getStockQuantity());
            p.setIsActive(updated.getIsActive());
            p.setDescription(updated.getDescription());
            p.setImageUrl(updated.getImageUrl());
            if (updated.getCategory() != null) p.setCategory(updated.getCategory());
            // Auto-calculate discount percent
            if (p.getMrp() != null && p.getPrice() != null && p.getMrp().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal discount = p.getMrp().subtract(p.getPrice())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(p.getMrp(), 2, BigDecimal.ROUND_HALF_UP);
                p.setDiscountPercent(discount);
            }
            // Update images
            productImageRepository.deleteByProductId(id);
            if (updated.getImages() != null) {
                for (ProductImage img : updated.getImages()) {
                    if (img.getImageUrl() != null && !img.getImageUrl().isEmpty()) {
                        img.setProduct(p);
                        img.setId(null);
                        productImageRepository.save(img);
                    }
                }
            }
            return ResponseEntity.ok(productRepository.findById(p.getId()).orElse(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Image upload endpoint
    @PostMapping("/products/upload-image")
    public ResponseEntity<Map<String, String>> uploadProductImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String filename = System.currentTimeMillis() + "_" + (int)(Math.random() * 1000) + extension;
            File dest = new File(dir.getAbsolutePath() + File.separator + filename);
            file.transferTo(dest);

            String imageUrl = baseUrl + "/" + uploadDir + filename;
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl, "filename", filename));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    // Add image to product
    @PostMapping("/products/{productId}/images")
    public ResponseEntity<ProductImage> addProductImage(@PathVariable Long productId, @RequestBody ProductImage image) {
        return productRepository.findById(productId).map(p -> {
            image.setProduct(p);
            return ResponseEntity.ok(productImageRepository.save(image));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete image from product
    @DeleteMapping("/products/images/{imageId}")
    public ResponseEntity<Void> deleteProductImage(@PathVariable Long imageId) {
        productImageRepository.deleteById(imageId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/products/{id}/stock")
    public ResponseEntity<Product> updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        return productRepository.findById(id).map(p -> {
            p.setStockQuantity(body.get("stockQuantity"));
            return ResponseEntity.ok(productRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productRepository.findById(id).ifPresent(p -> { p.setIsActive(false); productRepository.save(p); });
        return ResponseEntity.ok().build();
    }

    // Category management
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> addCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody Category updated) {
        return categoryRepository.findById(id).map(c -> {
            c.setName(updated.getName());
            c.setEmoji(updated.getEmoji());
            c.setSortOrder(updated.getSortOrder());
            c.setIsActive(updated.getIsActive());
            return ResponseEntity.ok(categoryRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }
    // Coupon management
    @GetMapping("/coupons")
    public ResponseEntity<List<Coupon>> getCoupons() {
        return ResponseEntity.ok(couponRepository.findByActiveTrueOrderByCreatedAtDesc());
    }

    @PostMapping("/coupons")
    public ResponseEntity<Coupon> createCoupon(@RequestBody Coupon coupon) {
        coupon.setUsageCount(0);
        coupon.setActive(true);
        coupon.setCreatedAt(java.time.LocalDateTime.now());
        coupon.setUpdatedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @PutMapping("/coupons/{id}")
    public ResponseEntity<Coupon> updateCoupon(@PathVariable Long id, @RequestBody Coupon updated) {
        return couponRepository.findById(id).map(coupon -> {
            coupon.setCode(updated.getCode());
            coupon.setDiscountType(updated.getDiscountType());
            coupon.setDiscountValue(updated.getDiscountValue());
            coupon.setMinOrderValue(updated.getMinOrderValue());
            coupon.setMaxDiscount(updated.getMaxDiscount());
            coupon.setExpiryDate(updated.getExpiryDate());
            coupon.setUsageLimit(updated.getUsageLimit());
            coupon.setActive(updated.getActive());
            coupon.setUpdatedAt(java.time.LocalDateTime.now());
            return ResponseEntity.ok(couponRepository.save(coupon));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        couponRepository.findById(id).ifPresent(coupon -> {
            coupon.setActive(false);
            couponRepository.save(coupon);
        });
        return ResponseEntity.ok().build();
    }
}
