
package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "feedbacks")
public class Feedback {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "user_id")
    private User user;
    @Enumerated(EnumType.STRING)
    private FeedbackType type = FeedbackType.SUGGESTION;
    @Column(columnDefinition = "TEXT")
    private String message;
    private LocalDateTime createdAt = LocalDateTime.now();
    public enum FeedbackType { SUGGESTION, COMPLAINT, OTHER }
}
