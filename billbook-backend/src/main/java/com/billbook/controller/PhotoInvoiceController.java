
package com.billbook.controller;

import com.billbook.model.BbUser;
import com.billbook.model.ScannedInvoice;
import com.billbook.repository.ScannedInvoiceRepository;
import com.billbook.service.PhotoInvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/bb/photo-invoice")
@RequiredArgsConstructor
public class PhotoInvoiceController {

    private final PhotoInvoiceService photoInvoiceService;
    private final ScannedInvoiceRepository scanRepo;

    // ========== SCAN INVOICE IMAGE ==========
    @PostMapping("/scan")
    public ResponseEntity<?> scanInvoice(
            @AuthenticationPrincipal BbUser user,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload an image file"));
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only image files are supported"));
        }

        Map<String, Object> result = photoInvoiceService.scanInvoice(user, file);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ========== GET ALL SCANNED INVOICES ==========
    @GetMapping("/scans")
    public ResponseEntity<?> getAllScans(@AuthenticationPrincipal BbUser user) {
        List<ScannedInvoice> scans = scanRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (ScannedInvoice s : scans) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("shopName", s.getExtractedShopName());
            map.put("invoiceNumber", s.getExtractedInvoiceNumber());
            map.put("date", s.getExtractedDate());
            map.put("total", s.getExtractedTotal());
            map.put("tax", s.getExtractedTax());
            map.put("status", s.getScanStatus().name());
            map.put("convertedInvoiceId", s.getConvertedInvoiceId());
            map.put("createdAt", s.getCreatedAt());
            result.add(map);
        }
        return ResponseEntity.ok(Map.of("scans", result, "total", result.size()));
    }

    // ========== GET SCAN DETAILS ==========
    @GetMapping("/scan/{id}")
    public ResponseEntity<?> getScanDetails(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        ScannedInvoice scan = scanRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Scan not found"));

        if (!scan.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", scan.getId());
        result.put("ocrRawText", scan.getOcrRawText());
        result.put("shopName", scan.getExtractedShopName());
        result.put("invoiceNumber", scan.getExtractedInvoiceNumber());
        result.put("date", scan.getExtractedDate());
        result.put("total", scan.getExtractedTotal());
        result.put("tax", scan.getExtractedTax());
        result.put("items", scan.getExtractedItems());
        result.put("status", scan.getScanStatus().name());
        result.put("convertedInvoiceId", scan.getConvertedInvoiceId());
        result.put("errorMessage", scan.getErrorMessage());
        result.put("createdAt", scan.getCreatedAt());
        return ResponseEntity.ok(result);
    }

    // ========== CONVERT SCAN TO INVOICE ==========
    @PostMapping("/convert/{scanId}")
    public ResponseEntity<?> convertToInvoice(
            @AuthenticationPrincipal BbUser user,
            @PathVariable Long scanId,
            @RequestBody Map<String, Object> body) {

        Map<String, Object> result = photoInvoiceService.convertScanToInvoice(user, scanId, body);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ========== DELETE SCAN ==========
    @DeleteMapping("/scan/{id}")
    public ResponseEntity<?> deleteScan(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        ScannedInvoice scan = scanRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Scan not found"));

        if (!scan.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        scanRepo.delete(scan);
        return ResponseEntity.ok(Map.of("message", "Scan deleted successfully"));
    }
}
