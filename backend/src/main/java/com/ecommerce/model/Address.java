package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Data @Entity @Table(name = "addresses")
public class Address {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password","authorities","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled","username","fcmToken"})
    private User user;
    private String label;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private Boolean isDefault = false;
}
