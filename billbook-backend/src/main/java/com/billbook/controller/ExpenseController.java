package com.billbook.controller;

import com.billbook.model.Expense;
import com.billbook.model.BbUser;
import com.billbook.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/bb/expenses") @RequiredArgsConstructor
public class ExpenseController {
    private final ExpenseRepository expenseRepo;

    @GetMapping
    public List<Expense> list(@AuthenticationPrincipal BbUser user) {
        return expenseRepo.findByUserIdOrderByExpenseDateDesc(user.getId());
    }

    @PostMapping
    public Expense create(@AuthenticationPrincipal BbUser user, @RequestBody Expense expense) {
        expense.setUser(user);
        return expenseRepo.save(expense);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> update(@AuthenticationPrincipal BbUser user, @PathVariable Long id, @RequestBody Expense body) {
        Expense e = expenseRepo.findById(id).orElseThrow();
        if (!e.getUser().getId().equals(user.getId())) return ResponseEntity.status(403).build();
        e.setDescription(body.getDescription());
        e.setCategory(body.getCategory());
        e.setAmount(body.getAmount());
        e.setExpenseDate(body.getExpenseDate());
        e.setPaymentMode(body.getPaymentMode());
        e.setReferenceNumber(body.getReferenceNumber());
        e.setNotes(body.getNotes());
        return ResponseEntity.ok(expenseRepo.save(e));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        Expense e = expenseRepo.findById(id).orElseThrow();
        if (!e.getUser().getId().equals(user.getId())) return ResponseEntity.status(403).build();
        expenseRepo.delete(e);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
