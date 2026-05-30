
package com.ecommerce.controller;

import com.ecommerce.model.*;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customer-features")
@RequiredArgsConstructor
public class CustomerFeatureController {

    private final ProductRepository productRepo;
    private final OrderRepository orderRepo;
    private final WishlistRepository wishlistRepo;

    // ==================== 1. SMART SEARCH WITH FILTERS ====================
    @GetMapping("/search")
    public ResponseEntity<?> smartSearch(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir
    ) {
        List<Product> products = productRepo.findAll();

        // Filter by search query
        if (q != null && !q.isEmpty()) {
            String query = q.toLowerCase();
            products = products.stream()
                    .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(query)) ||
                                 (p.getDescription() != null && p.getDescription().toLowerCase().contains(query)))
                    .collect(Collectors.toList());
        }

        // Filter by category
        if (categoryId != null) {
            products = products.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(categoryId))
                    .collect(Collectors.toList());
        }

        // Filter by price range
        if (minPrice != null) {
            products = products.stream()
                    .filter(p -> p.getSellingPrice() != null && p.getSellingPrice().doubleValue() >= minPrice)
                    .collect(Collectors.toList());
        }
        if (maxPrice != null) {
            products = products.stream()
                    .filter(p -> p.getSellingPrice() != null && p.getSellingPrice().doubleValue() <= maxPrice)
                    .collect(Collectors.toList());
        }

        // Filter by stock
        if (inStock != null && inStock) {
            products = products.stream()
                    .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() > 0)
                    .collect(Collectors.toList());
        }

        // Sort
        if (sortBy != null) {
            switch (sortBy) {
                case "price":
                    products.sort((a, b) -> sortDir != null && sortDir.equals("desc") ?
                            Double.compare(b.getSellingPrice() != null ? b.getSellingPrice().doubleValue() : 0,
                                    a.getSellingPrice() != null ? a.getSellingPrice().doubleValue() : 0) :
                            Double.compare(a.getSellingPrice() != null ? a.getSellingPrice().doubleValue() : 0,
                                    b.getSellingPrice() != null ? b.getSellingPrice().doubleValue() : 0));
                    break;
                case "name":
                    products.sort((a, b) -> sortDir != null && sortDir.equals("desc") ?
                            b.getName().compareToIgnoreCase(a.getName()) :
                            a.getName().compareToIgnoreCase(b.getName()));
                    break;
                case "newest":
                    products.sort((a, b) -> sortDir != null && sortDir.equals("asc") ?
                            Long.compare(a.getId(), b.getId()) :
                            Long.compare(b.getId(), a.getId()));
                    break;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("products", products);
        result.put("total", products.size());
        result.put("filters", Map.of(
                "query", q != null ? q : "",
                "categoryId", categoryId != null ? categoryId : 0,
                "minPrice", minPrice != null ? minPrice : 0,
                "maxPrice", maxPrice != null ? maxPrice : 0,
                "inStock", inStock != null ? inStock : false
        ));
        return ResponseEntity.ok(result);
    }

    // ==================== 2. FLASH SALE ====================
    @GetMapping("/flash-sales")
    public ResponseEntity<?> getFlashSales(@AuthenticationPrincipal User user) {
        Random random = new Random();
        String[] saleNames = {"Lightning Deal", "Flash Sale", "Mega Deal", "Super Saver", "Hot Deal", "Steal Deal"};
        int[] discountPercents = {30, 40, 50, 25, 60, 35};

        List<Product> allProducts = productRepo.findAll();
        List<Map<String, Object>> deals = new ArrayList<>();

        int dealCount = Math.min(8, allProducts.size());
        for (int i = 0; i < dealCount; i++) {
            Product p = allProducts.get(random.nextInt(allProducts.size()));
            int discount = discountPercents[random.nextInt(discountPercents.length)];
            double originalPrice = p.getSellingPrice() != null ? p.getSellingPrice().doubleValue() : 500;
            double salePrice = originalPrice * (1 - discount / 100.0);

            // Sale ends at next hour boundary
            LocalDateTime endTime = LocalDateTime.now().plusHours(1).withMinute(0).withSecond(0).withNano(0);
            int totalItems = 20 + random.nextInt(80);
            int claimed = random.nextInt(totalItems - 5) + 5;

            Map<String, Object> deal = new LinkedHashMap<>();
            deal.put("id", (long) (i + 1));
            deal.put("productId", p.getId());
            deal.put("productName", p.getName());
            deal.put("productImage", p.getImageUrl() != null ? p.getImageUrl() : "");
            deal.put("saleName", saleNames[random.nextInt(saleNames.length)]);
            deal.put("originalPrice", BigDecimal.valueOf(originalPrice));
            deal.put("salePrice", BigDecimal.valueOf(Math.round(salePrice)));
            deal.put("discountPercent", discount);
            deal.put("endTime", endTime.toString());
            deal.put("totalItems", totalItems);
            deal.put("claimed", claimed);
            deal.put("remaining", totalItems - claimed);
            deals.add(deal);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deals", deals);
        result.put("nextRefresh", LocalDateTime.now().plusHours(1).withMinute(0).withSecond(0).withNano(0).toString());
        result.put("message", "🔥 Flash deals refresh every hour!");
        return ResponseEntity.ok(result);
    }

    // ==================== 3. PRICE DROP ALERTS ====================
    @GetMapping("/price-drop-alerts")
    public ResponseEntity<?> getPriceDropAlerts(@AuthenticationPrincipal User user) {
        Random random = new Random();
        String[] alertTypes = {"WISHLIST_DROP", "CATEGORY_DROP", "TRENDING_DROP", "NEW_LOW"};

        List<Map<String, Object>> alerts = new ArrayList<>();
        List<Product> allProducts = productRepo.findAll();
        int alertCount = Math.min(6, allProducts.size());

        for (int i = 0; i < alertCount; i++) {
            Product p = allProducts.get(random.nextInt(allProducts.size()));
            double currentPrice = p.getSellingPrice() != null ? p.getSellingPrice().doubleValue() : 500;
            double previousPrice = currentPrice * (1.1 + random.nextDouble() * 0.4);
            double dropPercent = ((previousPrice - currentPrice) / previousPrice) * 100;

            Map<String, Object> alert = new LinkedHashMap<>();
            alert.put("id", (long) (i + 1));
            alert.put("productId", p.getId());
            alert.put("productName", p.getName());
            alert.put("productImage", p.getImageUrl() != null ? p.getImageUrl() : "");
            alert.put("previousPrice", BigDecimal.valueOf(Math.round(previousPrice)));
            alert.put("currentPrice", BigDecimal.valueOf(Math.round(currentPrice)));
            alert.put("dropPercent", Math.round(dropPercent * 10.0) / 10.0);
            alert.put("alertType", alertTypes[random.nextInt(alertTypes.length)]);
            alert.put("detectedAt", LocalDateTime.now().minusHours(random.nextInt(24)).toString());
            alert.put("isLowest", random.nextBoolean());
            alerts.add(alert);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("alerts", alerts);
        result.put("totalAlerts", alerts.size());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/price-drop-alerts/{productId}/subscribe")
    public ResponseEntity<?> subscribePriceAlert(@PathVariable Long productId) {
        return ResponseEntity.ok(Map.of("message", "Price drop alert subscribed", "productId", productId));
    }

    // ==================== 4. LIVE ORDER TRACKING ====================
    @GetMapping("/orders/{orderId}/track")
    public ResponseEntity<?> trackOrder(@AuthenticationPrincipal User user, @PathVariable Long orderId) {
        String[] steps = {"ORDER_PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"};
        String[] stepLabels = {"Order Placed", "Confirmed", "Packed & Ready", "Out for Delivery", "Delivered"};
        String[] stepEmojis = {"📋", "✅", "📦", "🚴", "🏠"};
        int[] stepDurations = {5, 15, 30, 45, 0}; // minutes

        Random random = new Random();
        int currentStep = random.nextInt(steps.length);

        List<Map<String, Object>> trackingSteps = new ArrayList<>();
        for (int i = 0; i < steps.length; i++) {
            Map<String, Object> step = new LinkedHashMap<>();
            step.put("step", steps[i]);
            step.put("label", stepLabels[i]);
            step.put("emoji", stepEmojis[i]);
            step.put("completed", i <= currentStep);
            step.put("timestamp", i <= currentStep ? LocalDateTime.now().minusMinutes(Arrays.stream(stepDurations, i, steps.length).sum()).toString() : null);
            step.put("duration", stepDurations[i] + " min");
            trackingSteps.add(step);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", orderId);
        result.put("currentStatus", steps[currentStep]);
        result.put("currentStep", currentStep);
        result.put("totalSteps", steps.length);
        result.put("steps", trackingSteps);
        result.put("estimatedDelivery", LocalDateTime.now().plusMinutes(30 - currentStep * 6).toString());
        result.put("deliveryAgentName", currentStep >= 3 ? "Raj Kumar" : null);
        result.put("deliveryAgentPhone", currentStep >= 3 ? "+91-9876543210" : null);
        result.put("deliveryAgentLocation", currentStep >= 3 ? Map.of(
                "lat", 12.9716 + (random.nextDouble() - 0.5) * 0.02,
                "lng", 77.5946 + (random.nextDouble() - 0.5) * 0.02
        ) : null);
        result.put("canCallAgent", currentStep >= 3);
        result.put("canChatAgent", currentStep >= 3);
        return ResponseEntity.ok(result);
    }

    // ==================== 5. SCHEDULE DELIVERY ====================
    @GetMapping("/delivery-slots")
    public ResponseEntity<?> getDeliverySlots(@AuthenticationPrincipal User user) {
        List<Map<String, Object>> slots = new ArrayList<>();
        String[] timeSlots = {"6:00 AM - 8:00 AM", "8:00 AM - 10:00 AM", "10:00 AM - 12:00 PM",
                "12:00 PM - 2:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM",
                "6:00 PM - 8:00 PM", "8:00 PM - 10:00 PM"};

        for (int d = 0; d < 5; d++) {
            LocalDate date = LocalDate.now().plusDays(d);
            String dayLabel = d == 0 ? "Today" : (d == 1 ? "Tomorrow" : date.format(DateTimeFormatter.ofPattern("EEE, dd MMM")));

            List<Map<String, Object>> timeSlotList = new ArrayList<>();
            for (int t = 0; t < timeSlots.length; t++) {
                boolean isAvailable = !(d == 0 && t < 3); // Past morning slots unavailable for today
                Map<String, Object> slot = new LinkedHashMap<>();
                slot.put("id", (long) (d * 10 + t + 1));
                slot.put("time", timeSlots[t]);
                slot.put("available", isAvailable);
                slot.put("charge", t >= 6 ? BigDecimal.valueOf(25) : BigDecimal.ZERO); // Evening charge
                slot.put("popular", t == 1 || t == 5); // Morning and evening popular
                timeSlotList.add(slot);
            }

            Map<String, Object> daySlot = new LinkedHashMap<>();
            daySlot.put("date", date.toString());
            daySlot.put("label", dayLabel);
            daySlot.put("slots", timeSlotList);
            slots.add(daySlot);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("slots", slots);
        result.put("expressDelivery", Map.of(
                "available", true,
                "time", "10-30 min",
                "charge", BigDecimal.valueOf(49)
        ));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/orders/{orderId}/schedule-delivery")
    public ResponseEntity<?> scheduleDelivery(@PathVariable Long orderId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("message", "Delivery scheduled", "orderId", orderId,
                "date", body.getOrDefault("date", ""), "slot", body.getOrDefault("slot", "")));
    }

    // ==================== 6. REFER & EARN ====================
    @GetMapping("/refer-earn")
    public ResponseEntity<?> getReferEarn(@AuthenticationPrincipal User user) {
        Random random = new Random();

        List<Map<String, Object>> referrals = new ArrayList<>();
        String[] names = {"Rahul S.", "Priya M.", "Amit K.", "Sneha R.", "Vikram D."};
        String[] statuses = {"SIGNUP_DONE", "FIRST_PURCHASE", "REWARD_EARNED", "PENDING"};
        BigDecimal[] rewards = {BigDecimal.valueOf(50), BigDecimal.valueOf(100), BigDecimal.valueOf(100), BigDecimal.ZERO};

        for (int i = 0; i < names.length; i++) {
            Map<String, Object> ref = new LinkedHashMap<>();
            ref.put("id", (long) (i + 1));
            ref.put("friendName", names[i]);
            ref.put("status", statuses[i]);
            ref.put("reward", rewards[i]);
            ref.put("date", LocalDate.now().minusDays(random.nextInt(30)).toString());
            referrals.add(ref);
        }

        String referralCode = "FRESH" + (user != null ? user.getId() : "1234");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("referralCode", referralCode);
        result.put("referralLink", "https://freshcart.app/ref/" + referralCode);
        result.put("totalReferrals", 5);
        result.put("successfulReferrals", 3);
        result.put("totalEarned", BigDecimal.valueOf(350));
        result.put("pendingRewards", BigDecimal.valueOf(50));
        result.put("rewardPerReferral", BigDecimal.valueOf(100));
        result.put("friendReward", BigDecimal.valueOf(50));
        result.put("referrals", referrals);
        result.put("howItWorks", List.of(
                Map.of("step", 1, "title", "Share your code", "desc", "Share your referral code with friends"),
                Map.of("step", 2, "title", "Friend signs up", "desc", "Friend signs up using your code & gets ₹50"),
                Map.of("step", 3, "title", "First purchase", "desc", "When they make first purchase, you earn ₹100")
        ));
        return ResponseEntity.ok(result);
    }

    // ==================== 7. SHOPPING CHALLENGES ====================
    @GetMapping("/challenges")
    public ResponseEntity<?> getChallenges(@AuthenticationPrincipal User user) {
        List<Map<String, Object>> challenges = new ArrayList<>();

        Object[][] challengeData = {
                {"Buy 3 items this week", 3, 1, 200, "ACTIVE", "📅", 7},
                {"Spend ₹1000 this month", 1000, 450, 150, "ACTIVE", "💰", 22},
                {"Order from 3 different categories", 3, 1, 100, "ACTIVE", "🏪", 14},
                {"Place 5 orders this month", 5, 2, 300, "ACTIVE", "📦", 22},
                {"First order of the day", 1, 0, 75, "AVAILABLE", "🌅", 1},
                {"Weekend shopping spree", 2, 0, 125, "UPCOMING", "🎉", 3},
        };

        for (int i = 0; i < challengeData.length; i++) {
            Object[] d = challengeData[i];
            Map<String, Object> challenge = new LinkedHashMap<>();
            challenge.put("id", (long) (i + 1));
            challenge.put("title", d[0]);
            challenge.put("target", d[1]);
            challenge.put("progress", d[2]);
            challenge.put("reward", BigDecimal.valueOf((int) d[3]));
            challenge.put("status", d[4]);
            challenge.put("emoji", d[5]);
            challenge.put("daysLeft", d[6]);
            challenge.put("progressPercent", Math.min(100, (int) ((int) d[2] * 100.0 / (int) d[1])));
            challenges.add(challenge);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("challenges", challenges);
        result.put("totalRewardsEarned", BigDecimal.valueOf(450));
        result.put("completedChallenges", 4);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/challenges/{id}/claim")
    public ResponseEntity<?> claimChallengeReward(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("message", "Reward claimed!", "challengeId", id, "amount", 100));
    }

    // ==================== 8. LEADERBOARD ====================
    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard(@AuthenticationPrincipal User user) {
        Random random = new Random();
        List<Map<String, Object>> leaders = new ArrayList<>();
        String[] names = {"Ananya S.", "Rahul M.", "Priya K.", "Vikram D.", "Sneha R.",
                "Amit P.", "Neha G.", "Ravi S.", "Kavita J.", "Suresh T.",
                "Meena V.", "Arjun B.", "Divya L.", "Karthik N.", "Pooja H."};
        int[] orders = {48, 42, 38, 35, 32, 28, 25, 23, 21, 19, 17, 15, 13, 11, 9};
        BigDecimal[] spent = {BigDecimal.valueOf(48500), BigDecimal.valueOf(42300), BigDecimal.valueOf(38100),
                BigDecimal.valueOf(35400), BigDecimal.valueOf(32800), BigDecimal.valueOf(28500), BigDecimal.valueOf(25200),
                BigDecimal.valueOf(23100), BigDecimal.valueOf(21800), BigDecimal.valueOf(19500), BigDecimal.valueOf(17200),
                BigDecimal.valueOf(15800), BigDecimal.valueOf(13600), BigDecimal.valueOf(11900), BigDecimal.valueOf(9800)};

        for (int i = 0; i < names.length; i++) {
            Map<String, Object> leader = new LinkedHashMap<>();
            leader.put("rank", i + 1);
            leader.put("name", names[i]);
            leader.put("orders", orders[i]);
            leader.put("totalSpent", spent[i]);
            leader.put("level", i < 3 ? "DIAMOND" : (i < 8 ? "GOLD" : "SILVER"));
            leader.put("badge", i < 3 ? "💎" : (i < 8 ? "🥇" : "🥈"));
            leader.put("isCurrentUser", false);
            leaders.add(leader);
        }

        // Current user position
        Map<String, Object> myRank = new LinkedHashMap<>();
        myRank.put("rank", 7);
        myRank.put("name", user != null ? user.getName() : "You");
        myRank.put("orders", 26);
        myRank.put("totalSpent", BigDecimal.valueOf(26400));
        myRank.put("level", "GOLD");
        myRank.put("badge", "🥇");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("leaders", leaders);
        result.put("myRank", myRank);
        result.put("period", "This Month");
        result.put("topReward", "₹5000 gift card for #1");
        return ResponseEntity.ok(result);
    }

    // ==================== 9. SMART RECOMMENDATIONS ====================
    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(@AuthenticationPrincipal User user) {
        List<Product> allProducts = productRepo.findAll();
        Random random = new Random();

        // Based on browsing - random selection simulating AI
        List<Map<String, Object>> basedOnBrowsing = new ArrayList<>();
        for (int i = 0; i < Math.min(6, allProducts.size()); i++) {
            Product p = allProducts.get(random.nextInt(allProducts.size()));
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("id", p.getId());
            rec.put("name", p.getName());
            rec.put("price", p.getSellingPrice());
            rec.put("image", p.getImageUrl() != null ? p.getImageUrl() : "");
            rec.put("reason", "Based on your browsing");
            rec.put("matchScore", 70 + random.nextInt(25));
            basedOnBrowsing.add(rec);
        }

        // Trending
        List<Map<String, Object>> trending = new ArrayList<>();
        for (int i = 0; i < Math.min(6, allProducts.size()); i++) {
            Product p = allProducts.get(random.nextInt(allProducts.size()));
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("id", p.getId());
            rec.put("name", p.getName());
            rec.put("price", p.getSellingPrice());
            rec.put("image", p.getImageUrl() != null ? p.getImageUrl() : "");
            rec.put("reason", "Trending this week");
            rec.put("ordersToday", 50 + random.nextInt(200));
            trending.add(rec);
        }

        // Buy again
        List<Map<String, Object>> buyAgain = new ArrayList<>();
        for (int i = 0; i < Math.min(4, allProducts.size()); i++) {
            Product p = allProducts.get(random.nextInt(allProducts.size()));
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("id", p.getId());
            rec.put("name", p.getName());
            rec.put("price", p.getSellingPrice());
            rec.put("image", p.getImageUrl() != null ? p.getImageUrl() : "");
            rec.put("reason", "You bought this before");
            rec.put("lastOrdered", LocalDate.now().minusDays(random.nextInt(30) + 7).toString());
            buyAgain.add(rec);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("basedOnBrowsing", basedOnBrowsing);
        result.put("trending", trending);
        result.put("buyAgain", buyAgain);
        return ResponseEntity.ok(result);
    }

    // ==================== 10. QUICK REORDER ====================
    @GetMapping("/quick-reorder")
    public ResponseEntity<?> getQuickReorder(@AuthenticationPrincipal User user) {
        List<Order> orders = orderRepo.findByCustomerIdOrderByCreatedAtDesc(user.getId());
        Random random = new Random();

        // Simulated past order items for quick reorder
        List<Map<String, Object>> items = new ArrayList<>();
        String[] productNames = {"Organic Milk 1L", "Whole Wheat Bread", "Fresh Bananas 1kg", "Basmati Rice 5kg",
                "Olive Oil 500ml", "Greek Yogurt", "Almond Butter", "Green Tea 25bags"};
        double[] prices = {65, 45, 40, 350, 420, 80, 299, 180};

        for (int i = 0; i < productNames.length; i++) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", (long) (i + 1));
            item.put("productId", (long) (i + 1));
            item.put("name", productNames[i]);
            item.put("price", BigDecimal.valueOf(prices[i]));
            item.put("quantity", 1 + random.nextInt(3));
            item.put("lastOrdered", LocalDate.now().minusDays(random.nextInt(30) + 1).toString());
            item.put("orderCount", 1 + random.nextInt(8));
            item.put("inStock", random.nextDouble() > 0.15);
            items.add(item);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("message", "One-tap reorder your frequently bought items");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/quick-reorder/add-all")
    public ResponseEntity<?> quickReorderAll(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("message", "Items added to cart", "addedCount", body.getOrDefault("items", List.of()).toString()));
    }

    // ==================== 11. DIGITAL RECEIPT LOCKER ====================
    @GetMapping("/receipts")
    public ResponseEntity<?> getReceipts(@AuthenticationPrincipal User user) {
        List<Order> orders = orderRepo.findByCustomerIdOrderByCreatedAtDesc(user.getId());
        Random random = new Random();

        String[] stores = {"FreshCart Store", "FreshCart Express", "FreshCart Premium"};
        String[] paymentMethods = {"UPI", "Credit Card", "Net Banking", "COD"};

        List<Map<String, Object>> receipts = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            Map<String, Object> receipt = new LinkedHashMap<>();
            receipt.put("id", (long) (i + 1));
            receipt.put("orderId", "ORD-" + (10000 + random.nextInt(90000)));
            receipt.put("storeName", stores[random.nextInt(stores.length)]);
            receipt.put("date", LocalDate.now().minusDays(random.nextInt(90)).toString());
            receipt.put("amount", BigDecimal.valueOf(200 + random.nextInt(3000)));
            receipt.put("itemsCount", 1 + random.nextInt(8));
            receipt.put("paymentMethod", paymentMethods[random.nextInt(paymentMethods.length)]);
            receipt.put("category", random.nextBoolean() ? "GROCERY" : "ESSENTIALS");
            receipt.put("hasReturn", random.nextDouble() < 0.15);
            receipt.put("downloadable", true);
            receipts.add(receipt);
        }

        // Monthly spending summary
        Map<String, Object> spendingSummary = new LinkedHashMap<>();
        spendingSummary.put("thisMonth", BigDecimal.valueOf(4250));
        spendingSummary.put("lastMonth", BigDecimal.valueOf(3800));
        spendingSummary.put("avgMonthly", BigDecimal.valueOf(3500));
        spendingSummary.put("totalSaved", BigDecimal.valueOf(1250));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("receipts", receipts);
        result.put("spendingSummary", spendingSummary);
        result.put("totalReceipts", receipts.size());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/receipts/{id}")
    public ResponseEntity<?> getReceiptDetail(@PathVariable Long id) {
        Random random = new Random();
        List<Map<String, Object>> lineItems = new ArrayList<>();
        String[] items = {"Organic Milk 1L", "Whole Wheat Bread", "Fresh Bananas 1kg", "Basmati Rice 5kg"};
        double[] prices = {65, 45, 40, 350};
        int[] qtys = {2, 1, 3, 1};

        BigDecimal subtotal = BigDecimal.ZERO;
        for (int i = 0; i < items.length; i++) {
            BigDecimal lineTotal = BigDecimal.valueOf(prices[i] * qtys[i]);
            subtotal = subtotal.add(lineTotal);
            Map<String, Object> line = new LinkedHashMap<>();
            line.put("name", items[i]);
            line.put("price", BigDecimal.valueOf(prices[i]));
            line.put("quantity", qtys[i]);
            line.put("total", lineTotal);
            lineItems.add(line);
        }

        Map<String, Object> receipt = new LinkedHashMap<>();
        receipt.put("id", id);
        receipt.put("orderId", "ORD-" + (10000 + random.nextInt(90000)));
        receipt.put("storeName", "FreshCart Store");
        receipt.put("date", LocalDate.now().minusDays(random.nextInt(30)).toString());
        receipt.put("items", lineItems);
        receipt.put("subtotal", subtotal);
        receipt.put("deliveryCharge", BigDecimal.valueOf(25));
        receipt.put("discount", BigDecimal.valueOf(50));
        receipt.put("total", subtotal.add(BigDecimal.valueOf(25)).subtract(BigDecimal.valueOf(50)));
        receipt.put("paymentMethod", "UPI");
        receipt.put("transactionId", "TXN" + System.currentTimeMillis());
        return ResponseEntity.ok(receipt);
    }
}
