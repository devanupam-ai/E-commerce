
package com.billbook.service;

import com.billbook.model.*;
import com.billbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FestivalService {

    private final FestivalRepository festivalRepo;
    private final FestivalAlertRepository alertRepo;
    private final CustomerRepository customerRepo;
    private final InvoiceRepository invoiceRepo;
    private final BbProductRepository productRepo;

    // ========== SEED INDIAN FESTIVALS ==========
    public void seedFestivalsIfEmpty() {
        if (festivalRepo.count() > 0) return;

        int year = LocalDate.now().getYear();
        List<Festival> festivals = new ArrayList<>();

        // Major Indian Festivals 2024-2025
        addFestival(festivals, "Makar Sankranti", "मकर संक्रांति", LocalDate.of(year, 1, 14), "HINDU",
                "Harvest festival celebrated across India", "10%", new BigDecimal("10"),
                "Celebrate Sankranti with special discounts! 🪁", "🪁", 10);

        addFestival(festivals, "Republic Day", "गणतंत्र दिवस", LocalDate.of(year, 1, 26), "NATIONAL",
                "National holiday celebrating the Constitution", "15%", new BigDecimal("15"),
                "Republic Day Sale — Flat discounts on all items! 🇮🇳", "🇮🇳", 10);

        addFestival(festivals, "Vasant Panchami", "वसंत पंचमी", LocalDate.of(year, 2, 14), "HINDU",
                "Festival of knowledge and spring", "10%", new BigDecimal("10"),
                "Vasant Panchami Special — Start the spring with savings! 🌼", "🌼", 10);

        addFestival(festivals, "Maha Shivratri", "महाशिवरात्रि", LocalDate.of(year, 3, 8), "HINDU",
                "Night of Lord Shiva", "12%", new BigDecimal("12"),
                "Maha Shivratri blessings with special offers! 🙏", "🙏", 12);

        addFestival(festivals, "Holi", "होली", LocalDate.of(year, 3, 25), "HINDU",
                "Festival of colors", "15%", new BigDecimal("15"),
                "Holi Dhamaka — Colorful deals for everyone! 🎨", "🎨", 15);

        addFestival(festivals, "Ugadi/Gudi Padwa", "उगादी/गुड़ी पड़वा", LocalDate.of(year, 4, 9), "REGIONAL",
                "New Year in Karnataka, Maharashtra, Andhra", "10%", new BigDecimal("10"),
                "New Year, New Deals — Ugadi/Gudi Padwa specials! 🎉", "🎉", 10);

        addFestival(festivals, "Ramadan Starts", "रमज़ान शुरू", LocalDate.of(year, 3, 11), "MUSLIM",
                "Holy month of fasting begins", "10%", new BigDecimal("10"),
                "Ramadan Mubarak — Special offers for the holy month! 🌙", "🌙", 15);

        addFestival(festivals, "Eid ul-Fitr", "ईद उल-फितर", LocalDate.of(year, 4, 10), "MUSLIM",
                "Festival of breaking the fast", "15%", new BigDecimal("15"),
                "Eid Mubarak — Celebrate with amazing discounts! ✨", "✨", 15);

        addFestival(festivals, "Baisakhi", "बैसाखी", LocalDate.of(year, 4, 13), "SIKH",
                "Sikh New Year and harvest festival", "12%", new BigDecimal("12"),
                "Baisakhi diyan vadhaiyan — Special harvest deals! 🌾", "🌾", 12);

        addFestival(festivals, "Buddha Purnima", "बुद्ध पूर्णिमा", LocalDate.of(year, 5, 23), "BUDDHIST",
                "Birthday of Lord Buddha", "10%", new BigDecimal("10"),
                "Buddha Purnima — Peaceful savings await! ☸️", "☸️", 10);

        addFestival(festivals, "Eid ul-Adha", "ईद उल-अज़हा", LocalDate.of(year, 6, 17), "MUSLIM",
                "Festival of sacrifice", "12%", new BigDecimal("12"),
                "Eid ul-Adha Mubarak — Special festive offers! 🌙", "🌙", 12);

        addFestival(festivals, "Rath Yatra", "रथ यात्रा", LocalDate.of(year, 7, 7), "HINDU",
                "Chariot festival of Lord Jagannath", "10%", new BigDecimal("10"),
                "Rath Yatra Special — Divine deals for you! 🛕", "🛕", 10);

        addFestival(festivals, "Raksha Bandhan", "रक्षाबंधन", LocalDate.of(year, 8, 19), "HINDU",
                "Celebrating brother-sister bond", "15%", new BigDecimal("15"),
                "Rakhi Special — Gift your sibling the best! 🎁", "🎁", 15);

        addFestival(festivals, "Independence Day", "स्वतंत्रता दिवस", LocalDate.of(year, 8, 15), "NATIONAL",
                "India's Independence Day", "15%", new BigDecimal("15"),
                "Azadi Sale — Celebrate freedom with discounts! 🇮🇳", "🇮🇳", 10);

        addFestival(festivals, "Janmashtami", "जन्माष्टमी", LocalDate.of(year, 8, 26), "HINDU",
                "Birthday of Lord Krishna", "10%", new BigDecimal("10"),
                "Janmashtami Special — Makhan-mishri deals! 🦚", "🦚", 12);

        addFestival(festivals, "Ganesh Chaturthi", "गणेश चतुर्थी", LocalDate.of(year, 9, 7), "HINDU",
                "Birthday of Lord Ganesha", "12%", new BigDecimal("12"),
                "Ganpati Bappa Morya — Festive discounts! 🐘", "🐘", 15);

        addFestival(festivals, "Onam", "ओणम", LocalDate.of(year, 9, 15), "REGIONAL",
                "Harvest festival of Kerala", "10%", new BigDecimal("10"),
                "Onashamsakal — Kerala special deals! 🌺", "🌺", 12);

        addFestival(festivals, "Navratri Begins", "नवरात्रि शुरू", LocalDate.of(year, 10, 3), "HINDU",
                "Nine nights of devotion", "15%", new BigDecimal("15"),
                "Navratri Special — 9 days of amazing deals! 🪘", "🪘", 15);

        addFestival(festivals, "Dussehra", "दशहरा", LocalDate.of(year, 10, 12), "HINDU",
                "Victory of good over evil", "15%", new BigDecimal("15"),
                "Dussehra Dhamaka — Win big with discounts! 🏹", "🏹", 15);

        addFestival(festivals, "Karwa Chauth", "करवा चौथ", LocalDate.of(year, 10, 20), "HINDU",
                "Fasting for husband's long life", "10%", new BigDecimal("10"),
                "Karwa Chauth Special — Gift your love! 💕", "💕", 10);

        addFestival(festivals, "Diwali", "दिवाली", LocalDate.of(year, 11, 1), "HINDU",
                "Festival of lights — biggest shopping season", "20%", new BigDecimal("20"),
                "Diwali Dhamaka — Biggest sale of the year! 🪔", "🪔", 20);

        addFestival(festivals, "Bhai Dooj", "भाई दूज", LocalDate.of(year, 11, 3), "HINDU",
                "Celebrating brother-sister bond", "10%", new BigDecimal("10"),
                "Bhai Dooj Special — Gift your brother! 👫", "👫", 10);

        addFestival(festivals, "Chhath Puja", "छठ पूजा", LocalDate.of(year, 11, 7), "HINDU",
                "Sun worship festival of Bihar/Eastern UP", "10%", new BigDecimal("10"),
                "Chhath Puja Special — Surya dev blessings with deals! ☀️", "☀️", 10);

        addFestival(festivals, "Guru Nanak Jayanti", "गुरु नानक जयंती", LocalDate.of(year, 11, 15), "SIKH",
                "Birthday of Guru Nanak", "10%", new BigDecimal("10"),
                "Guru Nanak Jayanti — Sacred savings! 🙏", "🙏", 10);

        addFestival(festivals, "Christmas", "क्रिसमस", LocalDate.of(year, 12, 25), "CHRISTIAN",
                "Celebration of Christmas", "15%", new BigDecimal("15"),
                "Christmas Sale — Ho ho ho, merry savings! 🎄", "🎄", 15);

        addFestival(festivals, "Pongal", "पोंगल", LocalDate.of(year + 1, 1, 14), "REGIONAL",
                "Harvest festival of Tamil Nadu", "10%", new BigDecimal("10"),
                "Pongal Valthukkal — Tamil harvest deals! 🌾", "🌾", 12);

        festivalRepo.saveAll(festivals);
    }

    private void addFestival(List<Festival> list, String name, String nameHindi, LocalDate date,
                             String category, String desc, String discount, BigDecimal discountPct,
                             String msg, String emoji, Integer daysBefore) {
        Festival f = new Festival();
        f.setName(name);
        f.setNameHindi(nameHindi);
        f.setFestivalDate(date);
        f.setCategory(category);
        f.setDescription(desc);
        f.setSuggestedDiscount(discount);
        f.setDiscountPercent(discountPct);
        f.setMarketingMessage(msg);
        f.setEmoji(emoji);
        f.setDaysBeforeAlert(daysBefore);
        list.add(f);
    }

    // ========== GET UPCOMING FESTIVALS ==========
    public List<Map<String, Object>> getUpcomingFestivals(Long userId, int daysAhead) {
        seedFestivalsIfEmpty();
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(daysAhead);

        List<Festival> festivals = festivalRepo.findUpcomingFestivals(today, endDate);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Festival f : festivals) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", f.getId());
            map.put("name", f.getName());
            map.put("nameHindi", f.getNameHindi());
            map.put("festivalDate", f.getFestivalDate());
            map.put("daysAway", ChronoUnit.DAYS.between(today, f.getFestivalDate()));
            map.put("category", f.getCategory());
            map.put("emoji", f.getEmoji());
            map.put("description", f.getDescription());
            map.put("suggestedDiscount", f.getSuggestedDiscount());
            map.put("discountPercent", f.getDiscountPercent());
            map.put("marketingMessage", f.getMarketingMessage());

            // Check if alert already sent
            List<FestivalAlert> existing = alertRepo.findByUserIdAndFestivalId(userId, f.getId());
            map.put("alertSent", !existing.isEmpty());
            map.put("alertStatus", existing.isEmpty() ? "NONE" : existing.get(0).getStatus().name());

            result.add(map);
        }
        return result;
    }

    // ========== GET SMART SUGGESTIONS ==========
    public Map<String, Object> getSmartSuggestions(Long userId) {
        seedFestivalsIfEmpty();
        LocalDate today = LocalDate.now();
        LocalDate next30 = today.plusDays(30);

        List<Festival> upcoming = festivalRepo.findUpcomingFestivals(today, next30);
        List<Map<String, Object>> suggestions = new ArrayList<>();

        for (Festival f : upcoming) {
            long daysAway = ChronoUnit.DAYS.between(today, f.getFestivalDate());
            if (daysAway <= f.getDaysBeforeAlert()) {
                Map<String, Object> s = new LinkedHashMap<>();
                s.put("festivalId", f.getId());
                s.put("festivalName", f.getName());
                s.put("festivalNameHindi", f.getNameHindi());
                s.put("emoji", f.getEmoji());
                s.put("daysAway", daysAway);
                s.put("urgency", daysAway <= 3 ? "HIGH" : daysAway <= 7 ? "MEDIUM" : "LOW");
                s.put("suggestedDiscount", f.getSuggestedDiscount());
                s.put("marketingMessage", f.getMarketingMessage());

                // Top customers to target
                List<Customer> topCustomers = getTopCustomers(userId, 10);
                List<Map<String, Object>> customerList = new ArrayList<>();
                for (Customer c : topCustomers) {
                    Map<String, Object> cm = new LinkedHashMap<>();
                    cm.put("id", c.getId());
                    cm.put("name", c.getName());
                    cm.put("phone", c.getPhone());
                    cm.put("totalPurchases", getTotalPurchases(userId, c.getId()));
                    customerList.add(cm);
                }
                s.put("topCustomers", customerList);

                suggestions.add(s);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("suggestions", suggestions);
        result.put("totalFestivals", suggestions.size());
        result.put("generatedAt", today);
        return result;
    }

    // ========== GENERATE FESTIVAL WHATSAPP MESSAGES ==========
    public Map<String, Object> generateFestivalMessages(Long userId, Long festivalId, List<Long> customerIds) {
        Festival festival = festivalRepo.findById(festivalId).orElseThrow(() -> new RuntimeException("Festival not found"));
        String biz = getBusinessName(userId);

        List<Map<String, Object>> messages = new ArrayList<>();
        int sentCount = 0;

        for (Long custId : customerIds) {
            Customer c = customerRepo.findById(custId).orElse(null);
            if (c == null || c.getPhone() == null || c.getPhone().isEmpty()) continue;

            StringBuilder msg = new StringBuilder();
            msg.append(festival.getEmoji()).append(" *").append(festival.getName()).append(" Special from ").append(biz).append("*\n\n");
            msg.append("Hello ").append(c.getName()).append(",\n\n");
            msg.append(festival.getMarketingMessage()).append("\n\n");

            // Add top products
            List<BbProduct> products = productRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);
            if (!products.isEmpty()) {
                msg.append("━━━━━━━━━━━━━━━━━━━━━\n");
                msg.append("*SPECIAL OFFERS:*\n\n");
                int count = 0;
                for (BbProduct p : products) {
                    if (count >= 5) break;
                    BigDecimal discountedPrice = p.getSellingPrice()
                            .multiply(BigDecimal.ONE.subtract(festival.getDiscountPercent().divide(BigDecimal.valueOf(100))))
                            .setScale(0, RoundingMode.HALF_UP);
                    msg.append("• ").append(p.getName());
                    msg.append(" ~~₹").append(fmt(p.getSellingPrice())).append("~~");
                    msg.append(" → *₹").append(fmt(discountedPrice)).append("*\n");
                    count++;
                }
                msg.append("━━━━━━━━━━━━━━━━━━━━━\n\n");
            }

            msg.append("Hurry! Offer valid till ").append(festival.getFestivalDate()).append("\n\n");
            msg.append("Thank you! 🙏\n");
            msg.append("— ").append(biz);

            String link = waLink(c.getPhone(), msg.toString());
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("customerId", c.getId());
            entry.put("customerName", c.getName());
            entry.put("phone", c.getPhone());
            entry.put("whatsappLink", link);
            entry.put("message", msg.toString());
            messages.add(entry);
            sentCount++;
        }

        // Save alert
        FestivalAlert alert = new FestivalAlert();
        alert.setUser(getUserRef(userId));
        alert.setFestival(festival);
        alert.setStatus(FestivalAlert.AlertStatus.SENT);
        alert.setCustomersTargeted(customerIds.size());
        alert.setMessagesSent(sentCount);
        alert.setAlertedAt(java.time.LocalDateTime.now());
        alertRepo.save(alert);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("festivalName", festival.getName());
        result.put("festivalEmoji", festival.getEmoji());
        result.put("messages", messages);
        result.put("totalCustomers", customerIds.size());
        result.put("messagesGenerated", sentCount);
        return result;
    }

    // ========== GET FESTIVAL ALERT HISTORY ==========
    public List<Map<String, Object>> getAlertHistory(Long userId) {
        List<FestivalAlert> alerts = alertRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (FestivalAlert a : alerts) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", a.getId());
            map.put("festivalName", a.getFestival().getName());
            map.put("festivalEmoji", a.getFestival().getEmoji());
            map.put("status", a.getStatus().name());
            map.put("customersTargeted", a.getCustomersTargeted());
            map.put("messagesSent", a.getMessagesSent());
            map.put("alertedAt", a.getAlertedAt());
            result.add(map);
        }
        return result;
    }

    // ========== HELPERS ==========
    private List<Customer> getTopCustomers(Long userId, int limit) {
        List<Customer> all = customerRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);
        // Simple: return first N active customers with phone
        return all.stream()
                .filter(c -> c.getPhone() != null && !c.getPhone().isEmpty())
                .limit(limit)
                .toList();
    }

    private BigDecimal getTotalPurchases(Long userId, Long customerId) {
        return invoiceRepo.findByUserIdAndCustomerIdOrderByCreatedAtDesc(userId, customerId)
                .stream()
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String getBusinessName(Long userId) {
        return "BillBook"; // Simplified - can be enhanced with user repo
    }

    private BbUser getUserRef(Long userId) {
        BbUser u = new BbUser();
        u.setId(userId);
        return u;
    }

    private String waLink(String phone, String message) {
        if (phone == null || phone.trim().isEmpty()) return "";
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        if (cleanPhone.length() == 10) cleanPhone = "91" + cleanPhone;
        return "https://wa.me/" + cleanPhone + "?text=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
    }

    private String fmt(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    // ========== SEND FESTIVAL GREETINGS ==========
    public Map<String, Object> sendFestivalGreetings(Long userId, Long festivalId, String customMessage, List<Long> customerIds, BigDecimal discountOverride) {
        Festival festival = festivalRepo.findById(festivalId).orElseThrow(() -> new RuntimeException("Festival not found"));
        String biz = getBusinessName(userId);

        // If no customer IDs provided, get top customers
        if (customerIds == null || customerIds.isEmpty()) {
            customerIds = getTopCustomers(userId, 10).stream().map(Customer::getId).toList();
        }

        BigDecimal discountPct = discountOverride != null ? discountOverride : festival.getDiscountPercent();

        List<Map<String, Object>> messages = new ArrayList<>();
        int sentCount = 0;

        for (Long custId : customerIds) {
            Customer c = customerRepo.findById(custId).orElse(null);
            if (c == null || c.getPhone() == null || c.getPhone().isEmpty()) continue;

            StringBuilder msg = new StringBuilder();
            msg.append(festival.getEmoji()).append(" *").append(festival.getName()).append(" Special from ").append(biz).append("*\n\n");
            msg.append("Hello ").append(c.getName()).append(",\n\n");

            if (customMessage != null && !customMessage.isEmpty()) {
                msg.append(customMessage).append("\n\n");
            } else {
                msg.append(festival.getMarketingMessage()).append("\n\n");
            }

            // Add top products with discount
            List<BbProduct> products = productRepo.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);
            if (!products.isEmpty()) {
                msg.append("━━━━━━━━━━━━━━━━━━━━━\n");
                msg.append("*SPECIAL OFFERS: *\n\n");
                int count = 0;
                for (BbProduct p : products) {
                    if (count >= 5) break;
                    if (p.getSellingPrice() != null) {
                        BigDecimal discountedPrice = p.getSellingPrice()
                                .multiply(BigDecimal.ONE.subtract(discountPct.divide(BigDecimal.valueOf(100))))
                                .setScale(0, RoundingMode.HALF_UP);
                        msg.append("• ").append(p.getName());
                        msg.append(" ~~₹").append(fmt(p.getSellingPrice())).append("~~");
                        msg.append(" → *₹").append(fmt(discountedPrice)).append("*\n");
                        count++;
                    }
                }
                msg.append("━━━━━━━━━━━━━━━━━━━━━\n\n");
            }

            msg.append("Hurry! Offer valid till ").append(festival.getFestivalDate()).append("\n\n");
            msg.append("Thank you! 🙏\n");
            msg.append("— ").append(biz);

            String link = waLink(c.getPhone(), msg.toString());
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("customerId", c.getId());
            entry.put("customerName", c.getName());
            entry.put("phone", c.getPhone());
            entry.put("whatsappLink", link);
            entry.put("message", msg.toString());
            messages.add(entry);
            sentCount++;
        }

        // Save alert
        FestivalAlert alert = new FestivalAlert();
        alert.setUser(getUserRef(userId));
        alert.setFestival(festival);
        alert.setStatus(FestivalAlert.AlertStatus.SENT);
        alert.setCustomersTargeted(customerIds.size());
        alert.setMessagesSent(sentCount);
        alert.setAlertedAt(java.time.LocalDateTime.now());
        alertRepo.save(alert);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("festivalName", festival.getName());
        result.put("festivalEmoji", festival.getEmoji());
        result.put("discountApplied", discountPct + "%");
        result.put("messages", messages);
        result.put("totalCustomers", customerIds.size());
        result.put("messagesGenerated", sentCount);
        return result;
    }

    // ========== DISMISS ALERT ==========
    public Map<String, Object> dismissAlert(Long userId, Long festivalId) {
        List<FestivalAlert> alerts = alertRepo.findByUserIdAndFestivalId(userId, festivalId);
        if (alerts.isEmpty()) {
            // Create a dismissed alert
            Festival festival = festivalRepo.findById(festivalId).orElseThrow(() -> new RuntimeException("Festival not found"));
            FestivalAlert alert = new FestivalAlert();
            alert.setUser(getUserRef(userId));
            alert.setFestival(festival);
            alert.setStatus(FestivalAlert.AlertStatus.DISMISSED);
            alert.setCustomersTargeted(0);
            alert.setMessagesSent(0);
            alertRepo.save(alert);
        } else {
            for (FestivalAlert a : alerts) {
                a.setStatus(FestivalAlert.AlertStatus.DISMISSED);
                alertRepo.save(a);
            }
        }
        return Map.of("message", "Alert dismissed", "festivalId", festivalId);
    }
}
