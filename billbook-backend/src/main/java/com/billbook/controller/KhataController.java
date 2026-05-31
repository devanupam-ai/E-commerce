package com.billbook.controller;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api/bb/khata") @RequiredArgsConstructor
public class KhataController {
    private final KhataEntryRepository khataEntryRepo;
    private final KhataSettlementRepository khataSettlementRepo;
    private final CustomerRepository customerRepo;
    private final InvoiceRepository invoiceRepo;
    private final PaymentRepository paymentRepo;

    // ========== PARTY KHATA OVERVIEW ==========
    @GetMapping("/overview")
    public Map<String, Object> overview(@AuthenticationPrincipal BbUser user) {
        Long uid = user.getId();

        List<KhataEntry.EntryType> creditTypes = List.of(
            KhataEntry.EntryType.CREDIT_GIVEN, KhataEntry.EntryType.DEBIT_RECEIVED
        );
        List<KhataEntry.EntryType> debitTypes = List.of(
            KhataEntry.EntryType.CREDIT_RECEIVED, KhataEntry.EntryType.DEBIT_GIVEN
        );
        List<KhataEntry.EntryType> paymentTypes = List.of(
            KhataEntry.EntryType.PAYMENT_RECEIVED, KhataEntry.EntryType.PAYMENT_MADE
        );

        BigDecimal totalUdhaarGiven = khataEntryRepo.sumTotalCreditGiven(uid, creditTypes);
        BigDecimal totalUdhaarReceived = khataEntryRepo.sumTotalDebitGiven(uid, debitTypes);
        BigDecimal totalPaymentReceived = khataEntryRepo.sumTotalCreditGiven(uid, List.of(KhataEntry.EntryType.PAYMENT_RECEIVED));
        BigDecimal totalPaymentMade = khataEntryRepo.sumTotalDebitGiven(uid, List.of(KhataEntry.EntryType.PAYMENT_MADE));

        // Overdue entries
        List<KhataEntry> overdueEntries = khataEntryRepo.findByUserIdAndDueDateBeforeAndStatusNot(uid, LocalDate.now(), KhataEntry.EntryStatus.SETTLED);
        BigDecimal totalOverdue = overdueEntries.stream()
            .filter(e -> e.getEntryType() == KhataEntry.EntryType.CREDIT_GIVEN || e.getEntryType() == KhataEntry.EntryType.DEBIT_RECEIVED)
            .map(KhataEntry::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Party-wise balances
        List<Object[]> partyBalances = khataEntryRepo.getPartyWiseBalances(uid, creditTypes, paymentTypes);
        List<Map<String, Object>> partyList = new ArrayList<>();
        for (Object[] row : partyBalances) {
            Long partyId = (Long) row[0];
            BigDecimal balance = (BigDecimal) row[1];
            Optional<Customer> partyOpt = customerRepo.findById(partyId);
            if (partyOpt.isPresent()) {
                Customer party = partyOpt.get();
                Map<String, Object> pm = new LinkedHashMap<>();
                pm.put("partyId", partyId);
                pm.put("partyName", party.getName());
                pm.put("partyPhone", party.getPhone());
                pm.put("partyType", party.getType());
                pm.put("balance", balance);
                pm.put("balanceType", balance.compareTo(BigDecimal.ZERO) >= 0 ? "RECEIVABLE" : "PAYABLE");
                partyList.add(pm);
            }
        }

        // Sort by absolute balance descending
        partyList.sort((a, b) -> ((BigDecimal) b.get("balance")).abs().compareTo(((BigDecimal) a.get("balance")).abs()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUdhaarGiven", totalUdhaarGiven);
        result.put("totalUdhaarReceived", totalUdhaarReceived);
        result.put("totalPaymentReceived", totalPaymentReceived);
        result.put("totalPaymentMade", totalPaymentMade);
        result.put("netReceivable", totalUdhaarGiven.subtract(totalPaymentReceived));
        result.put("netPayable", totalUdhaarReceived.subtract(totalPaymentMade));
        result.put("totalOverdue", totalOverdue);
        result.put("overdueCount", overdueEntries.size());
        result.put("parties", partyList);
        return result;
    }

    // ========== ADD KHATA ENTRY (Manual Udhaar) ==========
    @PostMapping("/entry")
    public ResponseEntity<?> addEntry(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        Long partyId = Long.valueOf(body.get("partyId").toString());
        Customer party = customerRepo.findById(partyId).orElseThrow(() -> new RuntimeException("Party not found"));

        KhataEntry entry = new KhataEntry();
        entry.setUser(user);
        entry.setParty(party);
        entry.setEntryType(KhataEntry.EntryType.valueOf(body.get("entryType").toString()));
        entry.setAmount(new BigDecimal(body.get("amount").toString()));
        entry.setDescription(body.getOrDefault("description", "").toString());
        entry.setEntryDate(body.containsKey("entryDate") ? LocalDate.parse(body.get("entryDate").toString()) : LocalDate.now());
        entry.setDueDate(body.containsKey("dueDate") ? LocalDate.parse(body.get("dueDate").toString()) : null);
        entry.setReferenceType("MANUAL");
        if (body.containsKey("interestRate")) {
            entry.setInterestRate(new BigDecimal(body.get("interestRate").toString()));
        }

        return ResponseEntity.ok(khataEntryRepo.save(entry));
    }

    // ========== GET PARTY KHATA (Ledger) ==========
    @GetMapping("/party/{partyId}")
    public Map<String, Object> partyKhata(@AuthenticationPrincipal BbUser user, @PathVariable Long partyId) {
        Long uid = user.getId();
        Customer party = customerRepo.findById(partyId).orElseThrow(() -> new RuntimeException("Party not found"));

        List<KhataEntry> entries = khataEntryRepo.findByUserIdAndPartyIdOrderByEntryDateDesc(uid, partyId);
        List<KhataSettlement> settlements = khataSettlementRepo.findByUserIdAndPartyIdOrderBySettlementDateDesc(uid, partyId);

        // Calculate outstanding
        List<KhataEntry.EntryType> creditTypes = List.of(KhataEntry.EntryType.CREDIT_GIVEN, KhataEntry.EntryType.DEBIT_RECEIVED);
        List<KhataEntry.EntryType> paymentTypes = List.of(KhataEntry.EntryType.PAYMENT_RECEIVED, KhataEntry.EntryType.PAYMENT_MADE);
        BigDecimal totalCredit = khataEntryRepo.sumPendingByPartyAndTypes(uid, partyId, creditTypes);
        BigDecimal totalPayments = khataEntryRepo.sumPendingByPartyAndTypes(uid, partyId, paymentTypes);
        BigDecimal outstanding = totalCredit.subtract(totalPayments);
        BigDecimal pendingInterest = khataEntryRepo.sumPendingInterestByParty(uid, partyId);

        // Build ledger with running balance
        List<Map<String, Object>> ledger = new ArrayList<>();
        BigDecimal balance = BigDecimal.ZERO;

        // Combine entries and settlements, sort by date
        List<Map<String, Object>> allTransactions = new ArrayList<>();
        for (KhataEntry e : entries) {
            Map<String, Object> t = new LinkedHashMap<>();
            t.put("date", e.getEntryDate());
            t.put("particular", e.getDescription());
            t.put("type", e.getEntryType().toString());
            t.put("referenceType", e.getReferenceType());
            t.put("referenceId", e.getReferenceId());
            t.put("status", e.getStatus().toString());

            if (e.getEntryType() == KhataEntry.EntryType.CREDIT_GIVEN || e.getEntryType() == KhataEntry.EntryType.DEBIT_RECEIVED) {
                t.put("debit", e.getAmount());
                t.put("credit", BigDecimal.ZERO);
            } else if (e.getEntryType() == KhataEntry.EntryType.PAYMENT_RECEIVED || e.getEntryType() == KhataEntry.EntryType.PAYMENT_MADE) {
                t.put("debit", BigDecimal.ZERO);
                t.put("credit", e.getAmount());
            } else if (e.getEntryType() == KhataEntry.EntryType.INTEREST) {
                t.put("debit", e.getAmount());
                t.put("credit", BigDecimal.ZERO);
            } else {
                t.put("debit", BigDecimal.ZERO);
                t.put("credit", e.getAmount());
            }
            t.put("id", e.getId());
            t.put("dueDate", e.getDueDate());
            t.put("interestRate", e.getInterestRate());
            allTransactions.add(t);
        }

        // Sort by date
        allTransactions.sort((a, b) -> ((Comparable) a.get("date")).compareTo(b.get("date")));

        // Calculate running balance
        for (Map<String, Object> t : allTransactions) {
            BigDecimal debit = (BigDecimal) t.get("debit");
            BigDecimal credit = (BigDecimal) t.get("credit");
            balance = balance.add(debit).subtract(credit);
            t.put("balance", balance);
            ledger.add(t);
        }

        // Overdue entries
        List<KhataEntry> overdueEntries = entries.stream()
            .filter(e -> e.getDueDate() != null && e.getDueDate().isBefore(LocalDate.now()) && e.getStatus() != KhataEntry.EntryStatus.SETTLED)
            .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("party", Map.of("id", party.getId(), "name", party.getName(), "phone", party.getPhone(), "type", party.getType(), "gstin", party.getGstin() != null ? party.getGstin() : ""));
        result.put("outstanding", outstanding);
        result.put("pendingInterest", pendingInterest);
        result.put("totalOutstandingWithInterest", outstanding.add(pendingInterest));
        result.put("overdueCount", overdueEntries.size());
        result.put("overdueAmount", overdueEntries.stream().map(KhataEntry::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
        result.put("ledger", ledger);
        result.put("settlements", settlements);
        return result;
    }

    // ========== SETTLE / RECORD PAYMENT ==========
    @PostMapping("/settle")
    public ResponseEntity<?> settleEntry(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        Long entryId = Long.valueOf(body.get("khataEntryId").toString());
        KhataEntry entry = khataEntryRepo.findById(entryId).orElseThrow(() -> new RuntimeException("Entry not found"));

        if (!entry.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        BigDecimal settleAmount = new BigDecimal(body.get("amount").toString());

        KhataSettlement settlement = new KhataSettlement();
        settlement.setUser(user);
        settlement.setParty(entry.getParty());
        settlement.setKhataEntry(entry);
        settlement.setAmount(settleAmount);
        settlement.setSettlementDate(body.containsKey("settlementDate") ? LocalDate.parse(body.get("settlementDate").toString()) : LocalDate.now());
        settlement.setPaymentMode(Invoice.PaymentMode.valueOf(body.getOrDefault("paymentMode", "CASH").toString()));
        settlement.setReferenceNumber(body.getOrDefault("referenceNumber", "").toString());
        settlement.setNotes(body.getOrDefault("notes", "").toString());
        khataSettlementRepo.save(settlement);

        // Update entry status
        BigDecimal totalSettled = khataSettlementRepo.findByKhataEntryIdOrderBySettlementDateDesc(entryId).stream()
            .map(KhataSettlement::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalSettled.compareTo(entry.getAmount()) >= 0) {
            entry.setStatus(KhataEntry.EntryStatus.SETTLED);
        } else if (totalSettled.compareTo(BigDecimal.ZERO) > 0) {
            entry.setStatus(KhataEntry.EntryStatus.PARTIAL);
        }
        entry.setUpdatedAt(java.time.LocalDateTime.now());
        khataEntryRepo.save(entry);

        return ResponseEntity.ok(Map.of("ok", true, "settlement", settlement, "entryStatus", entry.getStatus()));
    }

    // ========== CALCULATE INTEREST ON OVERDUE ==========
    @PostMapping("/calculate-interest")
    public ResponseEntity<?> calculateInterest(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, Object> body) {
        Long partyId = Long.valueOf(body.get("partyId").toString());
        BigDecimal annualRate = new BigDecimal(body.getOrDefault("interestRate", "18").toString());

        Long uid = user.getId();
        List<KhataEntry> overdueEntries = khataEntryRepo.findByUserIdAndPartyIdOrderByEntryDateDesc(uid, partyId).stream()
            .filter(e -> e.getDueDate() != null && e.getDueDate().isBefore(LocalDate.now()) && e.getStatus() != KhataEntry.EntryStatus.SETTLED)
            .filter(e -> e.getEntryType() == KhataEntry.EntryType.CREDIT_GIVEN || e.getEntryType() == KhataEntry.EntryType.DEBIT_RECEIVED)
            .collect(Collectors.toList());

        BigDecimal totalInterest = BigDecimal.ZERO;
        for (KhataEntry entry : overdueEntries) {
            long daysOverdue = ChronoUnit.DAYS.between(entry.getDueDate(), LocalDate.now());
            BigDecimal interest = entry.getAmount()
                .multiply(annualRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(daysOverdue))
                .divide(BigDecimal.valueOf(365), 2, RoundingMode.HALF_UP);

            // Create interest entry
            KhataEntry interestEntry = new KhataEntry();
            interestEntry.setUser(user);
            interestEntry.setParty(entry.getParty());
            interestEntry.setEntryType(KhataEntry.EntryType.INTEREST);
            interestEntry.setAmount(interest);
            interestEntry.setDescription("Interest on overdue: " + entry.getDescription() + " (" + daysOverdue + " days)");
            interestEntry.setEntryDate(LocalDate.now());
            interestEntry.setReferenceId(entry.getId());
            interestEntry.setReferenceType("INTEREST");
            interestEntry.setInterestRate(annualRate);
            khataEntryRepo.save(interestEntry);

            // Update original entry
            entry.setInterestRate(annualRate);
            entry.setInterestAmount(entry.getInterestAmount().add(interest));
            khataEntryRepo.save(entry);

            totalInterest = totalInterest.add(interest);
        }

        return ResponseEntity.ok(Map.of("ok", true, "interestCalculated", totalInterest, "entriesProcessed", overdueEntries.size()));
    }

    // ========== SEND REMINDER (WhatsApp/SMS link) ==========
    @GetMapping("/reminder/{partyId}")
    public ResponseEntity<?> sendReminder(@AuthenticationPrincipal BbUser user, @PathVariable Long partyId) {
        Long uid = user.getId();
        Customer party = customerRepo.findById(partyId).orElseThrow(() -> new RuntimeException("Party not found"));

        List<KhataEntry.EntryType> creditTypes = List.of(KhataEntry.EntryType.CREDIT_GIVEN, KhataEntry.EntryType.DEBIT_RECEIVED);
        List<KhataEntry.EntryType> paymentTypes = List.of(KhataEntry.EntryType.PAYMENT_RECEIVED);
        BigDecimal outstanding = khataEntryRepo.sumPendingByPartyAndTypes(uid, partyId, creditTypes)
            .subtract(khataEntryRepo.sumPendingByPartyAndTypes(uid, partyId, paymentTypes));

        // Generate WhatsApp link
        String message = String.format("Hi %s, your outstanding balance of Rs. %s is pending. Please clear your dues at the earliest. - %s",
            party.getName(), outstanding.setScale(0, RoundingMode.HALF_UP).toPlainString(), user.getBusinessName());
        String whatsappLink = party.getPhone() != null && !party.getPhone().isEmpty()
            ? "https://wa.me/91" + party.getPhone().replaceAll("[^0-9]", "") + "?text=" + java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8)
            : "";

        // Mark reminder sent on overdue entries
        List<KhataEntry> overdueEntries = khataEntryRepo.findByUserIdAndDueDateBeforeAndStatusNot(uid, LocalDate.now(), KhataEntry.EntryStatus.SETTLED).stream()
            .filter(e -> e.getParty().getId().equals(partyId))
            .collect(Collectors.toList());
        for (KhataEntry e : overdueEntries) {
            e.setReminderSent(true);
            khataEntryRepo.save(e);
        }

        return ResponseEntity.ok(Map.of(
            "partyName", party.getName(),
            "outstanding", outstanding,
            "whatsappLink", whatsappLink,
            "message", message,
            "overdueEntries", overdueEntries.size()
        ));
    }

    // ========== GET OVERDUE ENTRIES ==========
    @GetMapping("/overdue")
    public List<Map<String, Object>> getOverdueEntries(@AuthenticationPrincipal BbUser user) {
        Long uid = user.getId();
        List<KhataEntry> overdueEntries = khataEntryRepo.findByUserIdAndDueDateBeforeAndStatusNot(uid, LocalDate.now(), KhataEntry.EntryStatus.SETTLED);

        return overdueEntries.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("partyName", e.getParty().getName());
            m.put("partyPhone", e.getParty().getPhone());
            m.put("amount", e.getAmount());
            m.put("dueDate", e.getDueDate());
            m.put("daysOverdue", ChronoUnit.DAYS.between(e.getDueDate(), LocalDate.now()));
            m.put("description", e.getDescription());
            m.put("entryType", e.getEntryType().toString());
            m.put("reminderSent", e.getReminderSent());
            return m;
        }).collect(Collectors.toList());
    }

    // ========== SYNC INVOICE TO KHATA ==========
    @PostMapping("/sync-invoice/{invoiceId}")
    public ResponseEntity<?> syncInvoiceToKhata(@AuthenticationPrincipal BbUser user, @PathVariable Long invoiceId) {
        Invoice invoice = invoiceRepo.findById(invoiceId).orElseThrow(() -> new RuntimeException("Invoice not found"));

        if (!invoice.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        if (invoice.getCustomer() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invoice has no customer"));
        }

        // Check if already synced
        List<KhataEntry> existing = khataEntryRepo.findByUserIdAndPartyIdOrderByEntryDateDesc(user.getId(), invoice.getCustomer().getId()).stream()
            .filter(e -> invoiceId.equals(e.getReferenceId()) && "INVOICE".equals(e.getReferenceType()))
            .collect(Collectors.toList());

        if (!existing.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Already synced to khata"));
        }

        KhataEntry entry = new KhataEntry();
        entry.setUser(user);
        entry.setParty(invoice.getCustomer());
        entry.setEntryType(invoice.getBalanceDue().compareTo(BigDecimal.ZERO) > 0 ? KhataEntry.EntryType.CREDIT_GIVEN : KhataEntry.EntryType.CREDIT_RECEIVED);
        entry.setAmount(invoice.getBalanceDue());
        entry.setDescription("Invoice #" + invoice.getInvoiceNumber());
        entry.setEntryDate(invoice.getInvoiceDate());
        entry.setDueDate(invoice.getDueDate());
        entry.setReferenceId(invoiceId);
        entry.setReferenceType("INVOICE");

        if (invoice.getPaymentStatus() == Invoice.PaymentStatus.PAID) {
            entry.setStatus(KhataEntry.EntryStatus.SETTLED);
        } else if (invoice.getPaymentStatus() == Invoice.PaymentStatus.PARTIAL) {
            entry.setStatus(KhataEntry.EntryStatus.PARTIAL);
        }

        return ResponseEntity.ok(khataEntryRepo.save(entry));
    }
}
