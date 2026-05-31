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

@RestController @RequestMapping("/api/bb/sale-returns") @RequiredArgsConstructor
public class SaleReturnController {
    private final InvoiceRepository invoiceRepo;
    private final CustomerRepository customerRepo;
    private final BbProductRepository productRepo;
    private final StockMovementRepository stockMovementRepo;

    @GetMapping
    public List<Invoice> list(@AuthenticationPrincipal BbUser user) {
        return invoiceRepo.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
            .filter(i -> i.getInvoiceType() == Invoice.InvoiceType.SALE_RETURN)
            .toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        Long originalInvoiceId = body.get("originalInvoiceId") != null ? Long.valueOf(body.get("originalInvoiceId").toString()) : null;
        Long customerId = Long.valueOf(body.get("customerId").toString());

        Customer customer = customerRepo.findById(customerId).orElseThrow();

        Invoice returnInv = new Invoice();
        returnInv.setUser(user);
        returnInv.setCustomer(customer);
        returnInv.setInvoiceType(Invoice.InvoiceType.SALE_RETURN);
        returnInv.setInvoiceNumber("SR-" + DateTimeFormatter.ofPattern("yyyyMM").format(LocalDateTime.now()) + "-" + String.format("%04d", invoiceRepo.findByUserIdOrderByCreatedAtDesc(user.getId()).size() + 1));
        returnInv.setInvoiceDate(LocalDate.parse(body.getOrDefault("returnDate", LocalDate.now().toString()).toString()));
        returnInv.setIsGst(Boolean.parseBoolean(body.getOrDefault("isGst", false).toString()));
        returnInv.setNotes(body.getOrDefault("notes", "Sale Return").toString());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemsData = (List<Map<String, Object>>) body.get("items");

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        List<InvoiceItem> items = new java.util.ArrayList<>();

        for (Map<String, Object> itemData : itemsData) {
            InvoiceItem item = new InvoiceItem();
            item.setInvoice(returnInv);
            item.setProductName(itemData.get("productName").toString());
            item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
            item.setUnit(itemData.getOrDefault("unit", "PCS").toString());
            item.setUnitPrice(new BigDecimal(itemData.getOrDefault("unitPrice", "0").toString()));
            item.setDiscountPercent(new BigDecimal(itemData.getOrDefault("discountPercent", "0").toString()));
            item.setGstRate(new BigDecimal(itemData.getOrDefault("gstRate", "0").toString()));

            BigDecimal lineTotal = item.getQuantity().multiply(item.getUnitPrice());
            BigDecimal discAmt = lineTotal.multiply(item.getDiscountPercent()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            item.setDiscountAmount(discAmt);
            lineTotal = lineTotal.subtract(discAmt);

            if (returnInv.getIsGst() && item.getGstRate().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal gstAmt = lineTotal.multiply(item.getGstRate()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal half = gstAmt.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
                item.setCgstAmount(half);
                item.setSgstAmount(half);
                totalTax = totalTax.add(gstAmt);
                lineTotal = lineTotal.add(gstAmt);
            }
            item.setTotalPrice(lineTotal);
            subtotal = subtotal.add(item.getQuantity().multiply(item.getUnitPrice()).subtract(discAmt));
            items.add(item);

            // Restore stock - prefer productId, fallback to name match
            if (itemData.get("productId") != null) {
                Long productId = Long.valueOf(itemData.get("productId").toString());
                productRepo.findById(productId).ifPresent(p -> {
                    BigDecimal newStock = p.getStockQuantity().add(item.getQuantity());
                    p.setStockQuantity(newStock);
                    productRepo.save(p);

                    StockMovement sm = new StockMovement();
                    sm.setUser(user);
                    sm.setProduct(p);
                    sm.setType(StockMovement.Type.IN);
                    sm.setQuantity(item.getQuantity());
                    sm.setBalanceAfter(newStock);
                    sm.setReason("Sale Return - " + returnInv.getInvoiceNumber());
                    stockMovementRepo.save(sm);
                });
            } else {
                String productName = item.getProductName();
                productRepo.findByUserIdAndNameContainingIgnoreCaseAndIsActiveTrue(user.getId(), productName).stream().findFirst().ifPresent(p -> {
                    BigDecimal newStock = p.getStockQuantity().add(item.getQuantity());
                    p.setStockQuantity(newStock);
                    productRepo.save(p);

                    StockMovement sm = new StockMovement();
                    sm.setUser(user);
                    sm.setProduct(p);
                    sm.setType(StockMovement.Type.IN);
                    sm.setQuantity(item.getQuantity());
                    sm.setBalanceAfter(newStock);
                    sm.setReason("Sale Return - " + returnInv.getInvoiceNumber());
                    stockMovementRepo.save(sm);
                });
            }
        }

        returnInv.setSubtotal(subtotal);
        returnInv.setTotalTax(totalTax);
        returnInv.setTotalAmount(subtotal.add(totalTax));
        returnInv.setBalanceDue(returnInv.getTotalAmount());
        returnInv.setPaymentStatus(Invoice.PaymentStatus.UNPAID);
        returnInv.setItems(items);

        // Update original invoice balance if referenced
        if (originalInvoiceId != null) {
            invoiceRepo.findById(originalInvoiceId).ifPresent(orig -> {
                BigDecimal newBalance = orig.getBalanceDue().subtract(returnInv.getTotalAmount());
                orig.setBalanceDue(newBalance.max(BigDecimal.ZERO));
                if (newBalance.compareTo(BigDecimal.ZERO) <= 0) orig.setPaymentStatus(Invoice.PaymentStatus.PAID);
                else orig.setPaymentStatus(Invoice.PaymentStatus.PARTIAL);
                invoiceRepo.save(orig);
            });
        }

        return ResponseEntity.ok(invoiceRepo.save(returnInv));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return invoiceRepo.findById(id)
            .filter(i -> i.getUser().getId().equals(user.getId()) && i.getInvoiceType() == Invoice.InvoiceType.SALE_RETURN)
            .map(i -> { invoiceRepo.delete(i); return ResponseEntity.ok(Map.of("ok", true)); })
            .orElse(ResponseEntity.notFound().build());
    }
}
