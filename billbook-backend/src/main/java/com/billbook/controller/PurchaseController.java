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

@RestController @RequestMapping("/api/bb/purchases") @RequiredArgsConstructor
public class PurchaseController {
    private final PurchaseRepository purchaseRepo;
    private final VendorRepository vendorRepo;
    private final BbProductRepository productRepo;
    private final VendorPaymentRepository vendorPaymentRepo;
    private final StockMovementRepository stockMovementRepo;
    private final KhataEntryRepository khataEntryRepo;
    private final CustomerRepository customerRepo;

    @GetMapping
    public List<Purchase> list(@AuthenticationPrincipal BbUser user,
                                @RequestParam(required = false) String status,
                                @RequestParam(required = false) Long vendorId) {
        if (vendorId != null)
            return purchaseRepo.findByUserIdAndVendorIdOrderByCreatedAtDesc(user.getId(), vendorId);
        if (status != null)
            return purchaseRepo.findByUserIdAndPaymentStatusOrderByCreatedAtDesc(user.getId(), Purchase.PaymentStatus.valueOf(status));
        return purchaseRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return purchaseRepo.findById(id)
            .filter(p -> p.getUser().getId().equals(user.getId()))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        Long vendorId = Long.valueOf(body.get("vendorId").toString());
        Vendor vendor = vendorRepo.findById(vendorId).orElseThrow();

        Purchase purchase = new Purchase();
        purchase.setUser(user);
        purchase.setVendor(vendor);
        purchase.setPurchaseNumber(generatePurchaseNumber(user.getId()));
        purchase.setPurchaseDate(LocalDate.parse(body.get("purchaseDate").toString()));
        if (body.get("dueDate") != null)
            purchase.setDueDate(LocalDate.parse(body.get("dueDate").toString()));
        purchase.setIsGst(Boolean.parseBoolean(body.getOrDefault("isGst", false).toString()));
        purchase.setPaymentMode(Purchase.PaymentMode.valueOf(body.getOrDefault("paymentMode", "CASH").toString()));
        purchase.setNotes(body.getOrDefault("notes", "").toString());
        if (body.get("invoiceNumber") != null)
            purchase.setInvoiceNumber(body.get("invoiceNumber").toString());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemsData = (List<Map<String, Object>>) body.get("items");

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        List<PurchaseItem> items = new java.util.ArrayList<>();
        for (Map<String, Object> itemData : itemsData) {
            PurchaseItem item = new PurchaseItem();
            item.setPurchase(purchase);
            item.setProductName(itemData.get("productName").toString());
            item.setQuantity(new BigDecimal(itemData.get("quantity").toString()));
            item.setUnit(itemData.getOrDefault("unit", "PCS").toString());
            item.setUnitPrice(new BigDecimal(itemData.get("unitPrice").toString()));
            item.setPurchasePrice(new BigDecimal(itemData.getOrDefault("purchasePrice", itemData.get("unitPrice").toString()).toString()));
            item.setDiscountPercent(new BigDecimal(itemData.getOrDefault("discountPercent", "0").toString()));
            item.setGstRate(new BigDecimal(itemData.getOrDefault("gstRate", "0").toString()));

            // Link product if productId provided
            if (itemData.get("productId") != null) {
                Long productId = Long.valueOf(itemData.get("productId").toString());
                productRepo.findById(productId).ifPresent(item::setProduct);
            }

            BigDecimal lineTotal = item.getQuantity().multiply(item.getUnitPrice());
            BigDecimal discAmt = lineTotal.multiply(item.getDiscountPercent()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            item.setDiscountAmount(discAmt);
            lineTotal = lineTotal.subtract(discAmt);

            if (purchase.getIsGst() && item.getGstRate().compareTo(BigDecimal.ZERO) > 0) {
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

            // Update product stock if linked
            if (item.getProduct() != null) {
                BbProduct product = item.getProduct();
                BigDecimal newStock = product.getStockQuantity().add(item.getQuantity());
                product.setStockQuantity(newStock);
                product.setPurchasePrice(item.getPurchasePrice());
                productRepo.save(product);

                // Record stock movement
                StockMovement sm = new StockMovement();
                sm.setUser(user);
                sm.setProduct(product);
                sm.setInvoice(null);
                sm.setType(StockMovement.Type.IN);
                sm.setQuantity(item.getQuantity());
                sm.setBalanceAfter(newStock);
                sm.setReason("Purchase: " + purchase.getPurchaseNumber());
                stockMovementRepo.save(sm);
            }
        }

        BigDecimal discountPercent = new BigDecimal(body.getOrDefault("discountPercent", "0").toString());
        BigDecimal discountAmount = subtotal.multiply(discountPercent).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal total = subtotal.subtract(discountAmount).add(totalTax);

        purchase.setSubtotal(subtotal);
        purchase.setDiscountPercent(discountPercent);
        purchase.setDiscountAmount(discountAmount);
        purchase.setTotalTax(totalTax);
        purchase.setTotalAmount(total);
        purchase.setBalanceDue(total);
        purchase.setPaymentStatus(Purchase.PaymentStatus.UNPAID);
        purchase.setItems(items);

        Purchase saved = purchaseRepo.save(purchase);

        // Update vendor totals
        vendor.setTotalPurchaseAmount(vendor.getTotalPurchaseAmount().add(total));
        vendor.setBalanceDue(vendor.getBalanceDue().add(total));
        vendorRepo.save(vendor);

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<?> recordPayment(@AuthenticationPrincipal BbUser user,
                                            @PathVariable Long id,
                                            @RequestBody Map<String, Object> body) {
        return purchaseRepo.findById(id)
            .filter(p -> p.getUser().getId().equals(user.getId()))
            .map(purchase -> {
                BigDecimal amount = new BigDecimal(body.get("amount").toString());
                Vendor vendor = purchase.getVendor();

                VendorPayment payment = new VendorPayment();
                payment.setUser(user);
                payment.setVendor(vendor);
                payment.setPurchase(purchase);
                payment.setAmount(amount);
                payment.setPaymentDate(LocalDate.now());
                payment.setPaymentMode(Purchase.PaymentMode.valueOf(body.getOrDefault("paymentMode", "CASH").toString()));
                payment.setReferenceNumber(body.getOrDefault("referenceNumber", "").toString());
                payment.setNotes(body.getOrDefault("notes", "").toString());
                vendorPaymentRepo.save(payment);

                // Auto-sync to Khata - find or create customer for this vendor
                customerRepo.findByUserIdAndPhone(user.getId(), vendor.getPhone()).ifPresent(party -> {
                    KhataEntry khataEntry = new KhataEntry();
                    khataEntry.setUser(user);
                    khataEntry.setParty(party);
                    khataEntry.setEntryType(KhataEntry.EntryType.PAYMENT_MADE);
                    khataEntry.setAmount(amount);
                    khataEntry.setDescription("Payment for Purchase #" + purchase.getPurchaseNumber());
                    khataEntry.setEntryDate(LocalDate.now());
                    khataEntry.setReferenceType("VENDOR_PAYMENT");
                    khataEntry.setReferenceId(payment.getId());
                    khataEntryRepo.save(khataEntry);
                });

                // Update purchase payment status
                BigDecimal newPaid = purchase.getPaidAmount().add(amount);
                purchase.setPaidAmount(newPaid);
                BigDecimal balance = purchase.getTotalAmount().subtract(newPaid);
                purchase.setBalanceDue(balance.max(BigDecimal.ZERO));
                if (balance.compareTo(BigDecimal.ZERO) <= 0) purchase.setPaymentStatus(Purchase.PaymentStatus.PAID);
                else if (newPaid.compareTo(BigDecimal.ZERO) > 0) purchase.setPaymentStatus(Purchase.PaymentStatus.PARTIAL);
                purchaseRepo.save(purchase);

                // Update vendor totals
                vendor.setTotalPaidAmount(vendor.getTotalPaidAmount().add(amount));
                vendor.setBalanceDue(vendor.getTotalPurchaseAmount().subtract(vendor.getTotalPaidAmount()).add(vendor.getOpeningBalance() != null ? vendor.getOpeningBalance() : BigDecimal.ZERO));
                vendorRepo.save(vendor);

                return ResponseEntity.ok(purchase);
            }).orElse(ResponseEntity.notFound().build());
    }

    // Vendor Ledger - all transactions for a vendor
    @GetMapping("/vendor-ledger/{vendorId}")
    public ResponseEntity<?> vendorLedger(@AuthenticationPrincipal BbUser user, @PathVariable Long vendorId) {
        return vendorRepo.findById(vendorId)
            .filter(v -> v.getUser().getId().equals(user.getId()))
            .map(vendor -> {
                List<Purchase> purchases = purchaseRepo.findByUserIdAndVendorIdOrderByCreatedAtDesc(user.getId(), vendorId);
                List<VendorPayment> payments = vendorPaymentRepo.findByVendorIdOrderByCreatedAtDesc(vendorId);
                return ResponseEntity.ok(Map.of(
                    "vendor", vendor,
                    "purchases", purchases,
                    "payments", payments,
                    "totalPurchase", vendor.getTotalPurchaseAmount(),
                    "totalPaid", vendor.getTotalPaidAmount(),
                    "balanceDue", vendor.getBalanceDue()
                ));
            }).orElse(ResponseEntity.notFound().build());
    }

    private String generatePurchaseNumber(Long userId) {
        String prefix = "PUR-" + DateTimeFormatter.ofPattern("yyyyMM").format(LocalDateTime.now()) + "-";
        long count = purchaseRepo.findByUserIdOrderByCreatedAtDesc(userId).size() + 1;
        return prefix + String.format("%04d", count);
    }
}
