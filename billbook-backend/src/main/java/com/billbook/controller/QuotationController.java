package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/bb/quotations") @RequiredArgsConstructor
public class QuotationController {
    private final QuotationRepository quotationRepo;
    private final CustomerRepository customerRepo;
    private final InvoiceRepository invoiceRepo;
    private final BbProductRepository productRepo;
    private final StockMovementRepository stockRepo;

    @GetMapping
    public List<Quotation> list(@AuthenticationPrincipal BbUser user) {
        return quotationRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quotation> get(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        Quotation q = quotationRepo.findById(id).orElseThrow();
        if (!q.getUser().getId().equals(user.getId())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(q);
    }

    @PostMapping
    public Quotation create(@AuthenticationPrincipal BbUser user, @RequestBody Quotation body) {
        body.setUser(user);
        if (body.getCustomer() != null && body.getCustomer().getId() != null) {
            body.setCustomer(customerRepo.findById(body.getCustomer().getId()).orElse(null));
        }
        if (body.getQuotationNumber() == null) {
            body.setQuotationNumber("QT-" + System.currentTimeMillis());
        }
        // Calculate totals
        calculateTotals(body);
        if (body.getItems() != null) {
            for (QuotationItem item : body.getItems()) {
                item.setQuotation(body);
                calculateItemTotal(item);
            }
        }
        return quotationRepo.save(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Quotation> update(@AuthenticationPrincipal BbUser user, @PathVariable Long id, @RequestBody Quotation body) {
        Quotation q = quotationRepo.findById(id).orElseThrow();
        if (!q.getUser().getId().equals(user.getId())) return ResponseEntity.status(403).build();
        q.setCustomer(body.getCustomer() != null && body.getCustomer().getId() != null ?
            customerRepo.findById(body.getCustomer().getId()).orElse(null) : null);
        q.setQuotationDate(body.getQuotationDate());
        q.setValidUntil(body.getValidUntil());
        q.setIsGst(body.getIsGst());
        q.setDiscountPercent(body.getDiscountPercent());
        q.setDiscountAmount(body.getDiscountAmount());
        q.setNotes(body.getNotes());
        q.setTerms(body.getTerms());
        q.setStatus(body.getStatus());
        // Replace items
        q.getItems().clear();
        if (body.getItems() != null) {
            for (QuotationItem item : body.getItems()) {
                item.setQuotation(q);
                calculateItemTotal(item);
                q.getItems().add(item);
            }
        }
        calculateTotals(q);
        return ResponseEntity.ok(quotationRepo.save(q));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<Invoice> convertToInvoice(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        Quotation q = quotationRepo.findById(id).orElseThrow();
        if (!q.getUser().getId().equals(user.getId())) return ResponseEntity.status(403).build();

        Invoice invoice = new Invoice();
        invoice.setUser(user);
        invoice.setCustomer(q.getCustomer());
        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        invoice.setInvoiceDate(java.time.LocalDate.now());
        invoice.setIsGst(q.getIsGst());
        invoice.setSubtotal(q.getSubtotal());
        invoice.setDiscountAmount(q.getDiscountAmount());
        invoice.setCgstAmount(q.getCgstAmount());
        invoice.setSgstAmount(q.getSgstAmount());
        invoice.setIgstAmount(q.getIgstAmount());
        invoice.setTotalTax(q.getTotalTax());
        invoice.setTotalAmount(q.getTotalAmount());
        invoice.setBalanceDue(q.getTotalAmount());
        invoice.setNotes(q.getNotes());
        invoice.setTerms(q.getTerms());

        // Convert items
        java.util.ArrayList<InvoiceItem> invoiceItems = new java.util.ArrayList<>();
        if (q.getItems() != null) {
            for (QuotationItem qi : q.getItems()) {
                InvoiceItem ii = new InvoiceItem();
                ii.setInvoice(invoice);
                ii.setProductName(qi.getProductName());
                ii.setQuantity(qi.getQuantity());
                ii.setUnit(qi.getUnit());
                ii.setUnitPrice(qi.getUnitPrice());
                ii.setDiscountPercent(qi.getDiscountPercent());
                ii.setGstRate(qi.getTaxPercent());
                ii.setTotalPrice(qi.getTotalPrice());
                invoiceItems.add(ii);
            }
        }
        invoice.setItems(invoiceItems);
        Invoice saved = invoiceRepo.save(invoice);

        // Update quotation status
        q.setStatus(Quotation.Status.CONVERTED);
        quotationRepo.save(q);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        Quotation q = quotationRepo.findById(id).orElseThrow();
        if (!q.getUser().getId().equals(user.getId())) return ResponseEntity.status(403).build();
        quotationRepo.delete(q);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private void calculateItemTotal(QuotationItem item) {
        BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
        BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal disc = item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal tax = item.getTaxPercent() != null ? item.getTaxPercent() : BigDecimal.ZERO;
        BigDecimal base = qty.multiply(price);
        BigDecimal afterDisc = base.subtract(base.multiply(disc).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        BigDecimal afterTax = afterDisc.add(afterDisc.multiply(tax).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        item.setTotalPrice(afterTax);
    }

    private void calculateTotals(Quotation q) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        if (q.getItems() != null) {
            for (QuotationItem item : q.getItems()) {
                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
                BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                subtotal = subtotal.add(qty.multiply(price));
                // Calculate tax
                BigDecimal disc = item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO;
                BigDecimal tax = item.getTaxPercent() != null ? item.getTaxPercent() : BigDecimal.ZERO;
                BigDecimal base = qty.multiply(price);
                BigDecimal afterDisc = base.subtract(base.multiply(disc).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
                totalTax = totalTax.add(afterDisc.multiply(tax).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
            }
        }
        q.setSubtotal(subtotal);
        BigDecimal discount = q.getDiscountAmount() != null ? q.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal afterDiscount = subtotal.subtract(discount);
        q.setTotalTax(totalTax);
        q.setCgstAmount(totalTax.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP));
        q.setSgstAmount(totalTax.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP));
        q.setTotalAmount(afterDiscount.add(totalTax));
    }
}
