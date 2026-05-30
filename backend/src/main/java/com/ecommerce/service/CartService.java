package com.ecommerce.service;

import com.ecommerce.model.Cart;
import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    public List<Cart> getCart(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    public Cart addToCart(Long userId, Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        return cartRepository.findByUserIdAndProductId(userId, productId)
                .map(cart -> {
                    cart.setQuantity(cart.getQuantity() + quantity);
                    return cartRepository.save(cart);
                })
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    User user = new User(); user.setId(userId);
                    cart.setUser(user);
                    cart.setProduct(product);
                    cart.setQuantity(quantity);
                    return cartRepository.save(cart);
                });
    }

    public Cart updateQuantity(Long userId, Long productId, int quantity) {
        Cart cart = cartRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        if (quantity <= 0) {
            cartRepository.delete(cart);
            return null;
        }
        cart.setQuantity(quantity);
        return cartRepository.save(cart);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartRepository.deleteByUserId(userId);
    }
}
