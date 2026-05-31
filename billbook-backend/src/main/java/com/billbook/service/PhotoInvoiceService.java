
package com.billbook.service;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.io.File;

@Slf4j
@Service
@RequiredArgsConstructor
public class PhotoInvoiceService {

    private final ScannedInvoiceRepository scanRepo;
    private final CustomerRepository customerRepo;
    private final BbProductRepository productRepo;
    private final InvoiceRepository invoiceRepo;

    @Value("${app.upload.dir:uploads/scans}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (Exception e) {
            log.warn("Could not create upload directory: {}", e.getMessage());
        }
    }

    // ========== SCAN AND PROCESS INVOICE IMAGE ==========
    public Map<String, Object> scanInvoice(BbUser user, MultipartFile file) {
        try {
            // Save the file
            String filename = "scan_" + user.getId() + "_" + System.currentTimeMillis() + ".jpg";
            Path filePath = Paths.get(uploadDir, filename);
            Files.write(filePath, file.getBytes());

            // Create scanned invoice record
            ScannedInvoice scan = new ScannedInvoice();
            scan.setUser(user);
            scan.setOriginalImagePath(filePath.toString());
            scan.setScanStatus(ScannedInvoice.ScanStatus.PENDING);
            scanRepo.save(scan);

            // Extract text using OCR
            String ocrText = performOCR(filePath.toString());
            scan.setOcrRawText(ocrText);

            // Parse the extracted text
            Map<String, Object> extracted = parseInvoiceText(ocrText);

            scan.setExtractedShopName((String) extracted.get("shopName"));
            scan.setExtractedInvoiceNumber((String) extracted.get("invoiceNumber"));
            scan.setExtractedDate((String) extracted.get("date"));
            scan.setExtractedTotal((BigDecimal) extracted.getOrDefault("total", BigDecimal.ZERO));
            scan.setExtractedTax((BigDecimal) extracted.getOrDefault("tax", BigDecimal.ZERO));
            scan.setExtractedItems((String) extracted.getOrDefault("itemsJson", "[]"));
            scan.setScanStatus(ScannedInvoice.ScanStatus.PROCESSED);
            scanRepo.save(scan);

            // Build response
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("scanId", scan.getId());
            result.put("ocrText", ocrText);
            result.put("extracted", extracted);
            result.put("status", "PROCESSED");
            result.put("message", "Invoice scanned successfully! Review and confirm to create invoice.");

            // Suggest matching products from user's catalog
            List<Map<String, Object>> suggestedProducts = suggestProducts(user.getId(), (List<Map<String, Object>>) extracted.get("items"));
            result.put("suggestedProducts", suggestedProducts);

            // Suggest matching customers
            List<Map<String, Object>> suggestedCustomers = suggestCustomers(user.getId(), (String) extracted.get("shopName"));
            result.put("suggestedCustomers", suggestedCustomers);

            return result;

        } catch (Exception e) {
            log.error("Error scanning invoice: ", e);
            return Map.of("error", "Failed to scan invoice: " + e.getMessage(), "status", "FAILED");
        }
    }

    // ========== PERFORM OCR ==========
    private String performOCR(String imagePath) {
        try {
            // Try using Tesseract OCR
            net.sourceforge.tess4j.Tesseract tesseract = new net.sourceforge.tess4j.Tesseract();
            tesseract.setDatapath("tessdata"); // tessdata directory
            tesseract.setLanguage("eng+hin"); // English + Hindi
            tesseract.setPageSegMode(6); // Assume uniform block of text

            java.io.File imageFile = new java.io.File(imagePath);
            if (imageFile.exists()) {
                return tesseract.doOCR(imageFile);
            }
        } catch (UnsatisfiedLinkError | NoClassDefFoundError e) {
            log.warn("Tesseract OCR not available, using fallback text extraction");
        } catch (Exception e) {
            log.warn("OCR failed: {}, using fallback", e.getMessage());
        }

        // Fallback: Return placeholder indicating manual entry needed
        return "[OCR not available - Please install Tesseract OCR for automatic text extraction]\n" +
                "Upload this image to manually extract invoice details.";
    }

    // ========== PARSE INVOICE TEXT ==========
    private Map<String, Object> parseInvoiceText(String text) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> items = new ArrayList<>();

        // Extract Invoice Number
        Pattern invPattern = Pattern.compile("(?i)(invoice|bill|receipt)\\s*#?\\s*:?\\s*([A-Z0-9\\-]+)");
        Matcher invMatcher = invPattern.matcher(text);
        if (invMatcher.find()) {
            result.put("invoiceNumber", invMatcher.group(2).trim());
        } else {
            result.put("invoiceNumber", "SCAN-" + System.currentTimeMillis());
        }

        // Extract Date
        Pattern datePattern = Pattern.compile("(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})");
        Matcher dateMatcher = datePattern.matcher(text);
        if (dateMatcher.find()) {
            result.put("date", dateMatcher.group(1));
        } else {
            result.put("date", LocalDate.now().toString());
        }

        // Extract Total Amount
        Pattern totalPattern = Pattern.compile("(?i)(total|grand total|amount due|net amount)\\s*:?\\s*[₹Rs.]*\\s*([\\d,]+\\.?\\d]*)");
        Matcher totalMatcher = totalPattern.matcher(text);
        if (totalMatcher.find()) {
            String amountStr = totalMatcher.group(2).replace(",", "");
            result.put("total", new BigDecimal(amountStr).setScale(0, RoundingMode.HALF_UP));
        } else {
            // Try finding any ₹ amount
            Pattern rupeePattern = Pattern.compile("[₹]\\s*([\\d,]+\\.?\\d]*)");
            Matcher rupeeMatcher = rupeePattern.matcher(text);
            BigDecimal maxAmount = BigDecimal.ZERO;
            while (rupeeMatcher.find()) {
                String amt = rupeeMatcher.group(1).replace(",", "");
                BigDecimal val = new BigDecimal(amt);
                if (val.compareTo(maxAmount) > 0) maxAmount = val;
            }
            result.put("total", maxAmount);
        }

        // Extract Tax
        Pattern taxPattern = Pattern.compile("(?i)(gst|tax|cgst|sgst|igst)\\s*:?\\s*[₹Rs.]*\\s*([\\d,]+\\.?\\d]*)");
        Matcher taxMatcher = taxPattern.matcher(text);
        if (taxMatcher.find()) {
            String taxStr = taxMatcher.group(2).replace(",", "");
            result.put("tax", new BigDecimal(taxStr));
        } else {
            result.put("tax", BigDecimal.ZERO);
        }

        // Extract Shop Name (usually first line or after "From:" / "Shop:")
        Pattern shopPattern = Pattern.compile("(?i)(from|shop|seller|vendor|supplier)\\s*:?\\s*(.+)");
        Matcher shopMatcher = shopPattern.matcher(text);
        if (shopMatcher.find()) {
            result.put("shopName", shopMatcher.group(2).trim().substring(0, Math.min(100, shopMatcher.group(2).trim().length())));
        } else {
            // Use first non-empty line as shop name
            String[] lines = text.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.length() > 3 && line.length() < 100) {
                    result.put("shopName", line);
                    break;
                }
            }
            if (!result.containsKey("shopName")) result.put("shopName", "Unknown");
        }

        // Extract Line Items (simple pattern: quantity x price)
        Pattern itemPattern = Pattern.compile("(.+?)\\s+(\\d+\\.?\\d*)\\s*[x×]\\s*[₹]?\\s*([\\d,]+\\.?\\d]*)");
        Matcher itemMatcher = itemPattern.matcher(text);
        while (itemMatcher.find()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", itemMatcher.group(1).trim());
            item.put("quantity", new BigDecimal(itemMatcher.group(2)));
            item.put("price", new BigDecimal(itemMatcher.group(3).replace(",", "")));
            item.put("total", new BigDecimal(itemMatcher.group(2)).multiply(new BigDecimal(itemMatcher.group(3).replace(",", ""))));
            items.add(item);
        }

        // If no items found with pattern, try another pattern
        if (items.isEmpty()) {
            Pattern itemPattern2 = Pattern.compile("(.+?)\\s+[₹Rs.]*\\s*([\\d,]+\\.?\\d]*)");
            Matcher itemMatcher2 = itemPattern2.matcher(text);
            while (itemMatcher2.find()) {
                String name = itemMatcher2.group(1).trim();
                if (name.length() < 2 || name.matches("(?i)(total|tax|gst|date|invoice|bill)\s*.*")) continue;
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("name", name);
                item.put("quantity", BigDecimal.ONE);
                item.put("price", new BigDecimal(itemMatcher2.group(2).replace(",", "")));
                item.put("total", new BigDecimal(itemMatcher2.group(2).replace(",", "")));
                items.add(item);
            }
        }

        result.put("items", items);
        result.put("itemsJson", items.toString());
        result.put("itemCount", items.size());

        return result;
    }

    // ========== SUGGEST MATCHING PRODUCTS ==========
    private List<Map<String, Object>> suggestProducts(Long userId, List<Map<String, Object>> extractedItems) {
        List<Map<String, Object>> suggestions = new ArrayList<>();
        List<BbProduct> userProducts = productRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);

        if (extractedItems == null) return suggestions;

        for (Map<String, Object> item : extractedItems) {
            String itemName = (String) item.get("name");
            Map<String, Object> suggestion = new LinkedHashMap<>();
            suggestion.put("scannedItem", itemName);
            suggestion.put("scannedPrice", item.get("price"));

            // Find best matching product
            BbProduct bestMatch = null;
            double bestScore = 0;
            for (BbProduct p : userProducts) {
                double score = calculateSimilarity(itemName.toLowerCase(), p.getName().toLowerCase());
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = p;
                }
            }

            if (bestMatch != null && bestScore > 0.3) {
                Map<String, Object> match = new LinkedHashMap<>();
                match.put("id", bestMatch.getId());
                match.put("name", bestMatch.getName());
                match.put("sellingPrice", bestMatch.getSellingPrice());
                match.put("unit", bestMatch.getUnit());
                match.put("matchScore", Math.round(bestScore * 100) + "%");
                suggestion.put("matchedProduct", match);
            } else {
                suggestion.put("matchedProduct", null);
                suggestion.put("suggestion", "Create new product: " + itemName);
            }
            suggestions.add(suggestion);
        }
        return suggestions;
    }

    // ========== SUGGEST MATCHING CUSTOMERS ==========
    private List<Map<String, Object>> suggestCustomers(Long userId, String shopName) {
        List<Map<String, Object>> suggestions = new ArrayList<>();
        List<Customer> customers = customerRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);

        if (shopName == null || shopName.equals("Unknown")) {
            // Return top 5 customers
            for (int i = 0; i < Math.min(5, customers.size()); i++) {
                Customer c = customers.get(i);
                suggestions.add(Map.of("id", c.getId(), "name", c.getName(), "phone", c.getPhone() != null ? c.getPhone() : ""));
            }
            return suggestions;
        }

        // Find matching customers by name
        for (Customer c : customers) {
            double score = calculateSimilarity(shopName.toLowerCase(), c.getName().toLowerCase());
            if (score > 0.3) {
                suggestions.add(Map.of("id", c.getId(), "name", c.getName(), "phone", c.getPhone() != null ? c.getPhone() : "", "matchScore", Math.round(score * 100) + "%"));
            }
        }

        if (suggestions.isEmpty()) {
            for (int i = 0; i < Math.min(5, customers.size()); i++) {
                Customer c = customers.get(i);
                suggestions.add(Map.of("id", c.getId(), "name", c.getName(), "phone", c.getPhone() != null ? c.getPhone() : ""));
            }
        }

        return suggestions;
    }

    // ========== SIMPLE STRING SIMILARITY ==========
    private double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0;
        String longer = s1.length() > s2.length() ? s1 : s2;
        String shorter = s1.length() > s2.length() ? s2 : s1;
        if (longer.isEmpty()) return 1.0;

        // Check if shorter is contained in longer
        if (longer.contains(shorter)) return 0.8;

        // Levenshtein-based similarity
        int editDistance = levenshteinDistance(longer, shorter);
        return (longer.length() - editDistance) / (double) longer.length();
    }

    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + (s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1));
            }
        }
        return dp[s1.length()][s2.length()];
    }

    // ========== GET SCAN HISTORY ==========
    public List<Map<String, Object>> getScanHistory(Long userId) {
        List<ScannedInvoice> scans = scanRepo.findByUserIdOrderByCreatedAtDesc(userId);
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
            map.put("scannedAt", s.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    // ========== GET SCAN DETAILS ==========
    public Map<String, Object> getScanDetails(Long scanId, Long userId) {
        ScannedInvoice scan = scanRepo.findById(scanId)
                .orElseThrow(() -> new RuntimeException("Scan not found"));

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
        result.put("scannedAt", scan.getCreatedAt());
        return result;
    }

    // ========== CONVERT SCAN TO INVOICE ==========
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> convertScanToInvoice(BbUser user, Long scanId, Map<String, Object> body) {
        ScannedInvoice scan = scanRepo.findById(scanId)
                .orElseThrow(() -> new RuntimeException("Scan not found"));

        if (!scan.getUser().getId().equals(user.getId())) {
            return Map.of("error", "Not authorized");
        }

        if (scan.getScanStatus() == ScannedInvoice.ScanStatus.CONVERTED) {
            return Map.of("error", "This scan has already been converted to an invoice", "invoiceId", scan.getConvertedInvoiceId());
        }

        try {
            // Create invoice from scan data
            Invoice invoice = new Invoice();
            invoice.setUser(user);

            // Set customer
            Long customerId = body.get("customerId") != null ? Long.valueOf(body.get("customerId").toString()) : null;
            if (customerId != null) {
                customerRepo.findById(customerId).ifPresent(invoice::setCustomer);
            }

            // Set invoice details from scan or body overrides
            String invoiceNumber = body.getOrDefault("invoiceNumber", scan.getExtractedInvoiceNumber()).toString();
            invoice.setInvoiceNumber(invoiceNumber);

            String dateStr = body.getOrDefault("invoiceDate", scan.getExtractedDate()).toString();
            try {
                invoice.setInvoiceDate(LocalDate.parse(dateStr));
            } catch (Exception e) {
                invoice.setInvoiceDate(LocalDate.now());
            }

            // Set amounts
            BigDecimal totalAmount = body.get("totalAmount") != null
                    ? new BigDecimal(body.get("totalAmount").toString())
                    : scan.getExtractedTotal();
            invoice.setTotalAmount(totalAmount);
            invoice.setSubtotal(totalAmount.subtract(scan.getExtractedTax()));
            invoice.setTotalTax(scan.getExtractedTax());
            invoice.setPaidAmount(BigDecimal.ZERO);
            invoice.setBalanceDue(totalAmount);
            invoice.setPaymentStatus(Invoice.PaymentStatus.UNPAID);
            invoice.setPaymentMode(Invoice.PaymentMode.CASH);
            invoice.setIsGst(scan.getExtractedTax().compareTo(BigDecimal.ZERO) > 0);
            invoice.setNotes("Created from scanned invoice (Scan ID: " + scanId + ")");

            // Set items if provided
            if (body.get("items") != null) {
                List<Map<String, Object>> itemsData = (List<Map<String, Object>>) body.get("items");
                List<InvoiceItem> items = new ArrayList<>();
                for (Map<String, Object> itemData : itemsData) {
                    InvoiceItem item = new InvoiceItem();
                    item.setInvoice(invoice);
                    item.setProductName(itemData.get("name").toString());
                    item.setQuantity(new BigDecimal(itemData.getOrDefault("quantity", 1).toString()));
                    item.setUnit(itemData.getOrDefault("unit", "PCS").toString());
                    item.setUnitPrice(new BigDecimal(itemData.getOrDefault("price", 0).toString()));
                    item.setTotalPrice(new BigDecimal(itemData.getOrDefault("total", 0).toString()));
                    items.add(item);
                }
                invoice.setItems(items);
            }

            Invoice saved = invoiceRepo.save(invoice);

            // Update scan status
            scan.setScanStatus(ScannedInvoice.ScanStatus.CONVERTED);
            scan.setConvertedInvoiceId(saved.getId());
            scanRepo.save(scan);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("message", "✅ Scan converted to invoice successfully!");
            result.put("invoiceId", saved.getId());
            result.put("invoiceNumber", saved.getInvoiceNumber());
            result.put("totalAmount", saved.getTotalAmount());
            result.put("scanId", scanId);
            return result;

        } catch (Exception e) {
            scan.setScanStatus(ScannedInvoice.ScanStatus.FAILED);
            scan.setErrorMessage(e.getMessage());
            scanRepo.save(scan);

            return Map.of("error", "Failed to convert scan: " + e.getMessage());
        }
    }
}
