package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api/bb/reports") @RequiredArgsConstructor
public class ReportsController {
    private final InvoiceRepository invoiceRepo;
    private final PurchaseRepository purchaseRepo;
    private final ExpenseRepository expenseRepo;
    private final PaymentRepository paymentRepo;
    private final CustomerRepository customerRepo;
    private final VendorRepository vendorRepo;
    private final VendorPaymentRepository vendorPaymentRepo;

    @GetMapping("/profit-loss")
    public Map<String, Object> profitLoss(@AuthenticationPrincipal BbUser user,
                                           @RequestParam String from, @RequestParam String to) {
        Long uid = user.getId();
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);

        BigDecimal totalSales = invoiceRepo.totalSalesBetween(uid, fromDate, toDate);
        BigDecimal totalPurchases = purchaseRepo.totalPurchasesBetween(uid, fromDate, toDate);
        BigDecimal totalExpenses = expenseRepo.totalExpensesBetween(uid, fromDate, toDate);
        BigDecimal grossProfit = totalSales.subtract(totalPurchases);
        BigDecimal netProfit = grossProfit.subtract(totalExpenses);

        // Monthly breakdown
        List<Map<String, Object>> monthly = new ArrayList<>();
        YearMonth start = YearMonth.from(fromDate);
        YearMonth end = YearMonth.of(toDate.getYear(), toDate.getMonth());
        for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
            LocalDate mStart = ym.atDay(1);
            LocalDate mEnd = ym.atEndOfMonth();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", ym.getMonth().toString().substring(0, 3) + " " + ym.getYear());
            m.put("sales", invoiceRepo.totalSalesBetween(uid, mStart, mEnd));
            m.put("purchases", purchaseRepo.totalPurchasesBetween(uid, mStart, mEnd));
            m.put("expenses", expenseRepo.totalExpensesBetween(uid, mStart, mEnd));
            BigDecimal ms = (BigDecimal) m.get("sales");
            BigDecimal mp = (BigDecimal) m.get("purchases");
            BigDecimal me = (BigDecimal) m.get("expenses");
            m.put("grossProfit", ms.subtract(mp));
            m.put("netProfit", ms.subtract(mp).subtract(me));
            monthly.add(m);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalSales", totalSales);
        result.put("totalPurchases", totalPurchases);
        result.put("grossProfit", grossProfit);
        result.put("totalExpenses", totalExpenses);
        result.put("netProfit", netProfit);
        result.put("monthly", monthly);
        return result;
    }

    @GetMapping("/gst")
    public Map<String, Object> gstReport(@AuthenticationPrincipal BbUser user,
                                          @RequestParam String from, @RequestParam String to) {
        Long uid = user.getId();
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);

        List<Invoice> invoices = invoiceRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(i -> !i.getInvoiceDate().isBefore(fromDate) && !i.getInvoiceDate().isAfter(toDate))
            .collect(Collectors.toList());

        List<Purchase> purchases = purchaseRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(p -> !p.getPurchaseDate().isBefore(fromDate) && !p.getPurchaseDate().isAfter(toDate))
            .collect(Collectors.toList());

        // Sales GST summary
        BigDecimal totalCgst = invoices.stream().map(Invoice::getCgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSgst = invoices.stream().map(Invoice::getSgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIgst = invoices.stream().map(Invoice::getIgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSalesTax = invoices.stream().map(Invoice::getTotalTax).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTaxableSales = invoices.stream().map(i -> i.getSubtotal().subtract(i.getDiscountAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Purchase GST summary
        BigDecimal totalPurchaseCgst = purchases.stream().map(Purchase::getCgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPurchaseSgst = purchases.stream().map(Purchase::getSgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPurchaseIgst = purchases.stream().map(Purchase::getIgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPurchaseTax = purchases.stream().map(Purchase::getTotalTax).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTaxablePurchases = purchases.stream().map(p -> p.getSubtotal().subtract(p.getDiscountAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Invoice-wise GST details
        List<Map<String, Object>> invoiceGst = invoices.stream().filter(i -> i.getIsGst() != null && i.getIsGst()).map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("invoiceNumber", i.getInvoiceNumber());
            m.put("date", i.getInvoiceDate());
            m.put("customerName", i.getCustomer() != null ? i.getCustomer().getName() : "");
            m.put("customerGstin", i.getCustomer() != null ? i.getCustomer().getGstin() : "");
            m.put("taxableValue", i.getSubtotal().subtract(i.getDiscountAmount()));
            m.put("cgst", i.getCgstAmount());
            m.put("sgst", i.getSgstAmount());
            m.put("igst", i.getIgstAmount());
            m.put("totalTax", i.getTotalTax());
            m.put("totalAmount", i.getTotalAmount());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("salesGst", Map.of(
            "totalTaxable", totalTaxableSales,
            "cgst", totalCgst,
            "sgst", totalSgst,
            "igst", totalIgst,
            "totalTax", totalSalesTax
        ));
        result.put("purchaseGst", Map.of(
            "totalTaxable", totalTaxablePurchases,
            "cgst", totalPurchaseCgst,
            "sgst", totalPurchaseSgst,
            "igst", totalPurchaseIgst,
            "totalTax", totalPurchaseTax
        ));
        result.put("netPayable", totalSalesTax.subtract(totalPurchaseTax));
        result.put("invoiceGstDetails", invoiceGst);
        return result;
    }

    @GetMapping("/party-ledger")
    public Map<String, Object> partyLedger(@AuthenticationPrincipal BbUser user,
                                            @RequestParam String type, @RequestParam Long partyId) {
        Long uid = user.getId();
        List<Map<String, Object>> transactions = new ArrayList<>();

        if ("customer".equals(type)) {
            Customer customer = customerRepo.findById(partyId).orElseThrow();
            // Invoices (debit)
            invoiceRepo.findByUserIdAndCustomerIdOrderByCreatedAtDesc(uid, partyId).forEach(inv -> {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("date", inv.getInvoiceDate());
                t.put("particular", "Invoice " + inv.getInvoiceNumber());
                t.put("type", "SALE");
                t.put("debit", inv.getTotalAmount());
                t.put("credit", BigDecimal.ZERO);
                transactions.add(t);
            });
            // Payments (credit)
            paymentRepo.findByUserIdAndCustomerIdOrderByPaymentDateDesc(uid, partyId).forEach(pay -> {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("date", pay.getPaymentDate());
                t.put("particular", "Payment received - " + pay.getPaymentMode());
                t.put("type", "PAYMENT");
                t.put("debit", BigDecimal.ZERO);
                t.put("credit", pay.getAmount());
                transactions.add(t);
            });
        } else {
            // Vendor ledger
            purchaseRepo.findByUserIdAndVendorIdOrderByCreatedAtDesc(uid, partyId).forEach(pur -> {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("date", pur.getPurchaseDate());
                t.put("particular", "Purchase " + pur.getPurchaseNumber());
                t.put("type", "PURCHASE");
                t.put("debit", BigDecimal.ZERO);
                t.put("credit", pur.getTotalAmount());
                transactions.add(t);
            });
            vendorPaymentRepo.findByUserIdAndVendorIdOrderByPaymentDateDesc(uid, partyId).forEach(vp -> {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("date", vp.getPaymentDate());
                t.put("particular", "Payment made - " + vp.getPaymentMode());
                t.put("type", "PAYMENT");
                t.put("debit", vp.getAmount());
                t.put("credit", BigDecimal.ZERO);
                transactions.add(t);
            });
        }

        // Sort by date and calculate running balance
        transactions.sort((a, b) -> ((Comparable) a.get("date")).compareTo(b.get("date")));
        BigDecimal balance = BigDecimal.ZERO;
        for (Map<String, Object> t : transactions) {
            BigDecimal debit = (BigDecimal) t.get("debit");
            BigDecimal credit = (BigDecimal) t.get("credit");
            if ("customer".equals(type)) {
                balance = balance.add(debit).subtract(credit);
            } else {
                balance = balance.add(credit).subtract(debit);
            }
            t.put("balance", balance);
        }

        return Map.of("transactions", transactions, "closingBalance", balance);
    }

    @GetMapping("/day-book")
    public Map<String, Object> dayBook(@AuthenticationPrincipal BbUser user, @RequestParam String date) {
        Long uid = user.getId();
        LocalDate d = LocalDate.parse(date);

        List<Invoice> dayInvoices = invoiceRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(i -> i.getInvoiceDate().equals(d)).collect(Collectors.toList());
        List<Purchase> dayPurchases = purchaseRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(p -> p.getPurchaseDate().equals(d)).collect(Collectors.toList());
        List<Payment> dayPayments = paymentRepo.findByUserIdOrderByPaymentDateDesc(uid).stream()
            .filter(p -> p.getPaymentDate().equals(d)).collect(Collectors.toList());
        List<Expense> dayExpenses = expenseRepo.findByUserIdAndExpenseDateBetweenOrderByExpenseDateDesc(uid, d, d);

        BigDecimal totalSales = dayInvoices.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPurchases = dayPurchases.stream().map(Purchase::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalReceived = dayPayments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpenses = dayExpenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "invoices", dayInvoices,
            "purchases", dayPurchases,
            "payments", dayPayments,
            "expenses", dayExpenses,
            "totalSales", totalSales,
            "totalPurchases", totalPurchases,
            "totalReceived", totalReceived,
            "totalExpenses", totalExpenses
        );
    }
}
