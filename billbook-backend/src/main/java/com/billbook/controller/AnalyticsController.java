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

@RestController @RequestMapping("/api/bb/analytics") @RequiredArgsConstructor
public class AnalyticsController {
    private final InvoiceRepository invoiceRepo;
    private final PurchaseRepository purchaseRepo;
    private final CustomerRepository customerRepo;
    private final VendorRepository vendorRepo;
    private final BbProductRepository productRepo;
    private final PaymentRepository paymentRepo;

    @GetMapping
    public Map<String, Object> getAnalytics(@AuthenticationPrincipal BbUser user,
                                             @RequestParam(defaultValue = "6") int months) {
        Long uid = user.getId();
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusMonths(months);

        // 1. Monthly Sales & Purchases Trend
        List<Map<String, Object>> salesTrend = new ArrayList<>();
        List<Map<String, Object>> purchaseTrend = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = YearMonth.from(today.minusMonths(i));
            LocalDate mStart = ym.atDay(1);
            LocalDate mEnd = ym.atEndOfMonth();
            String label = ym.getMonth().toString().substring(0, 3) + " " + ym.getYear();

            BigDecimal sales = invoiceRepo.totalSalesBetween(uid, mStart, mEnd);
            BigDecimal purchases = purchaseRepo.totalPurchasesBetween(uid, mStart, mEnd);

            Map<String, Object> sPoint = new LinkedHashMap<>();
            sPoint.put("name", label);
            sPoint.put("value", sales);
            salesTrend.add(sPoint);

            Map<String, Object> pPoint = new LinkedHashMap<>();
            pPoint.put("name", label);
            pPoint.put("value", purchases);
            purchaseTrend.add(pPoint);
        }

        // 2. Payment Status Distribution (Pie)
        List<Invoice> allInvoices = invoiceRepo.findByUserIdOrderByCreatedAtDesc(uid);
        long paidCount = allInvoices.stream().filter(i -> i.getPaymentStatus() == Invoice.PaymentStatus.PAID).count();
        long unpaidCount = allInvoices.stream().filter(i -> i.getPaymentStatus() == Invoice.PaymentStatus.UNPAID).count();
        long partialCount = allInvoices.stream().filter(i -> i.getPaymentStatus() == Invoice.PaymentStatus.PARTIAL).count();
        long overdueCount = allInvoices.stream().filter(i -> i.getPaymentStatus() == Invoice.PaymentStatus.OVERDUE).count();

        List<Map<String, Object>> invoiceStatusPie = new ArrayList<>();
        invoiceStatusPie.add(pieEntry("Paid", paidCount, "#10B981"));
        invoiceStatusPie.add(pieEntry("Unpaid", unpaidCount, "#EF4444"));
        invoiceStatusPie.add(pieEntry("Partial", partialCount, "#F59E0B"));
        invoiceStatusPie.add(pieEntry("Overdue", overdueCount, "#8B5CF6"));

        // 3. Purchase Payment Status Distribution (Pie)
        List<Purchase> allPurchases = purchaseRepo.findByUserIdOrderByCreatedAtDesc(uid);
        long purPaidCount = allPurchases.stream().filter(p -> p.getPaymentStatus() == Purchase.PaymentStatus.PAID).count();
        long purUnpaidCount = allPurchases.stream().filter(p -> p.getPaymentStatus() == Purchase.PaymentStatus.UNPAID).count();
        long purPartialCount = allPurchases.stream().filter(p -> p.getPaymentStatus() == Purchase.PaymentStatus.PARTIAL).count();

        List<Map<String, Object>> purchaseStatusPie = new ArrayList<>();
        purchaseStatusPie.add(pieEntry("Paid", purPaidCount, "#10B981"));
        purchaseStatusPie.add(pieEntry("Unpaid", purUnpaidCount, "#EF4444"));
        purchaseStatusPie.add(pieEntry("Partial", purPartialCount, "#F59E0B"));

        // 4. Payment Mode Distribution (Pie)
        Map<String, Long> paymentModeMap = allInvoices.stream()
            .filter(i -> i.getPaymentMode() != null)
            .collect(Collectors.groupingBy(i -> i.getPaymentMode().name(), Collectors.counting()));

