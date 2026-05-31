
package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController @RequestMapping("/api/bb/whatsapp") @RequiredArgsConstructor
public class WhatsAppController {
    private final InvoiceRepository invoiceRepo;
    private final CustomerRepository customerRepo;
    private final VendorRepository vendorRepo;
    private final BbProductRepository productRepo;
    private final PurchaseRepository purchaseRepo;
    private final KhataEntryRepository khataEntryRepo;

    // ========== GENERATE WHATSAPP LINK ==========
    private String waLink(String phone, String message) {
        if (phone == null || phone.trim().isEmpty()) return "";
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        if (cleanPhone.length() == 10) cleanPhone = "91" + cleanPhone;
        return "https://wa.me/" + cleanPhone + "?text=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
    }

    private String fmt(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    // ========== 1. SEND INVOICE ==========
    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<?> sendInvoice(@AuthenticationPrincipal BbUser user, @PathVariable Long invoiceId) {
        Invoice inv = invoiceRepo.findById(invoiceId).orElseThrow(() -> new RuntimeException("Invoice not found"));
        if (!inv.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        String customerName = inv.getCustomer() != null ? inv.getCustomer().getName() : "Customer";
        String phone = inv.getCustomer() != null ? inv.getCustomer().getPhone() : "";

        String biz = user.getBusinessName() != null ? user.getBusinessName() : "BillBook";

        StringBuilder msg = new StringBuilder();
        msg.append("🧾 *INVOICE from ").append(biz).append("*\n\n");
        msg.append("Hello ").append(customerName).append(",\n\n");
        msg.append("Here is your invoice details:\n\n");
        msg.append("📋 Invoice #: ").append(inv.getInvoiceNumber()).append("\n");
        msg.append("📅 Date: ").append(inv.getInvoiceDate()).append("\n");
        if (inv.getDueDate() != null) msg.append("📅 Due Date: ").append(inv.getDueDate()).append("\n");
        msg.append("\n");

        // Items
        if (inv.getItems() != null && !inv.getItems().isEmpty()) {
            msg.append("━━━━━━━━━━━━━━━━━━━━━\n");
            msg.append("*ITEMS:*\n\n");
            int sl = 1;
            for (InvoiceItem item : inv.getItems()) {
                msg.append(sl++).append(". ").append(item.getProductName());
                msg.append(" × ").append(item.getQuantity()).append(" ").append(item.getUnit() != null ? item.getUnit() : "PCS");
                msg.append(" = ₹").append(fmt(item.getTotalPrice())).append("\n");
            }
            msg.append("━━━━━━━━━━━━━━━━━━━━━\n\n");
        }

        // Totals
        msg.append("💰 Subtotal: ₹").append(fmt(inv.getSubtotal())).append("\n");
        if (inv.getDiscountAmount() != null && inv.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0)
            msg.append("🏷️ Discount: -₹").append(fmt(inv.getDiscountAmount())).append("\n");
        if (inv.getTotalTax() != null && inv.getTotalTax().compareTo(BigDecimal.ZERO) > 0)
            msg.append("📊 Tax: ₹").append(fmt(inv.getTotalTax())).append("\n");
        msg.append("\n*TOTAL: ₹").append(fmt(inv.getTotalAmount())).append("*\n\n");

        if (inv.getPaidAmount() != null && inv.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            msg.append("✅ Paid: ₹").append(fmt(inv.getPaidAmount())).append("\n");
            msg.append("⏳ Balance Due: ₹").append(fmt(inv.getBalanceDue())).append("\n\n");
        }

        msg.append("Status: ").append(inv.getPaymentStatus()).append("\n\n");
        if (inv.getNotes() != null && !inv.getNotes().isEmpty())
            msg.append("📝 Note: ").append(inv.getNotes()).append("\n\n");

        msg.append("Thank you for your business! 🙏\n");
        msg.append("— ").append(biz);

        String link = waLink(phone, msg.toString());
        return ResponseEntity.ok(Map.of("whatsappLink", link, "message", msg.toString(), "phone", phone));
    }

    // ========== 2. SEND PAYMENT REMINDER ==========
    @GetMapping("/reminder/{customerId}")
    public ResponseEntity<?> sendReminder(@AuthenticationPrincipal BbUser user, @PathVariable Long customerId) {
        Customer customer = customerRepo.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
        if (!customer.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        // Get outstanding from invoices
        BigDecimal outstanding = BigDecimal.ZERO;
        List<Invoice> unpaidInvoices = new ArrayList<>();
        for (Invoice inv : invoiceRepo.findByUserIdAndCustomerIdOrderByCreatedAtDesc(user.getId(), customerId)) {
            if (inv.getPaymentStatus() != Invoice.PaymentStatus.PAID) {
                outstanding = outstanding.add(inv.getBalanceDue());
                unpaidInvoices.add(inv);
            }
        }

        String biz = user.getBusinessName() != null ? user.getBusinessName() : "BillBook";
        StringBuilder msg = new StringBuilder();
        msg.append("⏳ *PAYMENT REMINDER*\n\n");
        msg.append("Hello ").append(customer.getName()).append(",\n\n");
        msg.append("You have an outstanding balance of *₹").append(fmt(outstanding)).append("*.\n\n");

        if (!unpaidInvoices.isEmpty()) {
            msg.append("📋 *Pending Invoices:*\n");
            for (Invoice inv : unpaidInvoices.subList(0, Math.min(5, unpaidInvoices.size()))) {
                msg.append("• ").append(inv.getInvoiceNumber())
                   .append(" — ₹").append(fmt(inv.getBalanceDue()));
                if (inv.getDueDate() != null)
                    msg.append(" (Due: ").append(inv.getDueDate()).append(")");
                msg.append("\n");
            }
            if (unpaidInvoices.size() > 5)
                msg.append("... and ").append(unpaidInvoices.size() - 5).append(" more\n");
            msg.append("\n");
        }

        msg.append("Kindly clear the dues at your earliest convenience.\n\n");
        msg.append("Thank you! 🙏\n");
        msg.append("— ").append(biz);

        String link = waLink(customer.getPhone(), msg.toString());
        return ResponseEntity.ok(Map.of("whatsappLink", link, "message", msg.toString(), "outstanding", outstanding, "phone", customer.getPhone()));
    }

    // ========== 3. SEND OVERDUE NOTICE ==========
    @GetMapping("/overdue/{customerId}")
    public ResponseEntity<?> sendOverdueNotice(@AuthenticationPrincipal BbUser user, @PathVariable Long customerId) {
        Customer customer = customerRepo.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
        if (!customer.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        LocalDate today = LocalDate.now();
        List<Invoice> overdueInvoices = invoiceRepo.findByUserIdAndDueDateBeforeAndPaymentStatusNot(
            user.getId(), today, Invoice.PaymentStatus.PAID)
            .stream().filter(i -> i.getCustomer() != null && i.getCustomer().getId().equals(customerId))
            .toList();

        BigDecimal overdueAmount = overdueInvoices.stream()
            .map(Invoice::getBalanceDue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        String biz = user.getBusinessName() != null ? user.getBusinessName() : "BillBook";
        StringBuilder msg = new StringBuilder();
        msg.append("🚨 *OVERDUE PAYMENT NOTICE*\n\n");
        msg.append("Dear ").append(customer.getName()).append(",\n\n");
        msg.append("Your payment of *₹").append(fmt(overdueAmount)).append("* is overdue.\n\n");

        if (!overdueInvoices.isEmpty()) {
            msg.append("📋 *Overdue Invoices:*\n");
            for (Invoice inv : overdueInvoices) {
                long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(inv.getDueDate(), today);
                msg.append("• ").append(inv.getInvoiceNumber())
                   .append(" — ₹").append(fmt(inv.getBalanceDue()))
                   .append(" (").append(daysOverdue).append(" days overdue)\n");
            }
            msg.append("\n");
        }

        msg.append("Please make the payment immediately to avoid any inconvenience.\n\n");
        msg.append("Regards,\n");
        msg.append(biz);

        String link = waLink(customer.getPhone(), msg.toString());
        return ResponseEntity.ok(Map.of("whatsappLink", link, "message", msg.toString(), "overdueAmount", overdueAmount, "overdueCount", overdueInvoices.size()));
    }

    // ========== 4. SEND PAYMENT RECEIPT ==========
    @GetMapping("/receipt/{invoiceId}")
    public ResponseEntity<?> sendReceipt(@AuthenticationPrincipal BbUser user, @PathVariable Long invoiceId) {
        Invoice inv = invoiceRepo.findById(invoiceId).orElseThrow(() -> new RuntimeException("Invoice not found"));
        if (!inv.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        String customerName = inv.getCustomer() != null ? inv.getCustomer().getName() : "Customer";
        String phone = inv.getCustomer() != null ? inv.getCustomer().getPhone() : "";

        String biz = user.getBusinessName() != null ? user.getBusinessName() : "BillBook";
        StringBuilder msg = new StringBuilder();
        msg.append("✅ *PAYMENT RECEIPT*\n\n");
        msg.append("Hello ").append(customerName).append(",\n\n");
        msg.append("We have received your payment. Here are the details:\n\n");
        msg.append("📋 Invoice #: ").append(inv.getInvoiceNumber()).append("\n");
        msg.append("💰 Total Amount: ₹").append(fmt(inv.getTotalAmount())).append("\n");
        msg.append("✅ Amount Paid: ₹").append(fmt(inv.getPaidAmount())).append("\n");
        if (inv.getBalanceDue() != null && inv.getBalanceDue().compareTo(BigDecimal.ZERO) > 0)
            msg.append("⏳ Balance Due: ₹").append(fmt(inv.getBalanceDue())).append("\n");
        msg.append("💳 Payment Mode: ").append(inv.getPaymentMode()).append("\n");
        msg.append("📅 Date: ").append(inv.getInvoiceDate()).append("\n\n");
        msg.append("Thank you for your payment! 🙏\n");
        msg.append("— ").append(biz);

        String link = waLink(phone, msg.toString());
        return ResponseEntity.ok(Map.of("whatsappLink", link, "message", msg.toString()));
    }

    // ========== 5. SEND VENDOR PURCHASE ORDER ==========
    @GetMapping("/purchase/{purchaseId}")
    public ResponseEntity<?> sendPurchaseOrder(@AuthenticationPrincipal BbUser user, @PathVariable Long purchaseId) {
        Purchase pur = purchaseRepo.findById(purchaseId).orElseThrow(() -> new RuntimeException("Purchase not found"));
        if (!pur.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        String vendorName = pur.getVendor() != null ? pur.getVendor().getName() : "Vendor";
        String phone = pur.getVendor() != null ? pur.getVendor().getPhone() : "";

        String biz = user.getBusinessName() != null ? user.getBusinessName() : "BillBook";
        StringBuilder msg = new StringBuilder();
        msg.append("📦 *PURCHASE ORDER from ").append(biz).append("*\n\n");
        msg.append("Hello ").append(vendorName).append(",\n\n");
        msg.append("📋 PO #: ").append(pur.getPurchaseNumber()).append("\n");
        msg.append("📅 Date: ").append(pur.getPurchaseDate()).append("\n\n");

        if (pur.getItems() != null && !pur.getItems().isEmpty()) {
            msg.append("━━━━━━━━━━━━━━━━━━━━━\n");
            msg.append("*ITEMS:*\n\n");
            int sl = 1;
            for (PurchaseItem item : pur.getItems()) {
                msg.append(sl++).append(". ").append(item.getProductName());
                msg.append(" × ").append(item.getQuantity());
                msg.append(" = ₹").append(fmt(item.getTotalPrice())).append("\n");
            }
            msg.append("━━━━━━━━━━━━━━━━━━━━━\n\n");
        }

        msg.append("💰 Total: ₹").append(fmt(pur.getTotalAmount())).append("\n");
        if (pur.getPaidAmount() != null && pur.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            msg.append("✅ Paid: ₹").append(fmt(pur.getPaidAmount())).append("\n");
            msg.append("⏳ Balance: ₹").append(fmt(pur.getBalanceDue())).append("\n");
        }
        msg.append("\nPlease process the order at the earliest.\n\n");
        msg.append("Regards,\n");
        msg.append(biz);

        String link = waLink(phone, msg.toString());
        return ResponseEntity.ok(Map.of("whatsappLink", link, "message", msg.toString()));
    }

    // ========== 6. SEND VENDOR PAYMENT REMINDER ==========
    @GetMapping("/vendor-reminder/{vendorId}")
    public ResponseEntity<?> sendVendorReminder(@AuthenticationPrincipal BbUser user, @PathVariable Long vendorId) {
        Vendor vendor = vendorRepo.findById(vendorId).orElseThrow(() -> new RuntimeException("Vendor not found"));
        if (!vendor.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        String biz = user.getBusinessName() != null ? user.getBusinessName() : "BillBook";
        StringBuilder msg = new StringBuilder();
        msg.append("💰 *PAYMENT UPDATE*\n\n");
        msg.append("Hello ").append(vendor.getName()).append(",\n\n");
        msg.append("Our current payable balance is *₹").append(fmt(vendor.getBalanceDue())).append("*.\n\n");

        if (vendor.getUpiId() != null && !vendor.getUpiId().isEmpty())
            msg.append("📱 UPI ID: ").append(vendor.getUpiId()).append("\n\n");

        msg.append("We will process the payment soon.\n\n");
        msg.append("Regards,\n");
        msg.append(biz);

        String link = waLink(vendor.getPhone(), msg.toString());
        return ResponseEntity.ok(Map.of("whatsappLink", link, "message", msg.toString(), "payable", vendor.getBalanceDue()));
    }

    // ========== 7. SEND KHATA / UDHAAR REMINDER ==========
    @GetMapping("/khata-reminder/{customerId}")
    public ResponseEntity<?> sendKhataReminder(@AuthenticationPrincipal BbUser user, @PathVariable Long customerId) {
        Customer customer = customerRepo.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
        if (!customer.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        List<KhataEntry.EntryType> creditTypes = List.of(KhataEntry.EntryType.CREDIT_GIVEN, KhataEntry.EntryType.DEBIT_RECEIVED);
        List<KhataEntry.EntryType> paymentTypes = List.of(KhataEntry.EntryType.PAYMENT_RECEIVED);
        BigDecimal outstanding = khataEntryRepo.sumPendingByPartyAndTypes(user.getId(), customerId, creditTypes)
            .subtract(khataEntryRepo.sumPendingByPartyAndTypes(user.getId(), customerId, paymentTypes));

        // Get overdue entries
        List<KhataEntry> overdueEntries = khataEntryRepo.findByUserIdAndDueDateBeforeAndStatusNot(
            user.getId(), LocalDate.now(), KhataEntry.EntryStatus.SETTLED)
            .stream().filter(e -> e.getParty().getId().equals(customerId)).toList();

        String biz = user.getBusinessName() != null ? user.getBusinessName() : "BillBook";
        StringBuilder msg = new StringBuilder();
        msg.append("📒 *UDHAAR / KHATA REMINDER*\n\n");
        msg.append("Hello ").append(customer.getName()).append(",\n\n");
        msg.append("Your outstanding balance is *₹").append(fmt(outstanding)).append("*.\n\n");

        if (!overdueEntries.isEmpty()) {
            msg.append("🚨 *Overdue Entries:*\n");
            for (KhataEntry e : overdueEntries) {
                msg.append("• ₹").append(fmt(e.getAmount()));
                if (e.getDueDate() != null) {
                    long days = java.time.temporal.ChronoUnit.DAYS.between(e.getDueDate(), LocalDate.now());
                    msg.append(" (").append(days).append(" days overdue)");
                }
                msg.append("\n");
            }
            msg.append("\n");
        }

        msg.append("Please clear your dues at the earliest.\n\n");
        msg.append("Thank you! 🙏\n");
        msg.append("— ").append(biz);

        String link = waLink(customer.getPhone(), msg.toString());

        // Mark reminder sent
        for (KhataEntry e : overdueEntries) {
            e.setReminderSent(true);
            khataEntryRepo.save(e);
        }

        return ResponseEntity.ok(Map.of("whatsappLink", link, "message", msg.toString(), "outstanding", outstanding, "overdueCount", overdueEntries.size()));
    }

    // ========== 8. SEND CUSTOM MESSAGE ==========
    @PostMapping("/custom")
    public ResponseEntity<?> sendCustomMessage(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String message = body.get("message");

        if (phone == null || phone.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number required"));
        }
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message required"));
        }

        // Add business signature
        String signature = "\n\n— " + (user.getBusinessName() != null ? user.getBusinessName() : "BillBook");
        String fullMessage = message + signature;

        String link = waLink(phone, fullMessage);
        return ResponseEntity.ok(Map.of("whatsappLink", link, "message", fullMessage));
    }

    // ========== 9. BULK REMINDERS - ALL OVERDUE ==========
    @GetMapping("/bulk-overdue")
    public ResponseEntity<?> bulkOverdueReminders(@AuthenticationPrincipal BbUser user) {
        Long uid = user.getId();
        LocalDate today = LocalDate.now();

        List<Invoice> overdueInvoices = invoiceRepo.findByUserIdAndDueDateBeforeAndPaymentStatusNot(
            uid, today, Invoice.PaymentStatus.PAID);

        // Group by customer
        Map<Long, List<Invoice>> byCustomer = new LinkedHashMap<>();
        for (Invoice inv : overdueInvoices) {
            if (inv.getCustomer() != null) {
                byCustomer.computeIfAbsent(inv.getCustomer().getId(), k -> new ArrayList<>()).add(inv);
            }
        }

        List<Map<String, Object>> reminders = new ArrayList<>();
        for (Map.Entry<Long, List<Invoice>> entry : byCustomer.entrySet()) {
            Customer customer = customerRepo.findById(entry.getKey()).orElse(null);
            if (customer == null || customer.getPhone() == null || customer.getPhone().isEmpty()) continue;

            BigDecimal totalOverdue = entry.getValue().stream()
                .map(Invoice::getBalanceDue).reduce(BigDecimal.ZERO, BigDecimal::add);

            String biz = user.getBusinessName() != null ? user.getBusinessName() : "BillBook";
            StringBuilder msg = new StringBuilder();
            msg.append("🚨 *OVERDUE PAYMENT NOTICE*\n\n");
            msg.append("Dear ").append(customer.getName()).append(",\n\n");
            msg.append("Your payment of *₹").append(fmt(totalOverdue)).append("* is overdue.\n\n");
            msg.append("📋 Overdue Invoices:\n");
            for (Invoice inv : entry.getValue().subList(0, Math.min(5, entry.getValue().size()))) {
                msg.append("• ").append(inv.getInvoiceNumber()).append(" — ₹").append(fmt(inv.getBalanceDue())).append("\n");
            }
            msg.append("\nPlease clear at the earliest.\n\n");
            msg.append("— ").append(biz);

            String link = waLink(customer.getPhone(), msg.toString());
            Map<String, Object> reminder = new LinkedHashMap<>();
            reminder.put("customerId", customer.getId());
            reminder.put("customerName", customer.getName());
            reminder.put("phone", customer.getPhone());
            reminder.put("overdueAmount", totalOverdue);
            reminder.put("invoiceCount", entry.getValue().size());
            reminder.put("whatsappLink", link);
            reminders.add(reminder);
        }

        return ResponseEntity.ok(Map.of("reminders", reminders, "totalCustomers", reminders.size()));
    }

    // ========== 10. SEND PRODUCT CATALOG ==========
    @GetMapping("/catalog/{customerId}")
    public ResponseEntity<?> sendCatalog(@AuthenticationPrincipal BbUser user, @PathVariable Long customerId) {
        Customer customer = customerRepo.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
        if (!customer.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        List<BbProduct> products = productRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(user.getId());

        String biz = user.getBusinessName() != null ? user.getBusinessName() : "BillBook";
        StringBuilder msg = new StringBuilder();
        msg.append("📦 *PRODUCT CATALOG — ").append(biz).append("*\n\n");
        msg.append("Hello ").append(customer.getName()).append(",\n\n");
        msg.append("Here are our latest products:\n\n");
        msg.append("━━━━━━━━━━━━━━━━━━━━━\n");

        int count = 0;
        for (BbProduct p : products) {
            if (count >= 20) { msg.append("... and more products available\n"); break; }
            msg.append("• ").append(p.getName());
            if (p.getCategory() != null) msg.append(" (").append(p.getCategory()).append(")");
            msg.append("\n  💰 ₹").append(p.getSellingPrice() != null ? fmt(p.getSellingPrice()) : "N/A");
            if (p.getUnit() != null) msg.append(" / ").append(p.getUnit());
            msg.append("\n\n");
            count++;
        }

        msg.append("━━━━━━━━━━━━━━━━━━━━━\n\n");
        msg.append("To place an order, reply to this message or call us.\n\n");
        msg.append("Thank you! 🙏\n");
        msg.append("— ").append(biz);

        String link = waLink(customer.getPhone(), msg.toString());
        return ResponseEntity.ok(Map.of("whatsappLink", link, "message", msg.toString(), "productCount", products.size()));
    }
}
