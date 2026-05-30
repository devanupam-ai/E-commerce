package com.ecommerce.controller;

import com.ecommerce.model.Cart;
import com.ecommerce.model.User;
import com.ecommerce.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/cart") @RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping
    public ResponseEntity<List<Cart>> getCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(cartService.getCart(user.getId()));
    }

    @PostMapping("/add")
    public ResponseEntity<Cart> addToCart(@AuthenticationPrincipal User user,
                                          @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(cartService.addToCart(user.getId(),
                body.get("productId").longValue(), body.get("quantity")));
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateQuantity(@AuthenticationPrincipal User user,
                                            @RequestBody Map<String, Integer> body) {
        Cart cart = cartService.updateQuantity(user.getId(),
                body.get("productId").longValue(), body.get("quantity"));
        return ResponseEntity.ok(cart != null ? cart : Map.of("message", "Item removed"));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(@AuthenticationPrincipal User user) {
        cartService.clearCart(user.getId());
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }
}
