package com.ecommerce.service;

import com.ecommerce.dto.OrderDTO;
import com.ecommerce.model.*;
import com.ecommerce.repository.*;
import com.ecommerce.repository.WalletTransactionRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final OfflineBillRepository offlineBillRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final FCMService fcmService;

    @Value("${razorpay.key.id}") private String razorpayKeyId;
    @Value("${razorpay.key.secret}") private String razorpayKeySecret;

    public OrderDTO.PaymentOrderResponse createPaymentOrder(Long userId, OrderDTO.CreatePaymentOrderRequest req) {
        List<Cart> cartItems = cartRepository.findByUserId(userId);
        if (cartItems.isEmpty()) throw new RuntimeException("Cart is empty");

        BigDecimal subtotal = cartItems.stream()
                .map(c -> c.getProduct().getPrice().multiply(BigDecimal.valueOf(c.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deliveryCharge = subtotal.compareTo(BigDecimal.valueOf(200)) >= 0
                ? BigDecimal.ZERO : BigDecimal.valueOf(30);
        BigDecimal total = subtotal.add(deliveryCharge);

        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject options = new JSONObject();
            options.put("amount", total.multiply(BigDecimal.valueOf(100)).intValue());
            options.put("currency", "INR");
            options.put("receipt", "rcpt_" + System.currentTimeMillis());
            com.razorpay.Order razorpayOrder = client.orders.create(options);

            OrderDTO.PaymentOrderResponse response = new OrderDTO.PaymentOrderResponse();
            response.setRazorpayOrderId(razorpayOrder.get("id"));
            response.setAmount(total);
            response.setCurrency("INR");
            response.setKeyId(razorpayKeyId);
            return response;
        } catch (RazorpayException e) {
            throw new RuntimeException("Payment order creation failed: " + e.getMessage());
        }
    }

    private boolean verifyRazorpaySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256"));
            String generated = HexFormat.of().formatHex(mac.doFinal(payload.getBytes()));
            return generated.equals(signature);
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public Order placeOrder(Long userId, OrderDTO.PlaceOrderRequest req) {
        List<Cart> cartItems = cartRepository.findByUserId(userId);
        if (cartItems.isEmpty()) throw new RuntimeException("Cart is empty");

        Address address = addressRepository.findById(req.getAddressId())
                .orElseThrow(() -> new RuntimeException("Address not found"));
        User customer = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify stock availability
        for (Cart cartItem : cartItems) {
            Product p = cartItem.getProduct();
            if (p.getStockQuantity() < cartItem.getQuantity())
                throw new RuntimeException("Insufficient stock for: " + p.getName());
        }

        // Verify Razorpay signature for online payments
        Order.PaymentStatus paymentStatus = Order.PaymentStatus.PENDING;
        if (!"COD".equals(req.getPaymentType())) {
            if (req.getRazorpayOrderId() == null || req.getRazorpayPaymentId() == null || req.getRazorpaySignature() == null)
                throw new RuntimeException("Payment verification details missing");
            boolean valid = verifyRazorpaySignature(req.getRazorpayOrderId(), req.getRazorpayPaymentId(), req.getRazorpaySignature());
            if (!valid) throw new RuntimeException("Payment verification failed");
            paymentStatus = Order.PaymentStatus.SUCCESS;
        }

        BigDecimal subtotal = cartItems.stream()
                .map(c -> c.getProduct().getPrice().multiply(BigDecimal.valueOf(c.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deliveryCharge = subtotal.compareTo(BigDecimal.valueOf(200)) >= 0
                ? BigDecimal.ZERO : BigDecimal.valueOf(30);
        BigDecimal total = subtotal.add(deliveryCharge);

        Order order = new Order();
        order.setOrderNumber("ORD" + System.currentTimeMillis());
        order.setCustomer(customer);
        order.setAddress(address);
        order.setSubtotal(subtotal);
        order.setDeliveryCharge(deliveryCharge);
        order.setTotalAmount(total);
        order.setPaymentType(Order.PaymentType.valueOf(req.getPaymentType()));
        order.setShippingType(Order.ShippingType.valueOf(req.getShippingType() != null ? req.getShippingType() : "STANDARD"));
        order.setPaymentTransactionId(req.getRazorpayPaymentId());
        order.setPaymentStatus(paymentStatus);
        order.setNotes(req.getNotes());
        order.setDeliveryOtp(String.format("%06d", new Random().nextInt(999999)));
        // Save customer location
        order.setCustomerLatitude(req.getCustomerLatitude());
        order.setCustomerLongitude(req.getCustomerLongitude());
        order.setCustomerLocationAddress(req.getCustomerLocationAddress());

        List<OrderItem> items = cartItems.stream().map(c -> {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(c.getProduct());
            item.setProductName(c.getProduct().getName());
            item.setProductImage(c.getProduct().getImageUrl());
            item.setQuantity(c.getQuantity());
            item.setUnitPrice(c.getProduct().getPrice());
            item.setTotalPrice(c.getProduct().getPrice().multiply(BigDecimal.valueOf(c.getQuantity())));
            return item;
        }).collect(Collectors.toList());
        order.setItems(items);

        Order saved = orderRepository.save(order);

        // Deduct stock
        cartItems.forEach(c -> {
            Product p = c.getProduct();
            p.setStockQuantity(p.getStockQuantity() - c.getQuantity());
            productRepository.save(p);
        });

        cartRepository.deleteByUserId(userId);

        // Notify admins
        userRepository.findByRole(User.Role.ADMIN).forEach(admin -> {
            if (admin.getFcmToken() != null)
                fcmService.sendNotification(admin.getFcmToken(), "🛒 New Order #" + saved.getOrderNumber(),
                        "New order by " + customer.getName() + " • ₹" + total, saved.getId());
        });

        return saved;
    }

    public OrderDTO.BillSummary getBillSummary(Long userId) {
        List<Cart> cartItems = cartRepository.findByUserId(userId);
        BigDecimal subtotal = cartItems.stream()
                .map(c -> c.getProduct().getPrice().multiply(BigDecimal.valueOf(c.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deliveryCharge = subtotal.compareTo(BigDecimal.valueOf(200)) >= 0
                ? BigDecimal.ZERO : BigDecimal.valueOf(30);

        OrderDTO.BillSummary bill = new OrderDTO.BillSummary();
        bill.setSubtotal(subtotal);
        bill.setDeliveryCharge(deliveryCharge);
        bill.setDiscount(BigDecimal.ZERO);
        bill.setTotalAmount(subtotal.add(deliveryCharge));
        bill.setItemCount(cartItems.size());
        return bill;
    }

    public List<Order> getCustomerOrders(Long userId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Order assignDeliveryBoy(Long orderId, Long deliveryBoyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        User deliveryBoy = userRepository.findById(deliveryBoyId)
                .orElseThrow(() -> new RuntimeException("Delivery boy not found"));

        order.setDeliveryBoy(deliveryBoy);
        order.setOrderStatus(Order.OrderStatus.ASSIGNED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        if (deliveryBoy.getFcmToken() != null)
            fcmService.sendNotification(deliveryBoy.getFcmToken(),
                    "📦 New Delivery Assignment", "Order #" + order.getOrderNumber() + " assigned to you", orderId);

        return saved;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String status, Long deliveryBoyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setOrderStatus(Order.OrderStatus.valueOf(status));
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    @Transactional
    public DeliveryTracking updateDeliveryLocation(Long deliveryBoyId, OrderDTO.LocationUpdateRequest req) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));
        User deliveryBoy = userRepository.findById(deliveryBoyId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        DeliveryTracking tracking = deliveryTrackingRepository
                .findTopByOrderIdOrderByUpdatedAtDesc(req.getOrderId())
                .orElse(new DeliveryTracking());
        tracking.setOrder(order);
        tracking.setDeliveryBoy(deliveryBoy);
        tracking.setLatitude(req.getLatitude());
        tracking.setLongitude(req.getLongitude());
        tracking.setStatus(order.getOrderStatus().name());
        tracking.setUpdatedAt(LocalDateTime.now());
        return deliveryTrackingRepository.save(tracking);
    }

    public DeliveryTracking getDeliveryLocation(Long orderId) {
        return deliveryTrackingRepository.findTopByOrderIdOrderByUpdatedAtDesc(orderId).orElse(null);
    }

    @Transactional
    public Order verifyDeliveryOtp(Long orderId, String otp) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getDeliveryOtp().equals(otp))
            throw new RuntimeException("Invalid OTP");
        order.setOtpVerified(true);
        order.setOrderStatus(Order.OrderStatus.DELIVERED);
        order.setUpdatedAt(LocalDateTime.now());

        // Notify customer
        if (order.getCustomer().getFcmToken() != null)
            fcmService.sendNotification(order.getCustomer().getFcmToken(),
                    "✅ Order Delivered!", "Your order #" + order.getOrderNumber() + " has been delivered.", orderId);

        // Notify admin
        userRepository.findByRole(User.Role.ADMIN).forEach(admin -> {
            if (admin.getFcmToken() != null)
                fcmService.sendNotification(admin.getFcmToken(),
                        "✅ Order Delivered", "Order #" + order.getOrderNumber() + " delivered successfully.", orderId);
        });

        return orderRepository.save(order);
    }

    public List<Order> getDeliveryBoyOrders(Long deliveryBoyId) {
        return orderRepository.findByDeliveryBoyIdOrderByCreatedAtDesc(deliveryBoyId);
    }

    @Transactional
    public Order confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getOrderStatus() != Order.OrderStatus.PLACED)
            throw new RuntimeException("Order is not in PLACED status");

        order.setOrderStatus(Order.OrderStatus.CONFIRMED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        // Auto-create offline bill entry for this order
        OfflineBill bill = new OfflineBill();
        bill.setBillNumber("BILL-" + saved.getOrderNumber());
        bill.setCustomerName(saved.getCustomer().getName());
        bill.setCustomerPhone(saved.getCustomer().getPhone());
        bill.setTotalAmount(saved.getTotalAmount());
        bill.setPaymentMode(saved.getPaymentType().name());
        bill.setBillDate(LocalDateTime.now());
        bill.setCreatedAt(LocalDateTime.now());
        String itemsSummary = saved.getItems().stream()
                .map(i -> i.getProductName() + " x" + i.getQuantity())
                .collect(Collectors.joining(", "));
        bill.setItemsSummary(itemsSummary);
        offlineBillRepository.save(bill);

        // Notify customer
        if (saved.getCustomer().getFcmToken() != null)
            fcmService.sendNotification(saved.getCustomer().getFcmToken(),
                    "✅ Order Confirmed!",
                    "Your order #" + saved.getOrderNumber() + " has been confirmed.",
                    saved.getId());

        return saved;
    }

    @Transactional
    public Order cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getOrderStatus() == Order.OrderStatus.DELIVERED)
            throw new RuntimeException("Cannot cancel a delivered order");

        // Restore stock for each item
        order.getItems().forEach(item -> {
            Product p = item.getProduct();
            p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
            productRepository.save(p);
        });

        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        // Notify customer
        if (saved.getCustomer().getFcmToken() != null)
            fcmService.sendNotification(saved.getCustomer().getFcmToken(),
                    "❌ Order Cancelled",
                    "Your order #" + saved.getOrderNumber() + " has been cancelled.",
                    saved.getId());

        return saved;
    }
}
