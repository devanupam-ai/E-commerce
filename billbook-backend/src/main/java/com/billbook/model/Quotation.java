package com.billbook.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Entity @Table(name = "bb_quotations")
public class Quotation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password"})
    private BbUser user;
    @ManyToOne @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"user"})
    private Customer customer;
    @Column(unique = true) private String quotationNumber;
    private LocalDate quotationDate;
    private LocalDate validUntil;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private BigDecimal discountPercent = BigDecimal.ZERO;
    private BigDecimal cgstAmount = BigDecimal.ZERO;
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    private BigDecimal igstAmount = BigDecimal.ZERO;
    private BigDecimal totalTax = BigDecimal.ZERO;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private Boolean isGst = false;
    private String notes;
    private String terms;
    @Enumerated(EnumType.STRING)
    private Status status = Status.DRAFT;
    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"quotation"})
    private List<QuotationItem> items;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Status { DRAFT, SENT, ACCEPTED, REJECTED, CONVERTED }
}
