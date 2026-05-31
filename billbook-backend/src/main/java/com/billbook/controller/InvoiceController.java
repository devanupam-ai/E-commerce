package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/bb/invoices") @RequiredArgsConstructor
public class InvoiceController {
    private final InvoiceRepository invoiceRepo;
    private final CustomerRepository customerRepo;
    private final BbProductRepository productRepo;
    private final PaymentRepository paymentRepo;
    private final StockMovementRepository stockMovementRepo;
    private final KhataEntryRepository khataEntryRepo;

    @GetMapping
    public List<Invoice> list(@AuthenticationPrincipal BbUser user,
                              @RequestParam(required = false) String status,
                              @RequestParam(required = false) Long customerId) {
        if (customerId != null)
            return invoiceRepo.findByUserIdAndCustomerIdOrderByCreatedAtDesc(user.getId(), customerId);
        if (status != null)
            return invoiceRepo.findByUserIdAndPaymentStatusOrderByCreatedAtDesc(user.getId(), Invoice.PaymentStatus.valueOf(status));
        return invoiceRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return invoiceRepo.findById(id)
            .filter(i -> i.getUser().getId().equals(user.getId()))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        Long customerId = Long.valueOf(body.get("customerId").toString());
        Customer customer = customerRepo.findById(customerId).orElseThrow();

        Invoice inv = new Invoice();
        inv.setUser(user);
        inv.setCustomer(customer);
        inv.setInvoiceNumber(generateInvoiceNumber(user.getId()));
        inv.setInvoiceDate(LocalDate.parse(body.get("invoiceDate").toString()));
        if (body.get("dueDate") != null)
            inv.setDueDate(LocalDate.parse(body.get("dueDate").toString()));
        inv.setIsGst(Boolean.parseBoolean(body.getOrDefault("isGst", false).toString()));
        inv.setPaymentMode(Invoice.PaymentMode.valueOf(body.getOrDefault("paymentMode", "CASH").toString()));
        inv.setNotes(body.getOrDefault("notes", "").toString());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemsData = (List<Map<String, Object>>) body.get("items");

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        List<InvoiceItem> items = new java.util.ArrayList<>();
        for (Map<String, Object> itemData : itemsData) {
            InvoiceItem item = new InvoiceItem();
            item.setInvoice(inv);
            item.setProductName(itemData.get("productName").toString());
            item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
            item.setUnit(itemData.getOrDefault("unit", "PCS").toString());
            item.setUnitPrice(new BigDecimal(itemData.get("unitPrice").toString()));
            item.setDiscountPercent(new BigDecimal(itemData.getOrDefault("discountPercent", "0").toString()));
            item.setGstRate(new BigDecimal(itemData.getOrDefault("gstRate", "0").toString()));

            BigDecimal lineTotal = item.getQuantity().multiply(item.getUnitPrice());
            BigDecimal discAmt = lineTotal.multiply(item.getDiscountPercent()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            item.setDiscountAmount(discAmt);
            lineTotal = lineTotal.subtract(discAmt);

            if (inv.getIsGst() && item.getGstRate().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal gstAmt = lineTotal.multiply(item.getGstRate()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal half = gstAmt.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
                item.setCgstAmount(half); item.setSgstAmount(half);
                totalTax = totalTax.add(gstAmt);
                lineTotal = lineTotal.add(gstAmt);
            }
            item.setTotalPrice(lineTotal);
            subtotal = subtotal.add(item.getQuantity().multiply(item.getUnitPrice()).subtract(discAmt));
            items.add(item);

            // Deduct product stock if productId provided
            if (itemData.get("productId") != null) {
                Long productId = Long.valueOf(itemData.get("productId").toString());
                productRepo.findById(productId).ifPresent(product -> {
                    BigDecimal newStock = product.getStockQuantity().subtract(item.getQuantity());
                    product.setStockQuantity(newStock.max(BigDecimal.ZERO));
                    productRepo.save(product);

                    StockMovement sm = new StockMovement();
                    sm.setUser(user);
                    sm.setProduct(product);
                    sm.setType(StockMovement.Type.OUT);
                    sm.setQuantity(item.getQuantity());
                    sm.setBalanceAfter(newStock.max(BigDecimal.ZERO));
                    sm.setReason("Sale: " + inv.getInvoiceNumber());
                    stockMovementRepo.save(sm);
                });
            }
        }

        BigDecimal discountPercent = new BigDecimal(body.getOrDefault("discountPercent", "0").toString());
        BigDecimal discountAmount = subtotal.multiply(discountPercent).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal total = subtotal.subtract(discountAmount).add(totalTax);

        inv.setSubtotal(subtotal);
        inv.setDiscountPercent(discountPercent);
        inv.setDiscountAmount(discountAmount);
        inv.setTotalTax(totalTax);
        inv.setTotalAmount(total);
        inv.setBalanceDue(total);
        inv.setPaymentStatus(Invoice.PaymentStatus.UNPAID);
        inv.setItems(items);

        Invoice saved = invoiceRepo.save(inv);

        // Auto-sync to Khata
        KhataEntry khataEntry = new KhataEntry();
        khataEntry.setUser(user);
        khataEntry.setParty(customer);
        khataEntry.setEntryType(KhataEntry.EntryType.CREDIT_GIVEN);
        khataEntry.setAmount(total);
        khataEntry.setDescription("Invoice #" + saved.getInvoiceNumber());
        khataEntry.setEntryDate(saved.getInvoiceDate());
        khataEntry.setDueDate(saved.getDueDate());
        khataEntry.setReferenceType("INVOICE");
        khataEntry.setReferenceId(saved.getId());
        khataEntryRepo.save(khataEntry);

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<?> recordPayment(@AuthenticationPrincipal BbUser user,
                                           @PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        return invoiceRepo.findById(id)
            .filter(inv -> inv.getUser().getId().equals(user.getId()))
            .map(inv -> {
                BigDecimal amount = new BigDecimal(body.get("amount").toString());
                Payment payment = new Payment();
                payment.setUser(user);
                payment.setInvoice(inv);
                payment.setCustomer(inv.getCustomer());
                payment.setAmount(amount);
                payment.setPaymentDate(LocalDate.now());
                payment.setPaymentMode(Invoice.PaymentMode.valueOf(body.getOrDefault("paymentMode", "CASH").toString()));
                payment.setType(Payment.Type.RECEIVED);
                paymentRepo.save(payment);

                // Auto-sync to Khata
                KhataEntry khataEntry = new KhataEntry();
                khataEntry.setUser(user);
                khataEntry.setParty(inv.getCustomer());
                khataEntry.setEntryType(KhataEntry.EntryType.PAYMENT_RECEIVED);
                khataEntry.setAmount(amount);
                khataEntry.setDescription("Payment for Invoice #" + inv.getInvoiceNumber());
                khataEntry.setEntryDate(LocalDate.now());
                khataEntry.setReferenceType("PAYMENT");
                khataEntry.setReferenceId(payment.getId());
                khataEntryRepo.save(khataEntry);

                BigDecimal newPaid = inv.getPaidAmount().add(amount);
                inv.setPaidAmount(newPaid);
                BigDecimal balance = inv.getTotalAmount().subtract(newPaid);
                inv.setBalanceDue(balance.max(BigDecimal.ZERO));
                if (balance.compareTo(BigDecimal.ZERO) <= 0) inv.setPaymentStatus(Invoice.PaymentStatus.PAID);
                else if (newPaid.compareTo(BigDecimal.ZERO) > 0) inv.setPaymentStatus(Invoice.PaymentStatus.PARTIAL);
                return ResponseEntity.ok(invoiceRepo.save(inv));
            }).orElse(ResponseEntity.notFound().build());
    }

    private String generateInvoiceNumber(Long userId) {
        String prefix = "INV-" + DateTimeFormatter.ofPattern("yyyyMM").format(LocalDateTime.now()) + "-";
        long count = invoiceRepo.countByUserId(userId) + 1;
        return prefix + String.format("%04d", count);
    }
}
