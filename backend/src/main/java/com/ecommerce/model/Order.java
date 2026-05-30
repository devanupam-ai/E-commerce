package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Entity @Table(name = "orders")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String orderNumber;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled","username","fcmToken","createdAt","updatedAt"})
    private User customer;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "delivery_boy_id")
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled","username","fcmToken","createdAt","updatedAt"})
    private User deliveryBoy;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "address_id")
    @JsonIgnoreProperties({"user"})
    private Address address;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"order"})
    private List<OrderItem> items;
    private BigDecimal subtotal;
    private BigDecimal deliveryCharge = BigDecimal.ZERO;
    private BigDecimal discount = BigDecimal.ZERO;
    private BigDecimal totalAmount;
    @Enumerated(EnumType.STRING)
    private PaymentType paymentType;
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    private String paymentTransactionId;
    @Enumerated(EnumType.STRING)
    private ShippingType shippingType = ShippingType.STANDARD;
    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus = OrderStatus.PLACED;
    private String deliveryOtp;
    private Boolean otpVerified = false;
    private String notes;
    private Boolean emiActive = false;
    // Customer location at time of order placement
    private Double customerLatitude;
    private Double customerLongitude;
    private String customerLocationAddress;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum PaymentType { UPI, NET_BANKING, CREDIT_CARD, COD }
    public enum PaymentStatus { PENDING, SUCCESS, FAILED }
    public enum ShippingType { STANDARD, EXPRESS, INSTANT }
    public enum OrderStatus { PLACED, CONFIRMED, ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED }
}
