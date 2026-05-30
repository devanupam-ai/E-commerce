package com.ecommerce.dto;

import lombok.Data;
import java.math.BigDecimal;

public class OrderDTO {

    @Data
    public static class PlaceOrderRequest {
        private Long addressId;
        private String paymentType;
        private String shippingType;
        private String paymentTransactionId;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
        private String notes;
        private Double customerLatitude;
        private Double customerLongitude;
        private String customerLocationAddress;
    }

    @Data
    public static class CreatePaymentOrderRequest {
        private Long addressId;
        private String paymentType;
        private String shippingType;
    }

    @Data
    public static class PaymentOrderResponse {
        private String razorpayOrderId;
        private BigDecimal amount;
        private String currency;
        private String keyId;
    }

    @Data
    public static class AssignDeliveryRequest {
        private Long orderId;
        private Long deliveryBoyId;
    }

    @Data
    public static class VerifyOtpRequest {
        private Long orderId;
        private String otp;
    }

    @Data
    public static class BillSummary {
        private BigDecimal subtotal;
        private BigDecimal deliveryCharge;
        private BigDecimal discount;
        private BigDecimal totalAmount;
        private int itemCount;
    }

    @Data
    public static class LocationUpdateRequest {
        private Long orderId;
        private Double latitude;
        private Double longitude;
    }
}
