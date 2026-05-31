
package com.billbook.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "bb_user_themes")
public class UserTheme {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    private BbUser user;
    private String themeMode = "LIGHT"; // LIGHT, DARK
    private String primaryColor = "#6C3CE1";
    private String accentColor = "#818CF8";
    private String sidebarStyle = "DEFAULT"; // DEFAULT, COMPACT, MINI
    private String fontSize = "MEDIUM"; // SMALL, MEDIUM, LARGE
    private String borderRadius = "12"; // 0, 8, 12, 16, 24
    private String fontFamily = "DEFAULT"; // DEFAULT, INTER, ROBOTO, POPPINS
    private String dashboardLayout = "DEFAULT"; // JSON string for widget positions
    private LocalDateTime updatedAt = LocalDateTime.now();
}
