package com.ecommerce.controller;

import com.ecommerce.dto.OrderDTO;
import com.ecommerce.model.DeliveryTracking;
import com.ecommerce.model.EMIPlan;
import com.ecommerce.model.Order;
import com.ecommerce.model.User;
import com.ecommerce.service.EMIService;
import com.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/orders") @RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    private final EMIService emiService;

    @GetMapping("/bill-summary")
    public ResponseEntity<OrderDTO.BillSummary> getBillSummary(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderService.getBillSummary(user.getId()));
    }

    @PostMapping("/create-payment-order")
    public ResponseEntity<OrderDTO.PaymentOrderResponse> createPaymentOrder(@AuthenticationPrincipal User user,
                                                                             @RequestBody OrderDTO.CreatePaymentOrderRequest req) {
        return ResponseEntity.ok(orderService.createPaymentOrder(user.getId(), req));
    }

    @PostMapping("/place")
    public ResponseEntity<Order> placeOrder(@AuthenticationPrincipal User user,
                                            @RequestBody OrderDTO.PlaceOrderRequest req) {
        return ResponseEntity.ok(orderService.placeOrder(user.getId(), req));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderService.getCustomerOrders(user.getId()));
    }

    @PostMapping("/{orderId}/emi")
    public ResponseEntity<EMIPlan> applyEMI(@AuthenticationPrincipal User user,
                                            @PathVariable Long orderId,
                                            @RequestBody java.util.Map<String, Integer> body) {
        int months = body.getOrDefault("months", 3);
        return ResponseEntity.ok(emiService.applyEMI(user.getId(), orderId, months));
    }

    @GetMapping("/{orderId}/location")
    public ResponseEntity<DeliveryTracking> getDeliveryLocation(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getDeliveryLocation(orderId));
    }

    // Admin endpoints
    @GetMapping("/admin/all")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PostMapping("/admin/assign")
    public ResponseEntity<Order> assignDelivery(@RequestBody OrderDTO.AssignDeliveryRequest req) {
        return ResponseEntity.ok(orderService.assignDeliveryBoy(req.getOrderId(), req.getDeliveryBoyId()));
    }

    @PostMapping("/admin/confirm/{orderId}")
    public ResponseEntity<Order> confirmOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.confirmOrder(orderId));
    }

    @PostMapping("/admin/cancel/{orderId}")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId));
    }

    // Delivery boy endpoints
    @GetMapping("/delivery/my-orders")
    public ResponseEntity<List<Order>> getDeliveryOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderService.getDeliveryBoyOrders(user.getId()));
    }

    @PutMapping("/delivery/status/{orderId}")
    public ResponseEntity<Order> updateStatus(@PathVariable Long orderId,
                                              @RequestParam String status,
                                              @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, status, user.getId()));
    }

    @PostMapping("/delivery/verify-otp")
    public ResponseEntity<Order> verifyOtp(@RequestBody OrderDTO.VerifyOtpRequest req) {
        return ResponseEntity.ok(orderService.verifyDeliveryOtp(req.getOrderId(), req.getOtp()));
    }

    @PostMapping("/delivery/location")
    public ResponseEntity<DeliveryTracking> updateLocation(@AuthenticationPrincipal User user,
                                                            @RequestBody OrderDTO.LocationUpdateRequest req) {
        return ResponseEntity.ok(orderService.updateDeliveryLocation(user.getId(), req));
    }
}
