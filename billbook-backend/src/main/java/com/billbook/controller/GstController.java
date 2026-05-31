package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api/bb/gst") @RequiredArgsConstructor
public class GstController {
    private final InvoiceRepository invoiceRepo;
    private final PurchaseRepository purchaseRepo;
    private final CustomerRepository customerRepo;
    private final ExpenseRepository expenseRepo;

    // ========== GST DASHBOARD ==========
    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@AuthenticationPrincipal BbUser user) {
        Long uid = user.getId();
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        // Current month GST
        Map<String, Object> currentMonth = getGstSummary(uid, monthStart, monthEnd);

        // Previous month GST
        YearMonth prevYm = YearMonth.from(today).minusMonths(1);
        LocalDate prevStart = prevYm.atDay(1);
        LocalDate prevEnd = prevYm.atEndOfMonth();
        Map<String, Object> prevMonth = getGstSummary(uid, prevStart, prevEnd);

        // Quarterly
        YearMonth qStart = YearMonth.from(today).minusMonths(2);
        LocalDate quarterStart = qStart.atDay(1);
        Map<String, Object> quarterly = getGstSummary(uid, quarterStart, monthEnd);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("currentMonth", currentMonth);
        result.put("previousMonth", prevMonth);
        result.put("quarterly", quarterly);
        result.put("currentPeriod", Map.of("from", monthStart, "to", monthEnd));
        result.put("previousPeriod", Map.of("from", prevStart, "to", prevEnd));
        return result;
    }

    // ========== GSTR-1 (Outward Supplies) ==========
    @GetMapping("/gstr1")
    public Map<String, Object> gstr1(@AuthenticationPrincipal BbUser user,
                                      @RequestParam String from, @RequestParam String to) {
        Long uid = user.getId();
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);

        List<Invoice> invoices = invoiceRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(i -> i.getIsGst() != null && i.getIsGst())
            .filter(i -> !i.getInvoiceDate().isBefore(fromDate) && !i.getInvoiceDate().isAfter(toDate))
            .collect(Collectors.toList());

        // B2B Invoices (with GSTIN)
        List<Map<String, Object>> b2b = invoices.stream()
            .filter(i -> i.getCustomer() != null && i.getCustomer().getGstin() != null && !i.getCustomer().getGstin().isEmpty())
            .map(i -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("invoiceNumber", i.getInvoiceNumber());
                m.put("invoiceDate", i.getInvoiceDate());
                m.put("customerName", i.getCustomer().getName());
                m.put("customerGstin", i.getCustomer().getGstin());
                m.put("taxableValue", i.getSubtotal().subtract(i.getDiscountAmount()));
                m.put("cgst", i.getCgstAmount());
                m.put("sgst", i.getSgstAmount());
                m.put("igst", i.getIgstAmount());
                m.put("totalTax", i.getTotalTax());
                m.put("totalAmount", i.getTotalAmount());
                m.put("invoiceType", i.getIgstAmount().compareTo(BigDecimal.ZERO) > 0 ? "Inter-State" : "Intra-State");
                return m;
            }).collect(Collectors.toList());

        // B2C Invoices (without GSTIN)
        List<Map<String, Object>> b2c = invoices.stream()
            .filter(i -> i.getCustomer() == null || i.getCustomer().getGstin() == null || i.getCustomer().getGstin().isEmpty())
            .map(i -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("invoiceNumber", i.getInvoiceNumber());
                m.put("invoiceDate", i.getInvoiceDate());
                m.put("customerName", i.getCustomer() != null ? i.getCustomer().getName() : "Walk-in Customer");
                m.put("taxableValue", i.getSubtotal().subtract(i.getDiscountAmount()));
                m.put("cgst", i.getCgstAmount());
                m.put("sgst", i.getSgstAmount());
                m.put("igst", i.getIgstAmount());
                m.put("totalTax", i.getTotalTax());
                m.put("totalAmount", i.getTotalAmount());
                return m;
            }).collect(Collectors.toList());

        // HSN/SAC Summary
        List<Map<String, Object>> hsnSummary = getHsnSummary(invoices);

        // Rate-wise summary
        List<Map<String, Object>> rateWise = getRateWiseSummary(invoices);

        // Totals
        BigDecimal totalTaxable = invoices.stream().map(i -> i.getSubtotal().subtract(i.getDiscountAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCgst = invoices.stream().map(Invoice::getCgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSgst = invoices.stream().map(Invoice::getSgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIgst = invoices.stream().map(Invoice::getIgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTax = invoices.stream().map(Invoice::getTotalTax).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAmount = invoices.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period", Map.of("from", fromDate, "to", toDate));
        result.put("summary", Map.of(
            "totalInvoices", invoices.size(),
            "b2bCount", b2b.size(),
            "b2cCount", b2c.size(),
            "totalTaxable", totalTaxable,
            "totalCgst", totalCgst,
            "totalSgst", totalSgst,
            "totalIgst", totalIgst,
            "totalTax", totalTax,
            "totalAmount", totalAmount
        ));
        result.put("b2bInvoices", b2b);
        result.put("b2cInvoices", b2c);
        result.put("hsnSummary", hsnSummary);
        result.put("rateWiseSummary", rateWise);
        return result;
    }

    // ========== GSTR-3B (Summary Return) ==========
    @GetMapping("/gstr3b")
    public Map<String, Object> gstr3b(@AuthenticationPrincipal BbUser user,
                                       @RequestParam String from, @RequestParam String to) {
        Long uid = user.getId();
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);

        // Outward Supplies (Sales)
        List<Invoice> invoices = invoiceRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(i -> i.getIsGst() != null && i.getIsGst())
            .filter(i -> !i.getInvoiceDate().isBefore(fromDate) && !i.getInvoiceDate().isAfter(toDate))
            .collect(Collectors.toList());

        // Inward Supplies (Purchases)
        List<Purchase> purchases = purchaseRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(p -> p.getIsGst() != null && p.getIsGst())
            .filter(p -> !p.getPurchaseDate().isBefore(fromDate) && !p.getPurchaseDate().isAfter(toDate))
            .collect(Collectors.toList());

        // Sales GST
        BigDecimal salesTaxable = invoices.stream().map(i -> i.getSubtotal().subtract(i.getDiscountAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salesCgst = invoices.stream().map(Invoice::getCgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salesSgst = invoices.stream().map(Invoice::getSgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salesIgst = invoices.stream().map(Invoice::getIgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salesTotalTax = invoices.stream().map(Invoice::getTotalTax).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Purchase GST (ITC)
        BigDecimal purchaseTaxable = purchases.stream().map(p -> p.getSubtotal().subtract(p.getDiscountAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purchaseCgst = purchases.stream().map(Purchase::getCgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purchaseSgst = purchases.stream().map(Purchase::getSgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purchaseIgst = purchases.stream().map(Purchase::getIgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purchaseTotalTax = purchases.stream().map(Purchase::getTotalTax).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Net GST Payable
        BigDecimal netCgst = salesCgst.subtract(purchaseCgst).max(BigDecimal.ZERO);
        BigDecimal netSgst = salesSgst.subtract(purchaseSgst).max(BigDecimal.ZERO);
        BigDecimal netIgst = salesIgst.subtract(purchaseIgst).max(BigDecimal.ZERO);
        BigDecimal totalGstPayable = netCgst.add(netSgst).add(netIgst);

        // ITC Available
        BigDecimal itcCgst = purchaseCgst;
        BigDecimal itcSgst = purchaseSgst;
        BigDecimal itcIgst = purchaseIgst;
        BigDecimal totalItc = itcCgst.add(itcSgst).add(itcIgst);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period", Map.of("from", fromDate, "to", toDate));

        // Table 3.1 - Outward Supplies
        result.put("outwardSupplies", Map.of(
            "taxableValue", salesTaxable,
            "cgst", salesCgst,
            "sgst", salesSgst,
            "igst", salesIgst,
            "totalTax", salesTotalTax,
            "invoiceCount", invoices.size()
        ));

        // Table 4 - Eligible ITC
        result.put("inputTaxCredit", Map.of(
            "taxableValue", purchaseTaxable,
            "cgst", itcCgst,
            "sgst", itcSgst,
            "igst", itcIgst,
            "totalItc", totalItc,
            "purchaseCount", purchases.size()
        ));

        // Table 5 - Exempt and Nil Rated
        List<Invoice> nonGstInvoices = invoiceRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(i -> i.getIsGst() == null || !i.getIsGst())
            .filter(i -> !i.getInvoiceDate().isBefore(fromDate) && !i.getInvoiceDate().isAfter(toDate))
            .collect(Collectors.toList());
        BigDecimal nilRated = nonGstInvoices.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        result.put("exemptSupplies", Map.of(
            "nilRated", nilRated,
            "exempt", BigDecimal.ZERO,
            "nonGst", BigDecimal.ZERO,
            "invoiceCount", nonGstInvoices.size()
        ));

        // Net GST Payable
        result.put("netGstPayable", Map.of(
            "cgst", netCgst,
            "sgst", netSgst,
            "igst", netIgst,
            "totalPayable", totalGstPayable
        ));

        // Interest/Late fee if applicable
        result.put("lateFee", BigDecimal.ZERO);
        result.put("interest", BigDecimal.ZERO);

        return result;
    }

    // ========== HSN/SAC SUMMARY ==========
    @GetMapping("/hsn-summary")
    public Map<String, Object> hsnSummary(@AuthenticationPrincipal BbUser user,
                                           @RequestParam String from, @RequestParam String to) {
        Long uid = user.getId();
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);

        List<Invoice> invoices = invoiceRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(i -> i.getIsGst() != null && i.getIsGst())
            .filter(i -> !i.getInvoiceDate().isBefore(fromDate) && !i.getInvoiceDate().isAfter(toDate))
            .collect(Collectors.toList());

        List<Map<String, Object>> hsnList = getHsnSummary(invoices);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period", Map.of("from", fromDate, "to", toDate));
        result.put("hsnSummary", hsnList);
        result.put("totalHsnCodes", hsnList.size());
        return result;
    }

    // ========== PURCHASE REGISTER (ITC) ==========
    @GetMapping("/purchase-register")
    public Map<String, Object> purchaseRegister(@AuthenticationPrincipal BbUser user,
                                                 @RequestParam String from, @RequestParam String to) {
        Long uid = user.getId();
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);

        List<Purchase> purchases = purchaseRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(p -> p.getIsGst() != null && p.getIsGst())
            .filter(p -> !p.getPurchaseDate().isBefore(fromDate) && !p.getPurchaseDate().isAfter(toDate))
            .collect(Collectors.toList());

        List<Map<String, Object>> purchaseList = purchases.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("purchaseNumber", p.getPurchaseNumber());
            m.put("purchaseDate", p.getPurchaseDate());
            m.put("vendorName", p.getVendor() != null ? p.getVendor().getName() : "");
            m.put("vendorGstin", p.getVendor() != null ? p.getVendor().getGstin() : "");
            m.put("taxableValue", p.getSubtotal().subtract(p.getDiscountAmount()));
            m.put("cgst", p.getCgstAmount());
            m.put("sgst", p.getSgstAmount());
            m.put("igst", p.getIgstAmount());
            m.put("totalTax", p.getTotalTax());
            m.put("totalAmount", p.getTotalAmount());
            m.put("itcEligible", true);
            return m;
        }).collect(Collectors.toList());

        BigDecimal totalTaxable = purchases.stream().map(p -> p.getSubtotal().subtract(p.getDiscountAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCgst = purchases.stream().map(Purchase::getCgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSgst = purchases.stream().map(Purchase::getSgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIgst = purchases.stream().map(Purchase::getIgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTax = purchases.stream().map(Purchase::getTotalTax).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period", Map.of("from", fromDate, "to", toDate));
        result.put("summary", Map.of(
            "totalPurchases", purchases.size(),
            "totalTaxable", totalTaxable,
            "totalCgst", totalCgst,
            "totalSgst", totalSgst,
            "totalIgst", totalIgst,
            "totalTax", totalTax,
            "totalItcAvailable", totalTax
        ));
        result.put("purchases", purchaseList);
        return result;
    }

    // ========== MONTHLY GST COMPARISON ==========
    @GetMapping("/monthly-comparison")
    public List<Map<String, Object>> monthlyComparison(@AuthenticationPrincipal BbUser user,
                                                        @RequestParam int year) {
        Long uid = user.getId();
        List<Map<String, Object>> monthly = new ArrayList<>();

        for (int m = 1; m <= 12; m++) {
            YearMonth ym = YearMonth.of(year, m);
            LocalDate mStart = ym.atDay(1);
            LocalDate mEnd = ym.atEndOfMonth();

            Map<String, Object> monthData = getGstSummary(uid, mStart, mEnd);
            monthData.put("month", ym.getMonth().toString().substring(0, 3));
            monthData.put("year", year);
            monthData.put("monthNum", m);
            monthly.add(monthData);
        }
        return monthly;
    }

    // ========== HELPER: GST Summary ==========
    private Map<String, Object> getGstSummary(Long uid, LocalDate from, LocalDate to) {
        List<Invoice> invoices = invoiceRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(i -> i.getIsGst() != null && i.getIsGst())
            .filter(i -> !i.getInvoiceDate().isBefore(from) && !i.getInvoiceDate().isAfter(to))
            .collect(Collectors.toList());

        List<Purchase> purchases = purchaseRepo.findByUserIdOrderByCreatedAtDesc(uid).stream()
            .filter(p -> p.getIsGst() != null && p.getIsGst())
            .filter(p -> !p.getPurchaseDate().isBefore(from) && !p.getPurchaseDate().isAfter(to))
            .collect(Collectors.toList());

        BigDecimal salesTax = invoices.stream().map(Invoice::getTotalTax).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purchaseTax = purchases.stream().map(Purchase::getTotalTax).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salesCgst = invoices.stream().map(Invoice::getCgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salesSgst = invoices.stream().map(Invoice::getSgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salesIgst = invoices.stream().map(Invoice::getIgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purchaseCgst = purchases.stream().map(Purchase::getCgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purchaseSgst = purchases.stream().map(Purchase::getSgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purchaseIgst = purchases.stream().map(Purchase::getIgstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netPayable = salesTax.subtract(purchaseTax).max(BigDecimal.ZERO);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("salesGst", salesTax);
        result.put("purchaseGst", purchaseTax);
        result.put("netPayable", netPayable);
        result.put("salesCgst", salesCgst);
        result.put("salesSgst", salesSgst);
        result.put("salesIgst", salesIgst);
        result.put("purchaseCgst", purchaseCgst);
        result.put("purchaseSgst", purchaseSgst);
        result.put("purchaseIgst", purchaseIgst);
        result.put("invoiceCount", invoices.size());
        result.put("purchaseCount", purchases.size());
        return result;
    }

    // ========== HELPER: HSN Summary ==========
    private List<Map<String, Object>> getHsnSummary(List<Invoice> invoices) {
        Map<String, Map<String, Object>> hsnMap = new LinkedHashMap<>();

        for (Invoice inv : invoices) {
            if (inv.getItems() != null) {
                for (InvoiceItem item : inv.getItems()) {
                    String hsn = item.getHsnCode() != null ? item.getHsnCode() : "9999";
                    BigDecimal taxable = item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO;
                    BigDecimal taxRate = item.getGstRate() != null ? item.getGstRate() : BigDecimal.ZERO;

                    if (!hsnMap.containsKey(hsn)) {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("hsnCode", hsn);
                        m.put("description", item.getProductName() != null ? item.getProductName() : "");
                        m.put("uom", item.getUnit() != null ? item.getUnit() : "NOS");
                        m.put("totalQuantity", BigDecimal.ZERO);
                        m.put("totalTaxable", BigDecimal.ZERO);
                        m.put("totalCgst", BigDecimal.ZERO);
                        m.put("totalSgst", BigDecimal.ZERO);
                        m.put("totalIgst", BigDecimal.ZERO);
                        m.put("totalTax", BigDecimal.ZERO);
                        m.put("taxRate", taxRate);
                        hsnMap.put(hsn, m);
                    }

                    Map<String, Object> existing = hsnMap.get(hsn);
                    existing.put("totalQuantity", ((BigDecimal) existing.get("totalQuantity")).add(item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO));
                    existing.put("totalTaxable", ((BigDecimal) existing.get("totalTaxable")).add(taxable));
                    BigDecimal itemCgst = taxable.multiply(taxRate).divide(BigDecimal.valueOf(200), 2, RoundingMode.HALF_UP);
                    BigDecimal itemSgst = taxable.multiply(taxRate).divide(BigDecimal.valueOf(200), 2, RoundingMode.HALF_UP);
                    existing.put("totalCgst", ((BigDecimal) existing.get("totalCgst")).add(itemCgst));
                    existing.put("totalSgst", ((BigDecimal) existing.get("totalSgst")).add(itemSgst));
                    existing.put("totalTax", ((BigDecimal) existing.get("totalTax")).add(itemCgst.add(itemSgst)));
                }
            }
        }

        return new ArrayList<>(hsnMap.values());
    }

    // ========== HELPER: Rate-wise Summary ==========
    private List<Map<String, Object>> getRateWiseSummary(List<Invoice> invoices) {
        Map<BigDecimal, Map<String, Object>> rateMap = new LinkedHashMap<>();

        for (Invoice inv : invoices) {
            if (inv.getItems() != null) {
                for (InvoiceItem item : inv.getItems()) {
                    BigDecimal rate = item.getGstRate() != null ? item.getGstRate() : BigDecimal.ZERO;
                    BigDecimal taxable = item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO;

                    if (!rateMap.containsKey(rate)) {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("gstRate", rate);
                        m.put("taxableValue", BigDecimal.ZERO);
                        m.put("cgst", BigDecimal.ZERO);
                        m.put("sgst", BigDecimal.ZERO);
                        m.put("igst", BigDecimal.ZERO);
                        m.put("totalTax", BigDecimal.ZERO);
                        rateMap.put(rate, m);
                    }

                    Map<String, Object> existing = rateMap.get(rate);
                    existing.put("taxableValue", ((BigDecimal) existing.get("taxableValue")).add(taxable));
                    BigDecimal taxAmount = taxable.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    existing.put("cgst", ((BigDecimal) existing.get("cgst")).add(taxAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP)));
                    existing.put("sgst", ((BigDecimal) existing.get("sgst")).add(taxAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP)));
                    existing.put("totalTax", ((BigDecimal) existing.get("totalTax")).add(taxAmount));
                }
            }
        }

        return rateMap.values().stream()
            .sorted((a, b) -> ((BigDecimal) a.get("gstRate")).compareTo((BigDecimal) b.get("gstRate")))
            .collect(Collectors.toList());
    }
}
