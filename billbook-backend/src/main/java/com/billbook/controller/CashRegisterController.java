
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
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/bb/cash-register")
@RequiredArgsConstructor
public class CashRegisterController {

    private final CashRegisterRepository registerRepo;
    private final QuickCashEntryRepository quickEntryRepo;
    private final InvoiceRepository invoiceRepo;
    private final PaymentRepository paymentRepo;
    private final ExpenseRepository expenseRepo;

    // ==================== 1. OPEN DAY ====================
    @PostMapping("/open")
    public ResponseEntity<?> openDay(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        LocalDate today = LocalDate.now();

        // Check if already open
        Optional<CashRegister> existing = registerRepo.findByUserIdAndRegisterDate(user.getId(), today);
        if (existing.isPresent() && existing.get().getStatus() == CashRegister.RegisterStatus.OPEN) {
            return ResponseEntity.badRequest().body(Map.of("error", "Register already open for today"));
        }

        CashRegister reg = new CashRegister();
        reg.setUser(user);
        reg.setRegisterDate(today);
        reg.setStatus(CashRegister.RegisterStatus.OPEN);
        reg.setOpenedAt(LocalDateTime.now());

        // Opening cash
        BigDecimal openingCash = body.containsKey("openingCash") ? new BigDecimal(body.get("openingCash").toString()) : BigDecimal.ZERO;
        reg.setOpeningCash(openingCash);

        // Denominations at opening
        if (body.containsKey("denominations")) {
            Map<String, Object> denoms = (Map<String, Object>) body.get("denominations");
            setDenominations(reg, denoms, false);
        }

        registerRepo.save(reg);
        return ResponseEntity.ok(Map.of("message", "✅ Day opened successfully", "register", registerToMap(reg)));
    }

