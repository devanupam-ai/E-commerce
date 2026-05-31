
package com.billbook.repository;

import com.billbook.model.BusinessCard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BusinessCardRepository extends JpaRepository<BusinessCard, Long> {
    Optional<BusinessCard> findByUserIdAndIsActiveTrue(Long userId);
}
