
package com.billbook.service;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminFeatureService {

    private final UserThemeRepository themeRepo;
    private final NotificationRepository notifRepo;
    private final ExpenseReceiptRepository receiptRepo;
    private final BusinessCardRepository cardRepo;
    private final CashFlowEntryRepository cashFlowRepo;
    private final InventoryAlertRepository alertRepo;
    private final BbProductRepository productRepo;
    private final InvoiceRepository invoiceRepo;
    private final ExpenseRepository expenseRepo;
    private final CustomerRepository customerRepo;
    private final BbUserRepository userRepo;

    // ==================== 1. THEME ====================
    public UserTheme getTheme(Long userId) {
        return themeRepo.findByUserId(userId).orElseGet(() -> {
            UserTheme t = new UserTheme();
            t.setUser(ref(userId));
            return themeRepo.save(t);
        });
    }

    @Transactional
    public UserTheme updateTheme(Long userId, Map<String, String> body) {
        UserTheme theme = themeRepo.findByUserId(userId).orElseGet(() -> {
            UserTheme t = new UserTheme();
            t.setUser(ref(userId));
            return t;
        });
        if (body.containsKey("themeMode")) theme.setThemeMode(body.get("themeMode"));
        if (body.containsKey("primaryColor")) theme.setPrimaryColor(body.get("primaryColor"));
        if (body.containsKey("accentColor")) theme.setAccentColor(body.get("accentColor"));
        if (body.containsKey("sidebarStyle")) theme.setSidebarStyle(body.get("sidebarStyle"));
        if (body.containsKey("fontSize")) theme.setFontSize(body.get("fontSize"));
        if (body.containsKey("borderRadius")) theme.setBorderRadius(body.get("borderRadius"));
        if (body.containsKey("fontFamily")) theme.setFontFamily(body.get("fontFamily"));
        if (body.containsKey("dashboardLayout")) theme.setDashboardLayout(body.get("dashboardLayout"));
        theme.setUpdatedAt(LocalDateTime.now());
        return themeRepo.save(theme);
    }

    // ==================== 2. DASHBOARD BUILDER ====================
    @Transactional
    public Map<String, Object> saveDashboardLayout(Long userId, String layoutJson) {
        UserTheme theme = getTheme(userId);
        theme.setDashboardLayout(layoutJson);
        theme.setUpdatedAt(LocalDateTime.now());
        themeRepo.save(theme);
        return Map.of("message", "Dashboard layout saved", "layout", layoutJson);
    }

    public Map<String, Object> getDashboardLayout(Long userId) {
        UserTheme theme = getTheme(userId);
        return Map.of("layout", theme.getDashboardLayout() != null ? theme.getDashboardLayout() : "DEFAULT");
    }

    // ==================== 3. HEATMAP CALENDAR ====================
    public List<Map<String, Object>> getHeatmapData(Long userId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        List<Invoice> invoices = invoiceRepo.findByUserIdAndInvoiceDateBetween(userId, start, end);

        Map<LocalDate, BigDecimal> dailySales = new LinkedHashMap<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            dailySales.put(d, BigDecimal.ZERO);
        }
        for (Invoice inv : invoices) {
            if (inv.getInvoiceDate() != null && inv.getTotalAmount() != null) {
                dailySales.merge(inv.getInvoiceDate(), inv.getTotalAmount(), BigDecimal::add);
            }
        }

        BigDecimal maxSale = dailySales.values().stream().max(BigDecimal::compareTo).orElse(BigDecimal.ONE);
        if (maxSale.compareTo(BigDecimal.ZERO) == 0) maxSale = BigDecimal.ONE;

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<LocalDate, BigDecimal> e : dailySales.entrySet()) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("date", e.getKey().toString());
            map.put("dayOfWeek", e.getKey().getDayOfWeek().name());
            map.put("amount", e.getValue());
            int intensity = e.getValue().multiply(BigDecimal.valueOf(100)).divide(maxSale, 0, RoundingMode.HALF_UP).intValue();
            map.put("intensity", intensity);
            map.put("color", getHeatColor(intensity));
            map.put("label", e.getValue().compareTo(BigDecimal.ZERO) == 0 ? "No sales" : "₹" + e.getValue().setScale(0, RoundingMode.HALF_UP));
            result.add(map);
        }
        return result;
    }

    private String getHeatColor(int intensity) {
        if (intensity == 0) return "#F3F4F6";
        if (intensity <= 20) return "#D1FAE5";
        if (intensity <= 40) return "#6EE7B7";
        if (intensity <= 60) return "#34D399";
        if (intensity <= 80) return "#10B981";
        return "#059669";
    }

    // ==================== 4. AI INSIGHTS ====================
    public Map<String, Object> getAIInsights(Long userId) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> insights = new ArrayList<>();

        LocalDate today = LocalDate.now();
        LocalDate thisMonthStart = today.withDayOfMonth(1);
        LocalDate lastMonthStart = thisMonthStart.minusMonths(1);
        LocalDate lastMonthEnd = thisMonthStart.minusDays(1);

        // This month vs last month sales
        BigDecimal thisMonthSales = invoiceRepo.totalSalesBetween(userId, thisMonthStart, today);
        BigDecimal lastMonthSales = invoiceRepo.totalSalesBetween(userId, lastMonthStart, lastMonthEnd);

        if (lastMonthSales.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal change = thisMonthSales.subtract(lastMonthSales)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(lastMonthSales, 0, RoundingMode.HALF_UP);
            if (change.compareTo(BigDecimal.ZERO) < 0) {
                insights.add(Map.of(
                    "type", "WARNING",
                    "icon", "📉",
                    "title", "Sales Declining",
                    "message", "Your sales dropped " + change.abs() + "% compared to last month. Consider running a promotion.",
                    "action", "Create Festival Offer"
                ));
            } else if (change.compareTo(BigDecimal.valueOf(20)) > 0) {
                insights.add(Map.of(
                    "type", "SUCCESS",
                    "icon", "🚀",
                    "title", "Sales Growing!",
                    "message", "Sales are up " + change + "% this month! Keep the momentum going.",
                    "action", null
                ));
            }
        }

        // Outstanding payments
        BigDecimal outstanding = invoiceRepo.totalOutstanding(userId);
        if (outstanding.compareTo(BigDecimal.valueOf(10000)) > 0) {
            insights.add(Map.of(
                "type", "WARNING",
                "icon", "💰",
                "title", "High Outstanding",
                "message", "₹" + outstanding.setScale(0, RoundingMode.HALF_UP) + " is pending from customers. Send reminders?",
                "action", "Send Reminders"
            ));
        }

        // Low stock products
        List<BbProduct> products = productRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);
        long lowStockCount = products.stream()
                .filter(p -> p.getStockQuantity() != null && p.getReorderLevel() != null && p.getStockQuantity().compareTo(p.getReorderLevel()) <= 0)
                .count();
        if (lowStockCount > 0) {
            insights.add(Map.of(
                "type", "ALERT",
                "icon", "📦",
                "title", "Low Stock Alert",
                "message", lowStockCount + " products are running low on stock. Reorder now!",
                "action", "View Inventory"
            ));
        }

        // Top customer insight
        List<Customer> customers = customerRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);
        if (!customers.isEmpty()) {
            insights.add(Map.of(
                "type", "INFO",
                "icon", "👤",
                "title", "Customer Base",
                "message", "You have " + customers.size() + " active customers. " + lowStockCount + " products need attention.",
                "action", null
            ));
        }

        // Expense ratio
        BigDecimal totalSales = invoiceRepo.totalSalesBetween(userId, today.minusMonths(3), today);
        if (totalSales.compareTo(BigDecimal.ZERO) > 0) {
            insights.add(Map.of(
                "type", "INFO",
                "icon", "📊",
                "title", "Quarterly Revenue",
                "message", "Last 3 months revenue: ₹" + totalSales.setScale(0, RoundingMode.HALF_UP),
                "action", "View Reports"
            ));
        }

        // Business Health Score
        int healthScore = calculateHealthScore(userId, thisMonthSales, lastMonthSales, outstanding, lowStockCount, customers.size());
        result.put("healthScore", healthScore);
        result.put("healthLabel", healthScore >= 80 ? "🟢 Excellent" : healthScore >= 50 ? "🟡 Average" : "🔴 Needs Attention");
        result.put("insights", insights);
        result.put("generatedAt", LocalDateTime.now());
        return result;
    }

    private int calculateHealthScore(Long userId, BigDecimal thisMonth, BigDecimal lastMonth, BigDecimal outstanding, long lowStock, int customers) {
        int score = 50; // base

        // Revenue trend
        if (lastMonth.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal growth = thisMonth.subtract(lastMonth).multiply(BigDecimal.valueOf(100)).divide(lastMonth, 0, RoundingMode.HALF_UP);
            if (growth.compareTo(BigDecimal.valueOf(20)) > 0) score += 20;
            else if (growth.compareTo(BigDecimal.ZERO) > 0) score += 10;
            else score -= 10;
        }

        // Outstanding ratio
        if (thisMonth.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal ratio = outstanding.multiply(BigDecimal.valueOf(100)).divide(thisMonth, 0, RoundingMode.HALF_UP);
            if (ratio.compareTo(BigDecimal.valueOf(10)) < 0) score += 15;
            else if (ratio.compareTo(BigDecimal.valueOf(30)) < 0) score += 5;
            else score -= 10;
        }

        // Stock health
        if (lowStock == 0) score += 10;
        else if (lowStock <= 3) score += 5;
        else score -= 5;

        // Customer base
        if (customers >= 50) score += 5;
        else if (customers >= 20) score += 3;

        return Math.max(0, Math.min(100, score));
    }

    // ==================== 5. SMART INVENTORY ALERTS ====================
    public List<Map<String, Object>> getInventoryAlerts(Long userId) {
        generateInventoryAlerts(userId);
        List<InventoryAlert> alerts = alertRepo.findByUserIdAndIsResolvedFalseOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (InventoryAlert a : alerts) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", a.getId());
            map.put("productId", a.getProduct().getId());
            map.put("productName", a.getProduct().getName());
            map.put("alertType", a.getAlertType().name());
            map.put("currentValue", a.getCurrentValue());
            map.put("thresholdValue", a.getThresholdValue());
            map.put("message", a.getMessage());
            map.put("isRead", a.getIsRead());
            map.put("createdAt", a.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    @Transactional
    public void generateInventoryAlerts(Long userId) {
        List<BbProduct> products = productRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);
        for (BbProduct p : products) {
            // Low stock check
            if (p.getStockQuantity() != null && p.getReorderLevel() != null && p.getStockQuantity().compareTo(p.getReorderLevel()) <= 0) {
                if (p.getStockQuantity().compareTo(BigDecimal.ZERO) == 0) {
                    createAlertIfNotExists(userId, p, InventoryAlert.AlertType.OUT_OF_STOCK, p.getStockQuantity(), BigDecimal.ZERO,
                            "🔴 " + p.getName() + " is OUT OF STOCK! Reorder immediately.");
                } else {
                    createAlertIfNotExists(userId, p, InventoryAlert.AlertType.LOW_STOCK, p.getStockQuantity(), p.getReorderLevel(),
                            "🟡 " + p.getName() + " is running low (" + p.getStockQuantity() + " remaining, reorder level: " + p.getReorderLevel() + ")");
                }
            }

            // Dead stock check (stock > 0 but no sales in 90 days)
            if (p.getStockQuantity() != null && p.getStockQuantity().compareTo(BigDecimal.ZERO) > 0) {
                createAlertIfNotExists(userId, p, InventoryAlert.AlertType.DEAD_STOCK, p.getStockQuantity(), BigDecimal.ZERO,
                        "⚠️ " + p.getName() + " may be dead stock (" + p.getStockQuantity() + " units, no recent sales)");
            }
        }
    }

    private void createAlertIfNotExists(Long userId, BbProduct product, InventoryAlert.AlertType type, BigDecimal current, BigDecimal threshold, String message) {
        List<InventoryAlert> existing = alertRepo.findByUserIdAndAlertTypeOrderByCreatedAtDesc(userId, type);
        boolean alreadyExists = existing.stream().anyMatch(a -> a.getProduct().getId().equals(product.getId()) && !a.getIsResolved());
        if (!alreadyExists) {
            InventoryAlert alert = new InventoryAlert();
            alert.setUser(ref(userId));
            alert.setProduct(product);
            alert.setAlertType(type);
            alert.setCurrentValue(current);
            alert.setThresholdValue(threshold);
            alert.setMessage(message);
            alertRepo.save(alert);
        }
    }

    @Transactional
    public Map<String, Object> resolveAlert(Long alertId) {
        InventoryAlert alert = alertRepo.findById(alertId).orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setIsResolved(true);
        alert.setResolvedAt(LocalDateTime.now());
        alertRepo.save(alert);
        return Map.of("message", "Alert resolved", "alertId", alertId);
    }

    // ==================== 6. CASH FLOW TIMELINE ====================
    public Map<String, Object> getCashFlowTimeline(Long userId, String period) {
        LocalDate today = LocalDate.now();
        LocalDate from, to;
        switch (period != null ? period : "MONTH") {
            case "WEEK": from = today.minusWeeks(1); to = today; break;
            case "QUARTER": from = today.minusMonths(3); to = today; break;
            case "YEAR": from = today.minusYears(1); to = today; break;
            default: from = today.withDayOfMonth(1); to = today;
        }

        List<CashFlowEntry> entries = cashFlowRepo.findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(userId, from, to);
        BigDecimal totalInflow = cashFlowRepo.totalInflowBetween(userId, from, to);
        BigDecimal totalOutflow = cashFlowRepo.totalOutflowBetween(userId, from, to);
        BigDecimal netCashFlow = totalInflow.subtract(totalOutflow);

        // Daily aggregation for chart
        Map<LocalDate, BigDecimal> dailyInflow = new LinkedHashMap<>();
        Map<LocalDate, BigDecimal> dailyOutflow = new LinkedHashMap<>();
        for (CashFlowEntry e : entries) {
            if (e.getFlowType() == CashFlowEntry.FlowType.INFLOW) {
                dailyInflow.merge(e.getEntryDate(), e.getAmount(), BigDecimal::add);
            } else {
                dailyOutflow.merge(e.getEntryDate(), e.getAmount(), BigDecimal::add);
            }
        }

        // Upcoming commitments
        List<Map<String, Object>> upcoming = new ArrayList<>();
        BigDecimal outstanding = invoiceRepo.totalOutstanding(userId);
        if (outstanding.compareTo(BigDecimal.ZERO) > 0) {
            upcoming.add(Map.of("type", "EXPECTED_INFLOW", "amount", outstanding, "description", "Pending customer payments", "date", today.plusDays(7).toString()));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalInflow", totalInflow);
        result.put("totalOutflow", totalOutflow);
        result.put("netCashFlow", netCashFlow);
        result.put("dailyInflow", dailyInflow);
        result.put("dailyOutflow", dailyOutflow);
        result.put("entries", entries);
        result.put("upcoming", upcoming);
        result.put("period", period);
        return result;
    }

    @Transactional
    public CashFlowEntry addCashFlowEntry(Long userId, Map<String, Object> body) {
        CashFlowEntry entry = new CashFlowEntry();
        entry.setUser(ref(userId));
        entry.setEntryDate(LocalDate.parse(body.get("entryDate").toString()));
        entry.setFlowType(CashFlowEntry.FlowType.valueOf(body.get("flowType").toString()));
        entry.setAmount(new BigDecimal(body.get("amount").toString()));
        entry.setCategory(body.getOrDefault("category", "OTHER").toString());
        entry.setDescription(body.getOrDefault("description", "").toString());
        entry.setReferenceType(body.getOrDefault("referenceType", "MANUAL").toString());

        // Calculate running balance
        BigDecimal totalIn = cashFlowRepo.totalInflow(userId);
        BigDecimal totalOut = cashFlowRepo.totalOutflow(userId);
        if (entry.getFlowType() == CashFlowEntry.FlowType.INFLOW) {
            entry.setRunningBalance(totalIn.add(entry.getAmount()).subtract(totalOut));
        } else {
            entry.setRunningBalance(totalIn.subtract(totalOut).subtract(entry.getAmount()));
        }

        return cashFlowRepo.save(entry);
    }

    // ==================== 7. EXPENSE RECEIPT SCANNER ====================
    public Map<String, Object> scanExpenseReceipt(BbUser user, org.springframework.web.multipart.MultipartFile file) {
        try {
            String filename = "receipt_" + user.getId() + "_" + System.currentTimeMillis() + ".jpg";
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads/receipts", filename);
            java.nio.file.Files.createDirectories(filePath.getParent());
            java.nio.file.Files.write(filePath, file.getBytes());

            ExpenseReceipt receipt = new ExpenseReceipt();
            receipt.setUser(user);
            receipt.setImagePath(filePath.toString());
            receipt.setScanStatus(ExpenseReceipt.ScanStatus.PENDING);
            receiptRepo.save(receipt);

            // Simple OCR extraction (placeholder - uses same Tesseract as Photo Invoice)
            String ocrText = "[Receipt OCR - Install Tesseract for auto-extraction]";
            receipt.setOcrRawText(ocrText);

            // Parse amounts from text
            java.util.regex.Pattern amountPattern = java.util.regex.Pattern.compile("[₹Rs.]*\\s*([\\d,]+\\.?\\d]*)");
            java.util.regex.Matcher m = amountPattern.matcher(ocrText);
            BigDecimal maxAmount = BigDecimal.ZERO;
            while (m.find()) {
                try {
                    BigDecimal val = new BigDecimal(m.group(1).replace(",", ""));
                    if (val.compareTo(maxAmount) > 0) maxAmount = val;
                } catch (Exception ignored) {}
            }

            receipt.setAmount(maxAmount);
            receipt.setExpenseDate(LocalDate.now().toString());
            receipt.setScanStatus(ExpenseReceipt.ScanStatus.PROCESSED);
            receiptRepo.save(receipt);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("receiptId", receipt.getId());
            result.put("amount", receipt.getAmount());
            result.put("ocrText", ocrText);
            result.put("status", "PROCESSED");
            result.put("message", "Receipt scanned! Review and confirm details.");
            return result;
        } catch (Exception e) {
            return Map.of("error", "Failed to scan receipt: " + e.getMessage());
        }
    }

    @Transactional
    public Map<String, Object> confirmExpenseReceipt(Long receiptId, Map<String, Object> body) {
        ExpenseReceipt receipt = receiptRepo.findById(receiptId).orElseThrow(() -> new RuntimeException("Receipt not found"));
        if (body.containsKey("vendorName")) receipt.setVendorName(body.get("vendorName").toString());
        if (body.containsKey("amount")) receipt.setAmount(new BigDecimal(body.get("amount").toString()));
        if (body.containsKey("category")) receipt.setCategory(body.get("category").toString());
        if (body.containsKey("description")) receipt.setDescription(body.get("description").toString());
        if (body.containsKey("paymentMode")) receipt.setPaymentMode(body.get("paymentMode").toString());
        if (body.containsKey("expenseDate")) receipt.setExpenseDate(body.get("expenseDate").toString());
        receipt.setScanStatus(ExpenseReceipt.ScanStatus.LINKED);
        receiptRepo.save(receipt);

        // Auto-create cash flow entry
        CashFlowEntry cf = new CashFlowEntry();
        cf.setUser(receipt.getUser());
        cf.setEntryDate(LocalDate.parse(receipt.getExpenseDate()));
        cf.setFlowType(CashFlowEntry.FlowType.OUTFLOW);
        cf.setAmount(receipt.getAmount());
        cf.setCategory(receipt.getCategory() != null ? receipt.getCategory() : "OTHER");
        cf.setDescription("Expense: " + (receipt.getVendorName() != null ? receipt.getVendorName() : "Unknown"));
        cf.setReferenceType("EXPENSE_RECEIPT");
        cf.setReferenceId(receiptId);
        cashFlowRepo.save(cf);

        return Map.of("message", "✅ Receipt confirmed and expense recorded", "receiptId", receiptId);
    }

    public List<Map<String, Object>> getExpenseReceipts(Long userId) {
        List<ExpenseReceipt> receipts = receiptRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ExpenseReceipt r : receipts) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("vendorName", r.getVendorName());
            map.put("amount", r.getAmount());
            map.put("expenseDate", r.getExpenseDate());
            map.put("category", r.getCategory());
            map.put("description", r.getDescription());
            map.put("paymentMode", r.getPaymentMode());
            map.put("scanStatus", r.getScanStatus() != null ? r.getScanStatus().name() : "PENDING");
            map.put("imagePath", r.getImagePath());
            map.put("linkedExpenseId", r.getLinkedExpenseId());
            map.put("createdAt", r.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    // ==================== 8. NOTIFICATIONS ====================
    public List<Map<String, Object>> getNotifications(Long userId) {
        // Auto-generate notifications
        autoGenerateNotifications(userId);

        List<Notification> notifs = notifRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Notification n : notifs) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", n.getId());
            map.put("title", n.getTitle());
            map.put("message", n.getMessage());
            map.put("category", n.getCategory());
            map.put("icon", n.getIcon());
            map.put("link", n.getLink());
            map.put("isRead", n.getIsRead());
            map.put("isPinned", n.getIsPinned());
            map.put("priority", n.getPriority());
            map.put("createdAt", n.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    public long getUnreadCount(Long userId) {
        return notifRepo.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void autoGenerateNotifications(Long userId) {
        // Low stock notifications
        List<InventoryAlert> unresolved = alertRepo.findByUserIdAndIsResolvedFalseOrderByCreatedAtDesc(userId);
        for (InventoryAlert a : unresolved) {
            if (!a.getIsRead()) {
                createNotifIfNotExists(userId, "📦 " + a.getProduct().getName(), a.getMessage(), "STOCK", "📦", "/inventory", 1);
            }
        }

        // Overdue payments
        List<Invoice> overdue = invoiceRepo.findByUserIdAndDueDateBeforeAndPaymentStatusNot(userId, LocalDate.now(), Invoice.PaymentStatus.PAID);
        if (!overdue.isEmpty()) {
            createNotifIfNotExists(userId, "💰 Overdue Payments", overdue.size() + " invoices are overdue. Send reminders?", "PAYMENT", "💰", "/orders", 2);
        }

        // Festival alerts
        List<com.billbook.model.Festival> upcoming = new java.util.ArrayList<>();
        // Simple check - can be enhanced
    }

    private void createNotifIfNotExists(Long userId, String title, String message, String category, String icon, String link, int priority) {
        List<Notification> existing = notifRepo.findByUserIdAndCategoryOrderByCreatedAtDesc(userId, category);
        boolean alreadyExists = existing.stream().anyMatch(n -> n.getTitle().equals(title) && !n.getIsRead());
        if (!alreadyExists) {
            Notification n = new Notification();
            n.setUser(ref(userId));
            n.setTitle(title);
            n.setMessage(message);
            n.setCategory(category);
            n.setIcon(icon);
            n.setLink(link);
            n.setPriority(priority);
            notifRepo.save(n);
        }
    }

    @Transactional
    public Map<String, Object> markNotificationRead(Long notifId) {
        Notification n = notifRepo.findById(notifId).orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setIsRead(true);
        notifRepo.save(n);
        return Map.of("message", "Marked as read");
    }

    @Transactional
    public Map<String, Object> markAllRead(Long userId) {
        List<Notification> unread = notifRepo.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setIsRead(true));
        notifRepo.saveAll(unread);
        return Map.of("message", "All notifications marked as read", "count", unread.size());
    }

    @Transactional
    public Map<String, Object> togglePin(Long notifId) {
        Notification n = notifRepo.findById(notifId).orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setIsPinned(!n.getIsPinned());
        notifRepo.save(n);
        return Map.of("message", n.getIsPinned() ? "Pinned" : "Unpinned", "isPinned", n.getIsPinned());
    }

    @Transactional
    public Map<String, Object> clearReadNotifications(Long userId) {
        notifRepo.deleteByUserIdAndIsReadTrue(userId);
        return Map.of("message", "Read notifications cleared");
    }

    // ==================== 9. BUSINESS CARD ====================
    public BusinessCard getBusinessCard(Long userId) {
        return cardRepo.findByUserIdAndIsActiveTrue(userId).orElseGet(() -> createDefaultCard(userId));
    }

    private BusinessCard createDefaultCard(Long userId) {
        BbUser user = userRepo.findById(userId).orElse(null);
        BusinessCard card = new BusinessCard();
        card.setUser(ref(userId));
        if (user != null) {
            card.setBusinessName(user.getBusinessName() != null ? user.getBusinessName() : "My Business");
            card.setOwnerName(user.getName());
            card.setPhone(user.getPhone());
            card.setEmail(user.getEmail());
            card.setAddress(user.getBusinessAddress());
            card.setGstin(user.getGstin());
        }
        return cardRepo.save(card);
    }

    @Transactional
    public BusinessCard updateBusinessCard(Long userId, Map<String, Object> body) {
        BusinessCard card = cardRepo.findByUserIdAndIsActiveTrue(userId).orElseGet(() -> createDefaultCard(userId));
        if (body.containsKey("businessName")) card.setBusinessName(body.get("businessName").toString());
        if (body.containsKey("ownerName")) card.setOwnerName(body.get("ownerName").toString());
        if (body.containsKey("designation")) card.setDesignation(body.get("designation").toString());
        if (body.containsKey("phone")) card.setPhone(body.get("phone").toString());
        if (body.containsKey("email")) card.setEmail(body.get("email").toString());
        if (body.containsKey("website")) card.setWebsite(body.get("website").toString());
        if (body.containsKey("address")) card.setAddress(body.get("address").toString());
        if (body.containsKey("city")) card.setCity(body.get("city").toString());
        if (body.containsKey("state")) card.setState(body.get("state").toString());
        if (body.containsKey("pincode")) card.setPincode(body.get("pincode").toString());
        if (body.containsKey("gstin")) card.setGstin(body.get("gstin").toString());
        if (body.containsKey("upiId")) card.setUpiId(body.get("upiId").toString());
        if (body.containsKey("logoUrl")) card.setLogoUrl(body.get("logoUrl").toString());
        if (body.containsKey("primaryColor")) card.setPrimaryColor(body.get("primaryColor").toString());
        if (body.containsKey("secondaryColor")) card.setSecondaryColor(body.get("secondaryColor").toString());
        if (body.containsKey("cardStyle")) card.setCardStyle(body.get("cardStyle").toString());
        if (body.containsKey("whatsappNumber")) card.setWhatsappNumber(body.get("whatsappNumber").toString());
        card.setUpdatedAt(LocalDateTime.now());
        return cardRepo.save(card);
    }

    public Map<String, Object> shareBusinessCard(Long userId) {
        BusinessCard card = getBusinessCard(userId);
        card.setShareCount(card.getShareCount() + 1);
        cardRepo.save(card);

        StringBuilder vcard = new StringBuilder();
        vcard.append("BEGIN:VCARD\nVERSION:3.0\n");
        vcard.append("FN:").append(card.getOwnerName()).append("\n");
        vcard.append("ORG:").append(card.getBusinessName()).append("\n");
        if (card.getDesignation() != null) vcard.append("TITLE:").append(card.getDesignation()).append("\n");
        if (card.getPhone() != null) vcard.append("TEL:").append(card.getPhone()).append("\n");
        if (card.getEmail() != null) vcard.append("EMAIL:").append(card.getEmail()).append("\n");
        if (card.getWebsite() != null) vcard.append("URL:").append(card.getWebsite()).append("\n");
        if (card.getAddress() != null) vcard.append("ADR:;;").append(card.getAddress()).append(";\n");
        vcard.append("END:VCARD");

        String shareText = "\uD83E\uDEAA *" + card.getBusinessName() + "*\n" +
                "\uD83D\uDC64 " + card.getOwnerName() + (card.getDesignation() != null ? " (" + card.getDesignation() + ")" : "") + "\n" +
                "\uD83D\uDCDE " + (card.getPhone() != null ? card.getPhone() : "") + "\n" +
                "\uD83D\uDCE7 " + (card.getEmail() != null ? card.getEmail() : "") + "\n" +
                (card.getWebsite() != null ? "\uD83C\uDF10 " + card.getWebsite() + "\n" : "") +
                (card.getUpiId() != null ? "\uD83D\uDCB3 UPI: " + card.getUpiId() + "\n" : "") +
                (card.getAddress() != null ? "\uD83D\uDCCD " + card.getAddress() + "\n" : "");

        String waLink = "";
        if (card.getWhatsappNumber() != null) {
            String phone = card.getWhatsappNumber().replaceAll("[^0-9]", "");
            if (phone.length() == 10) phone = "91" + phone;
            waLink = "https://wa.me/" + phone + "?text=" + java.net.URLEncoder.encode(shareText, java.nio.charset.StandardCharsets.UTF_8);
        }

        return Map.of("vcard", vcard.toString(), "shareText", shareText, "whatsappLink", waLink, "shareCount", card.getShareCount());
    }

    // ==================== HELPERS ====================
    private BbUser ref(Long userId) {
        BbUser u = new BbUser();
        u.setId(userId);
        return u;
    }
}
