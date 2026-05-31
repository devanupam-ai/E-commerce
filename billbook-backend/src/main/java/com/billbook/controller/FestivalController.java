
package com.billbook.controller;

import com.billbook.model.BbUser;
import com.billbook.model.Festival;
import com.billbook.repository.FestivalRepository;
import com.billbook.service.FestivalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/bb/festivals")
@RequiredArgsConstructor
public class FestivalController {

    private final FestivalService festivalService;
    private final FestivalRepository festivalRepo;

    // ========== GET UPCOMING FESTIVALS ==========
    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingFestivals(
            @AuthenticationPrincipal BbUser user,
            @RequestParam(defaultValue = "90") int daysAhead) {
        List<Map<String, Object>> festivals = festivalService.getUpcomingFestivals(user.getId(), daysAhead);
        return ResponseEntity.ok(Map.of("festivals", festivals, "total", festivals.size()));
    }

    // ========== GET SMART SUGGESTIONS ==========
    @GetMapping("/suggestions")
    public ResponseEntity<?> getSmartSuggestions(@AuthenticationPrincipal BbUser user) {
        Map<String, Object> suggestions = festivalService.getSmartSuggestions(user.getId());
        return ResponseEntity.ok(suggestions);
    }

    // ========== SEND FESTIVAL GREETINGS (BULK WHATSAPP) ==========
    @PostMapping("/send-greetings/{festivalId}")
    public ResponseEntity<?> sendFestivalGreetings(
            @AuthenticationPrincipal BbUser user,
            @PathVariable Long festivalId,
            @RequestBody(required = false) Map<String, Object> body) {

        String customMessage = body != null ? (String) body.get("customMessage") : null;
        List<Long> customerIds = body != null ? (List<Long>) body.get("customerIds") : null;
        BigDecimal discountOverride = body != null && body.get("discountPercent") != null
                ? new BigDecimal(body.get("discountPercent").toString()) : null;

        Map<String, Object> result = festivalService.sendFestivalGreetings(user.getId(), festivalId, customMessage, customerIds, discountOverride);
        return ResponseEntity.ok(result);
    }

    // ========== GET FESTIVAL ALERT HISTORY ==========
    @GetMapping("/alerts")
    public ResponseEntity<?> getAlertHistory(@AuthenticationPrincipal BbUser user) {
        List<Map<String, Object>> alerts = festivalService.getAlertHistory(user.getId());
        return ResponseEntity.ok(Map.of("alerts", alerts));
    }

    // ========== GET ALL FESTIVALS (MANAGE) ==========
    @GetMapping("/all")
    public ResponseEntity<?> getAllFestivals() {
        festivalService.seedFestivalsIfEmpty();
        List<Festival> festivals = festivalRepo.findByIsActiveTrueOrderByFestivalDateAsc();
        return ResponseEntity.ok(Map.of("festivals", festivals));
    }

    // ========== ADD CUSTOM FESTIVAL ==========
    @PostMapping("/add")
    public ResponseEntity<?> addCustomFestival(@AuthenticationPrincipal BbUser user, @RequestBody Map<String, String> body) {
        Festival festival = new Festival();
        festival.setName(body.get("name"));
        festival.setNameHindi(body.getOrDefault("nameHindi", body.get("name")));
        festival.setFestivalDate(LocalDate.parse(body.get("festivalDate")));
        festival.setCategory(body.getOrDefault("category", "REGIONAL"));
        festival.setDescription(body.getOrDefault("description", ""));
        festival.setSuggestedDiscount(body.getOrDefault("suggestedDiscount", "10%"));
        festival.setDiscountPercent(new BigDecimal(body.getOrDefault("discountPercent", "10")));
        festival.setMarketingMessage(body.getOrDefault("marketingMessage", "Special festive offers!"));
        festival.setEmoji(body.getOrDefault("emoji", "🎉"));
        festival.setDaysBeforeAlert(Integer.parseInt(body.getOrDefault("daysBeforeAlert", "15")));
        festivalRepo.save(festival);
        return ResponseEntity.ok(Map.of("message", "Festival added successfully", "festival", festival));
    }

    // ========== DISMISS FESTIVAL ALERT ==========
    @PutMapping("/dismiss/{festivalId}")
    public ResponseEntity<?> dismissAlert(@AuthenticationPrincipal BbUser user, @PathVariable Long festivalId) {
        Map<String, Object> result = festivalService.dismissAlert(user.getId(), festivalId);
        return ResponseEntity.ok(result);
    }
}
