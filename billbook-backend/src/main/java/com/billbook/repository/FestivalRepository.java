
package com.billbook.repository;

import com.billbook.model.Festival;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface FestivalRepository extends JpaRepository<Festival, Long> {
    List<Festival> findByIsActiveTrueOrderByFestivalDateAsc();

    @Query("SELECT f FROM Festival f WHERE f.isActive = true AND f.festivalDate BETWEEN :from AND :to ORDER BY f.festivalDate ASC")
    List<Festival> findUpcomingFestivals(LocalDate from, LocalDate to);

    List<Festival> findByFestivalDateBetweenAndIsActiveTrue(LocalDate from, LocalDate to);
}
