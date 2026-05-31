package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/bb/payments") @RequiredArgsConstructor
public class PaymentController {
    private final PaymentRepository paymentRepo;
    private final InvoiceRepository invoiceRepo;
    private final CustomerRepository customerRepo;

    @GetMapping
    public List<Payment> list(@AuthenticationPrincipal BbUser user,
                              @RequestParam(required = false) Long customerId,
                              @RequestParam(required = false) Long invoiceId) {
        if (customerId != null)
            return paymentRepo.findByUserIdAndCustomerIdOrderByCreatedAtDesc(user.getId(), customerId);
        if (invoiceId != null)
            return paymentRepo.findByInvoiceId(invoiceId);
        return paymentRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        Payment payment = new Payment();
        payment.setUser(user);
        payment.setAmount(new BigDecimal(body.get("amount").toString()));
        payment.setPaymentDate(LocalDate.parse(body.getOrDefault("paymentDate", LocalDate.now().toString()).toString()));
        payment.setPaymentMode(Invoice.PaymentMode.valueOf(body.getOrDefault("paymentMode", "CASH").toString()));
        payment.setReferenceNumber(body.getOrDefault("referenceNumber", "").toString());
        payment.setNotes(body.getOrDefault("notes", "").toString());
        payment.setType(Payment.Type.valueOf(body.getOrDefault("type", "RECEIVED").toString()));

        if (body.get("customerId") != null) {
            Long custId = Long.valueOf(body.get("customerId").toString());
            customerRepo.findById(custId).ifPresent(payment::setCustomer);
        }
        if (body.get("invoiceId") != null) {
            Long invId = Long.valueOf(body.get("invoiceId").toString());
            invoiceRepo.findById(invId).ifPresent(inv -> {
                payment.setInvoice(inv);
                // Update invoice payment status
                BigDecimal newPaid = inv.getPaidAmount().add(payment.getAmount());
                inv.setPaidAmount(newPaid);
                BigDecimal balance = inv.getTotalAmount().subtract(newPaid);
                inv.setBalanceDue(balance.max(BigDecimal.ZERO));
                if (balance.compareTo(BigDecimal.ZERO) <= 0) inv.setPaymentStatus(Invoice.PaymentStatus.PAID);
                else if (newPaid.compareTo(BigDecimal.ZERO) > 0) inv.setPaymentStatus(Invoice.PaymentStatus.PARTIAL);
                invoiceRepo.save(inv);
            });
        }

        return ResponseEntity.ok(paymentRepo.save(payment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return paymentRepo.findById(id)
            .filter(p -> p.getUser().getId().equals(user.getId()))
            .map(p -> { paymentRepo.delete(p); return ResponseEntity.ok(Map.of("ok", true)); })
            .orElse(ResponseEntity.notFound().build());
    }
}
