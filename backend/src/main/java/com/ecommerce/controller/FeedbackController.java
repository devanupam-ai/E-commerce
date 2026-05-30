
package com.ecommerce.controller;

import com.ecommerce.model.Feedback;
import com.ecommerce.model.User;
import com.ecommerce.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/feedback") @RequiredArgsConstructor
public class FeedbackController {
    private final FeedbackRepository feedbackRepository;

    @PostMapping
    public ResponseEntity<?> submitFeedback(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        String type = body.getOrDefault("type", "SUGGESTION").toUpperCase();
        String message = body.get("message");
        if (message == null || message.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Feedback message is required"));
        Feedback feedback = new Feedback();
        feedback.setUser(user);
        try { feedback.setType(Feedback.FeedbackType.valueOf(type)); } catch (IllegalArgumentException e) { feedback.setType(Feedback.FeedbackType.OTHER); }
        feedback.setMessage(message);
        feedbackRepository.save(feedback);
        return ResponseEntity.ok(Map.of("message", "Feedback submitted successfully", "id", feedback.getId()));
    }

    @GetMapping
    public ResponseEntity<List<Feedback>> getMyFeedbacks(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(feedbackRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }
}
