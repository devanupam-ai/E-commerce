package com.billbook.controller;

import com.billbook.model.BbUser;
import com.billbook.model.Invoice;
import com.billbook.repository.CustomerRepository;
import com.billbook.repository.InvoiceRepository;
import com.billbook.repository.BbProductRepository;
import com.billbook.repository.VendorRepository;
import com.billbook.repository.PurchaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController @RequestMapping("/api/bb/dashboard") @RequiredArgsConstructor
public class DashboardController {
    private final InvoiceRepository invoiceRepo;
    private final CustomerRepository customerRepo;
    private final BbProductRepository productRepo;
    private final VendorRepository vendorRepo;
    private final PurchaseRepository purchaseRepo;

    @GetMapping
    public Map<String, Object> stats(@AuthenticationPrincipal BbUser user) {
        Long uid = user.getId();
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        BigDecimal todaySales = invoiceRepo.totalSalesBetween(uid, today, today);
        BigDecimal monthSales = invoiceRepo.totalSalesBetween(uid, monthStart, today);
        BigDecimal outstanding = invoiceRepo.totalOutstanding(uid);
        long totalCustomers = customerRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(uid).size();
        long totalProducts = productRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(uid).size();
        long unpaidInvoices = invoiceRepo.findByUserIdAndPaymentStatusOrderByCreatedAtDesc(uid, Invoice.PaymentStatus.UNPAID).size()
                            + invoiceRepo.findByUserIdAndPaymentStatusOrderByCreatedAtDesc(uid, Invoice.PaymentStatus.PARTIAL).size();
        long lowStockCount = productRepo.findByUserIdAndStockQuantityLessThanEqualAndIsActiveTrue(uid, BigDecimal.valueOf(5)).size();
        var recentInvoices = invoiceRepo.findByUserIdOrderByCreatedAtDesc(uid).stream().limit(5).toList();

        // Overdue invoices
        var overdueInvoices = invoiceRepo.findByUserIdAndDueDateBeforeAndPaymentStatusNot(uid, today, Invoice.PaymentStatus.PAID);

        // Vendor & Purchase stats
        long totalVendors = vendorRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(uid).size();
        BigDecimal monthPurchases = purchaseRepo.totalPurchasesBetween(uid, monthStart, today);
        BigDecimal totalPayable = purchaseRepo.totalPayable(uid);

        // Low stock items
        var lowStockItems = productRepo.findByUserIdAndStockQuantityLessThanEqualAndIsActiveTrue(uid, BigDecimal.valueOf(5));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("todaySales", todaySales);
        result.put("monthSales", monthSales);
        result.put("outstanding", outstanding);
        result.put("totalCustomers", totalCustomers);
        result.put("totalProducts", totalProducts);
        result.put("unpaidInvoices", unpaidInvoices);
        result.put("lowStockCount", lowStockCount);
        result.put("lowStockItems", lowStockItems);
        result.put("overdueInvoices", overdueInvoices);
        result.put("recentInvoices", recentInvoices);
        result.put("totalVendors", totalVendors);
        result.put("monthPurchases", monthPurchases);
        result.put("totalPayable", totalPayable);
        return result;
    }
}