        String[] modeColors = {"#6C3CE1", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"};
        List<Map<String, Object>> paymentModePie = new ArrayList<>();
        int ci = 0;
        for (Map.Entry<String, Long> entry : paymentModeMap.entrySet()) {
            invoiceStatusPie.size(); // just to use
            paymentModePie.add(pieEntry(entry.getKey(), entry.getValue(), modeColors[ci % modeColors.length]));
            ci++;
        }

        // 5. Top 5 Customers by Purchase Amount
        Map<String, BigDecimal> customerSales = new LinkedHashMap<>();
        for (Invoice inv : allInvoices) {
            String cName = inv.getCustomer() != null ? inv.getCustomer().getName() : "Unknown";
            customerSales.merge(cName, inv.getTotalAmount(), BigDecimal::add);
        }
        List<Map<String, Object>> topCustomers = customerSales.entrySet().stream()
            .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
            .limit(5)
            .map(e -> { Map<String, Object> m = new LinkedHashMap<>(); m.put("name", e.getKey()); m.put("value", e.getValue()); return m; })
            .collect(Collectors.toList());

        // 6. Top 5 Vendors by Purchase Amount
        Map<String, BigDecimal> vendorPurchases = new LinkedHashMap<>();
        for (Purchase pur : allPurchases) {
            String vName = pur.getVendor() != null ? pur.getVendor().getName() : "Unknown";
            vendorPurchases.merge(vName, pur.getTotalAmount(), BigDecimal::add);
        }
        List<Map<String, Object>> topVendors = vendorPurchases.entrySet().stream()
            .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
            .limit(5)
            .map(e -> { Map<String, Object> m = new LinkedHashMap<>(); m.put("name", e.getKey()); m.put("value", e.getValue()); return m; })
            .collect(Collectors.toList());

        // 7. Low Stock Products
        List<BbProduct> lowStockProducts = productRepo.findByUserIdAndStockQuantityLessThanEqualAndIsActiveTrue(uid, BigDecimal.valueOf(5));

        // 8. Top Selling Products
        Map<String, BigDecimal> productSales = new LinkedHashMap<>();
        for (Invoice inv : allInvoices) {
            if (inv.getItems() != null) {
                for (InvoiceItem item : inv.getItems()) {
                    productSales.merge(item.getProductName(), item.getTotalPrice(), BigDecimal::add);
                }
            }
        }
        List<Map<String, Object>> topProducts = productSales.entrySet().stream()
            .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
            .limit(5)
            .map(e -> { Map<String, Object> m = new LinkedHashMap<>(); m.put("name", e.getKey()); m.put("value", e.getValue()); return m; })
            .collect(Collectors.toList());

        // 9. Summary Stats
        BigDecimal totalSales = allInvoices.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPurchases = allPurchases.stream().map(Purchase::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalReceived = allInvoices.stream().map(Invoice::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaidToVendors = allPurchases.stream().map(Purchase::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal outstanding = invoiceRepo.totalOutstanding(uid);
        BigDecimal payable = purchaseRepo.totalPayable(uid);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalSales", totalSales);
        summary.put("totalPurchases", totalPurchases);
        summary.put("totalReceived", totalReceived);
        summary.put("totalPaidToVendors", totalPaidToVendors);
        summary.put("outstanding", outstanding);
        summary.put("payable", payable);
        summary.put("totalCustomers", customerRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(uid).size());
        summary.put("totalVendors", vendorRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(uid).size());
        summary.put("totalProducts", productRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(uid).size());
        summary.put("totalInvoices", allInvoices.size());
        summary.put("totalPurchasesCount", allPurchases.size());
        summary.put("profit", totalSales.subtract(totalPurchases));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("salesTrend", salesTrend);
        result.put("purchaseTrend", purchaseTrend);
        result.put("invoiceStatusPie", invoiceStatusPie);
        result.put("purchaseStatusPie", purchaseStatusPie);
        result.put("paymentModePie", paymentModePie);
        result.put("topCustomers", topCustomers);
        result.put("topVendors", topVendors);
        result.put("topProducts", topProducts);
        result.put("lowStockProducts", lowStockProducts);
        result.put("summary", summary);
        return result;
    }

    private Map<String, Object> pieEntry(String name, long value, String color) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("value", value);
        m.put("color", color);
        return m;
    }
}
