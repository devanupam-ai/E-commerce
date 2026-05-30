package com.ecommerce.repository;

import com.ecommerce.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Order> findByDeliveryBoyIdOrderByCreatedAtDesc(Long deliveryBoyId);
    List<Order> findByOrderStatusOrderByCreatedAtDesc(Order.OrderStatus status);
    List<Order> findAllByOrderByCreatedAtDesc();
}
