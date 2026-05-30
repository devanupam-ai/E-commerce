
package com.ecommerce.controller;

import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.model.Wishlist;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/wishlist") @RequiredArgsConstructor
public class WishlistController {
    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<List<Wishlist>> getWishlist(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToWishlist(@AuthenticationPrincipal User user, @RequestBody Map<String, Long> body) {
        Long productId = body.get("productId");
        if (productId == null) return ResponseEntity.badRequest().body(Map.of("message", "productId required"));
        if (wishlistRepository.existsByUserIdAndProductId(user.getId(), productId)) return ResponseEntity.ok(Map.of("message", "Already in wishlist"));
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return ResponseEntity.badRequest().body(Map.of("message", "Product not found"));
        Wishlist item = new Wishlist();
        item.setUser(user);
        item.setProduct(product);
        wishlistRepository.save(item);
        return ResponseEntity.ok(Map.of("message", "Added to wishlist"));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFromWishlist(@AuthenticationPrincipal User user, @PathVariable Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(user.getId(), productId);
        return ResponseEntity.ok(Map.of("message", "Removed from wishlist"));
    }
}