    // ==================== 2. GET TODAY'S STATUS ====================
    @GetMapping("/today")
    public ResponseEntity<?> getTodayStatus(@AuthenticationPrincipal BbUser user) {
        LocalDate today = LocalDate.now();
        Optional<CashRegister> regOpt = registerRepo.findByUserIdAndRegisterDate(user.getId(), today);

        if (regOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "NOT_OPENED", "message", "Register not opened yet"));
        }

        CashRegister reg = regOpt.get();
        recalculateTotals(reg);

        Map<String, Object> result = registerToMap(reg);

        // Add today's quick entries
        List<QuickCashEntry> entries = quickEntryRepo.findByRegisterIdOrderByEntryTimeDesc(reg.getId());
        result.put("entries", entries.stream().map(this::entryToMap).toList());

        // Short payment alerts
        List<Map<String, Object>> shorts = new ArrayList<>();
        for (QuickCashEntry e : entries) {
            if (e.getShortAmount() != null && e.getShortAmount().compareTo(BigDecimal.ZERO) > 0) {
                shorts.add(entryToMap(e));
            }
        }
        result.put("shortPayments", shorts);
        result.put("totalShortAmount", shorts.stream()
                .map(s -> (BigDecimal) s.get("shortAmount"))
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        return ResponseEntity.ok(result);
    }

    // ==================== 3. QUICK CASH ENTRY (Rush Mode) ====================
    @PostMapping("/quick-entry")
    public ResponseEntity<?> quickEntry(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        LocalDate today = LocalDate.now();
        Optional<CashRegister> regOpt = registerRepo.findByUserIdAndRegisterDate(user.getId(), today);

        if (regOpt.isEmpty() || regOpt.get().getStatus() != CashRegister.RegisterStatus.OPEN) {
            return ResponseEntity.badRequest().body(Map.of("error", "Register not open. Open the day first!"));
        }

        CashRegister reg = regOpt.get();

        QuickCashEntry entry = new QuickCashEntry();
        entry.setUser(user);
        entry.setRegister(reg);
        entry.setEntryTime(LocalDateTime.now());

        // Entry type
        if (body.containsKey("entryType")) {
            entry.setEntryType(QuickCashEntry.EntryType.valueOf(body.get("entryType").toString()));
        }

        // Amount
        if (body.containsKey("amount")) {
            entry.setAmount(new BigDecimal(body.get("amount").toString()));
        }

        // Payment mode
        if (body.containsKey("paymentMode")) {
            entry.setPaymentMode(QuickCashEntry.PaymentMode.valueOf(body.get("paymentMode").toString()));
        }

        // Description
        if (body.containsKey("description")) {
            entry.setDescription(body.get("description").toString());
        }

        // Customer name (for quick sale)
        if (body.containsKey("customerName")) {
            entry.setCustomerName(body.get("customerName").toString());
        }

        // Linked invoice
        if (body.containsKey("linkedInvoiceId")) {
            entry.setLinkedInvoiceId(Long.valueOf(body.get("linkedInvoiceId").toString()));
        }

        // Short payment tracking
        if (body.containsKey("expectedAmount")) {
            BigDecimal expected = new BigDecimal(body.get("expectedAmount").toString());
            entry.setExpectedAmount(expected);
            BigDecimal shortAmt = expected.subtract(entry.getAmount());
            if (shortAmt.compareTo(BigDecimal.ZERO) > 0) {
                entry.setShortAmount(shortAmt);
                if (body.containsKey("shortReason")) {
                    entry.setShortReason(body.get("shortReason").toString());
                }
            }
        }

        quickEntryRepo.save(entry);
        recalculateTotals(reg);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "✅ Entry recorded");
        result.put("entry", entryToMap(entry));

        // Alert if short payment
        if (entry.getShortAmount() != null && entry.getShortAmount().compareTo(BigDecimal.ZERO) > 0) {
            result.put("alert", "⚠️ SHORT PAYMENT! Customer paid ₹" + entry.getAmount() + " instead of ₹" + entry.getExpectedAmount() + ". Short by ₹" + entry.getShortAmount());
        }

        return ResponseEntity.ok(result);
    }

    // ==================== 4. CLOSE DAY ====================
    @PostMapping("/close")
    public ResponseEntity<?> closeDay(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        LocalDate today = LocalDate.now();
        Optional<CashRegister> regOpt = registerRepo.findByUserIdAndRegisterDate(user.getId(), today);

        if (regOpt.isEmpty() || regOpt.get().getStatus() != CashRegister.RegisterStatus.OPEN) {
            return ResponseEntity.badRequest().body(Map.of("error", "No open register found for today"));
        }

        CashRegister reg = regOpt.get();
        recalculateTotals(reg);

        // Actual cash counted
        BigDecimal actualCash = body.containsKey("actualCash") ? new BigDecimal(body.get("actualCash").toString()) : BigDecimal.ZERO;
        reg.setClosingCashActual(actualCash);

        // System calculated cash
        BigDecimal systemCash = reg.getOpeningCash()
                .add(reg.getTotalCashSales())
                .add(reg.getTotalCashReceived())
                .subtract(reg.getTotalCashExpenses())
                .subtract(reg.getTotalCashPaidOut());
        reg.setClosingCashSystem(systemCash);

        // Difference
        reg.setDifference(actualCash.subtract(systemCash));

        // Closing denominations
        if (body.containsKey("denominations")) {
            Map<String, Object> denoms = (Map<String, Object>) body.get("denominations");
            setDenominations(reg, denoms, true);
        }

        if (body.containsKey("notes")) {
            reg.setClosingNotes(body.get("notes").toString());
        }

        reg.setStatus(CashRegister.RegisterStatus.CLOSED);
        reg.setClosedAt(LocalDateTime.now());
        registerRepo.save(reg);

        Map<String, Object> result = registerToMap(reg);

        // Summary
        String verdict;
        if (reg.getDifference().compareTo(BigDecimal.ZERO) == 0) {
            verdict = "✅ PERFECT MATCH! No cash difference today.";
        } else if (reg.getDifference().compareTo(BigDecimal.ZERO) > 0) {
            verdict = "💰 EXCESS CASH: ₹" + reg.getDifference() + " more than expected. Someone may have paid extra or entry was missed.";
        } else {
            verdict = "⚠️ CASH SHORTAGE: ₹" + reg.getDifference().abs() + " less than expected! Check short payments and missed entries.";
        }
        result.put("verdict", verdict);

        return ResponseEntity.ok(result);
    }

    // ==================== 5. HISTORY ====================
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal BbUser user,
                                        @RequestParam(required = false) String from,
                                        @RequestParam(required = false) String to) {
        List<CashRegister> registers;

        if (from != null && to != null) {
            registers = registerRepo.findByUserIdAndRegisterDateBetween(
                    user.getId(), LocalDate.parse(from), LocalDate.parse(to));
        } else {
            registers = registerRepo.findByUserIdOrderByRegisterDateDesc(user.getId());
        }

        List<Map<String, Object>> result = registers.stream().map(r -> {
            Map<String, Object> map = registerToMap(r);
            // Add entries for each register
            List<QuickCashEntry> entries = quickEntryRepo.findByRegisterIdOrderByEntryTimeDesc(r.getId());
            map.put("entries", entries.stream().map(this::entryToMap).toList());
            map.put("entryCount", entries.size());
            return map;
        }).toList();

        // Summary stats
        BigDecimal totalShortage = registers.stream()
                .filter(r -> r.getDifference() != null && r.getDifference().compareTo(BigDecimal.ZERO) < 0)
                .map(r -> r.getDifference().abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExcess = registers.stream()
                .filter(r -> r.getDifference() != null && r.getDifference().compareTo(BigDecimal.ZERO) > 0)
                .map(CashRegister::getDifference)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long daysWithShortage = registers.stream()
                .filter(r -> r.getDifference() != null && r.getDifference().compareTo(BigDecimal.ZERO) < 0)
                .count();

        return ResponseEntity.ok(Map.of(
                "registers", result,
                "totalDays", registers.size(),
                "totalShortage", totalShortage,
                "totalExcess", totalExcess,
                "daysWithShortage", daysWithShortage
        ));
    }

    // ==================== 6. MISMATCH ANALYSIS ====================
    @GetMapping("/mismatch-analysis")
    public ResponseEntity<?> getMismatchAnalysis(@AuthenticationPrincipal BbUser user) {
        List<CashRegister> allRegisters = registerRepo.findByUserIdOrderByRegisterDateDesc(user.getId());

        List<Map<String, Object>> mismatchDays = new ArrayList<>();
        BigDecimal totalLoss = BigDecimal.ZERO;

        for (CashRegister reg : allRegisters) {
            if (reg.getDifference() != null && reg.getDifference().compareTo(BigDecimal.ZERO) != 0) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("date", reg.getRegisterDate());
                map.put("difference", reg.getDifference());
                map.put("systemCash", reg.getClosingCashSystem());
                map.put("actualCash", reg.getClosingCashActual());

                // Get short payments for that day
                List<QuickCashEntry> shorts = quickEntryRepo.findByRegisterIdAndEntryType(reg.getId(), QuickCashEntry.EntryType.SHORT_PAYMENT);
                map.put("shortPayments", shorts.stream().map(this::entryToMap).toList());
                map.put("totalShortFromPayments", shorts.stream()
                        .map(QuickCashEntry::getShortAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

                if (reg.getDifference().compareTo(BigDecimal.ZERO) < 0) {
                    totalLoss = totalLoss.add(reg.getDifference().abs());
                }

                mismatchDays.add(map);
            }
        }

        // Weekly pattern analysis
        Map<String, BigDecimal> dayOfWeekLoss = new LinkedHashMap<>();
        for (Map<String, Object> day : mismatchDays) {
            String dayName = ((LocalDate) day.get("date")).getDayOfWeek().toString();
            BigDecimal diff = (BigDecimal) day.get("difference");
            dayOfWeekLoss.merge(dayName, diff.compareTo(BigDecimal.ZERO) < 0 ? diff.abs() : BigDecimal.ZERO, BigDecimal::add);
        }

        return ResponseEntity.ok(Map.of(
                "mismatchDays", mismatchDays,
                "totalLoss", totalLoss,
                "averageDailyLoss", allRegisters.isEmpty() ? BigDecimal.ZERO : totalLoss.divide(BigDecimal.valueOf(Math.max(1, mismatchDays.size())), 0, java.math.RoundingMode.HALF_UP),
                "dayOfWeekPattern", dayOfWeekLoss,
                "recommendation", totalLoss.compareTo(new BigDecimal("500")) > 0
                        ? "HIGH LOSS! Consider using Quick Cash Entry during rush hours instead of skipping entries."
                        : "Moderate loss. Track every cash transaction to reduce mismatch."
        ));
    }

    // ==================== HELPERS ====================
    private void recalculateTotals(CashRegister reg) {
        LocalDate date = reg.getRegisterDate();
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(LocalTime.MAX);

        // Get all payments for today
        List<QuickCashEntry> entries = quickEntryRepo.findByRegisterIdOrderByEntryTimeDesc(reg.getId());

        BigDecimal cashSales = BigDecimal.ZERO;
        BigDecimal upiSales = BigDecimal.ZERO;
        BigDecimal cardSales = BigDecimal.ZERO;
        BigDecimal bankSales = BigDecimal.ZERO;
        BigDecimal chequeSales = BigDecimal.ZERO;
        BigDecimal creditSales = BigDecimal.ZERO;
        BigDecimal cashExpenses = BigDecimal.ZERO;
        BigDecimal cashReceived = BigDecimal.ZERO;
        BigDecimal cashPaidOut = BigDecimal.ZERO;

        for (QuickCashEntry e : entries) {
            switch (e.getEntryType()) {
                case CASH_SALE -> cashSales = cashSales.add(e.getAmount());
                case UPI_SALE -> upiSales = upiSales.add(e.getAmount());
                case CASH_RECEIVED -> cashReceived = cashReceived.add(e.getAmount());
                case CASH_PAID_OUT -> cashPaidOut = cashPaidOut.add(e.getAmount());
                case EXPENSE -> cashExpenses = cashExpenses.add(e.getAmount());
                case SHORT_PAYMENT -> {} // Already tracked in short amount
                case ADJUSTMENT -> {
                    // Adjustments can be positive or negative
                    if (e.getPaymentMode() == QuickCashEntry.PaymentMode.CASH) {
                        cashSales = cashSales.add(e.getAmount());
                    }
                }
            }
        }

        // Also get invoice payments from system
        List<Invoice> todayInvoices = invoiceRepo.findByUserIdAndInvoiceDateBetween(reg.getUser().getId(), date, date);
        for (Invoice inv : todayInvoices) {
            if (inv.getPaymentMode() != null && inv.getPaidAmount() != null) {
                switch (inv.getPaymentMode()) {
                    case CASH -> cashSales = cashSales.add(inv.getPaidAmount());
                    case UPI -> upiSales = upiSales.add(inv.getPaidAmount());
                    case CARD -> cardSales = cardSales.add(inv.getPaidAmount());
                    case BANK_TRANSFER -> bankSales = bankSales.add(inv.getPaidAmount());
                    case CHEQUE -> chequeSales = chequeSales.add(inv.getPaidAmount());
                    case CREDIT -> creditSales = creditSales.add(inv.getPaidAmount());
                }
            }
        }

        reg.setTotalCashSales(cashSales);
        reg.setTotalUpiSales(upiSales);
        reg.setTotalCardSales(cardSales);
        reg.setTotalBankTransferSales(bankSales);
        reg.setTotalChequeSales(chequeSales);
        reg.setTotalCreditSales(creditSales);
        reg.setTotalCashExpenses(cashExpenses);
        reg.setTotalCashReceived(cashReceived);
        reg.setTotalCashPaidOut(cashPaidOut);
        registerRepo.save(reg);
    }

    private void setDenominations(CashRegister reg, Map<String, Object> denoms, boolean isClosing) {
        if (denoms.containsKey("denom2000")) {
            if (isClosing) reg.setCloseDenom2000(getInt(denoms.get("denom2000")));
            else reg.setDenom2000(getInt(denoms.get("denom2000")));
        }
        if (denoms.containsKey("denom500")) {
            if (isClosing) reg.setCloseDenom500(getInt(denoms.get("denom500")));
            else reg.setDenom500(getInt(denoms.get("denom500")));
        }
        if (denoms.containsKey("denom200")) {
            if (isClosing) reg.setCloseDenom200(getInt(denoms.get("denom200")));
            else reg.setDenom200(getInt(denoms.get("denom200")));
        }
        if (denoms.containsKey("denom100")) {
            if (isClosing) reg.setCloseDenom100(getInt(denoms.get("denom100")));
            else reg.setDenom100(getInt(denoms.get("denom100")));
        }
        if (denoms.containsKey("denom50")) {
            if (isClosing) reg.setCloseDenom50(getInt(denoms.get("denom50")));
            else reg.setDenom50(getInt(denoms.get("denom50")));
        }
        if (denoms.containsKey("denom20")) {
            if (isClosing) reg.setCloseDenom20(getInt(denoms.get("denom20")));
            else reg.setDenom20(getInt(denoms.get("denom20")));
        }
        if (denoms.containsKey("denom10")) {
            if (isClosing) reg.setCloseDenom10(getInt(denoms.get("denom10")));
            else reg.setDenom10(getInt(denoms.get("denom10")));
        }
        if (denoms.containsKey("denom5")) {
            if (isClosing) reg.setCloseDenom5(getInt(denoms.get("denom5")));
            else reg.setDenom5(getInt(denoms.get("denom5")));
        }
        if (denoms.containsKey("denom2")) {
            if (isClosing) reg.setCloseDenom2(getInt(denoms.get("denom2")));
            else reg.setDenom2(getInt(denoms.get("denom2")));
        }
        if (denoms.containsKey("denom1")) {
            if (isClosing) reg.setCloseDenom1(getInt(denoms.get("denom1")));
            else reg.setDenom1(getInt(denoms.get("denom1")));
        }
    }

    private Integer getInt(Object val) {
        if (val == null) return 0;
        return Integer.valueOf(val.toString());
    }

    private Map<String, Object> registerToMap(CashRegister reg) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", reg.getId());
        map.put("date", reg.getRegisterDate());
        map.put("status", reg.getStatus().name());
        map.put("openingCash", reg.getOpeningCash());
        map.put("totalCashSales", reg.getTotalCashSales());
        map.put("totalUpiSales", reg.getTotalUpiSales());
        map.put("totalCardSales", reg.getTotalCardSales());
        map.put("totalBankTransferSales", reg.getTotalBankTransferSales());
        map.put("totalChequeSales", reg.getTotalChequeSales());
        map.put("totalCreditSales", reg.getTotalCreditSales());
        map.put("totalCashExpenses", reg.getTotalCashExpenses());
        map.put("totalCashReceived", reg.getTotalCashReceived());
        map.put("totalCashPaidOut", reg.getTotalCashPaidOut());
        map.put("closingCashSystem", reg.getClosingCashSystem());
        map.put("closingCashActual", reg.getClosingCashActual());
        map.put("difference", reg.getDifference());
        map.put("closingNotes", reg.getClosingNotes());
        map.put("openedAt", reg.getOpenedAt());
        map.put("closedAt", reg.getClosedAt());

        // Calculate expected cash
        BigDecimal expected = reg.getOpeningCash()
                .add(reg.getTotalCashSales())
                .add(reg.getTotalCashReceived())
                .subtract(reg.getTotalCashExpenses())
                .subtract(reg.getTotalCashPaidOut());
        map.put("expectedCashInDrawer", expected);

        // Total sales (all modes)
        BigDecimal totalSales = reg.getTotalCashSales()
                .add(reg.getTotalUpiSales())
                .add(reg.getTotalCardSales())
                .add(reg.getTotalBankTransferSales())
                .add(reg.getTotalChequeSales())
                .add(reg.getTotalCreditSales());
        map.put("totalAllSales", totalSales);

        return map;
    }

    private Map<String, Object> entryToMap(QuickCashEntry e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("entryType", e.getEntryType().name());
        map.put("amount", e.getAmount());
        map.put("paymentMode", e.getPaymentMode().name());
        map.put("description", e.getDescription());
        map.put("customerName", e.getCustomerName());
        map.put("linkedInvoiceId", e.getLinkedInvoiceId());
        map.put("expectedAmount", e.getExpectedAmount());
        map.put("shortAmount", e.getShortAmount());
        map.put("shortReason", e.getShortReason());
        map.put("entryTime", e.getEntryTime());
        return map;
    }
}
