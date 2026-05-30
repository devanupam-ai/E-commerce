package com.ecommerce.controller;

import com.ecommerce.model.OfflineBill;
import com.ecommerce.repository.OfflineBillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/admin/offline-bills") @RequiredArgsConstructor
public class OfflineBillController {
    private final OfflineBillRepository offlineBillRepository;

    @GetMapping
    public ResponseEntity<List<OfflineBill>> getAll() {
        return ResponseEntity.ok(offlineBillRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<OfflineBill> create(@RequestBody OfflineBill bill) {
        if (bill.getBillNumber() == null)
            bill.setBillNumber("BILL" + System.currentTimeMillis());
        return ResponseEntity.ok(offlineBillRepository.save(bill));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        offlineBillRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
