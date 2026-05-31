
package com.billbook.repository;

import com.billbook.model.CashFlowEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface CashFlowEntryRepository extends JpaRepository<CashFlowEntry, Long> {
    List<CashFlowEntry> findByUserIdOrderByEntryDateDescCreatedAtDesc(Long userId);
    List<CashFlowEntry> findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(Long userId, LocalDate from, LocalDate to);
    List<CashFlowEntry> findByUserIdAndFlowTypeOrderByEntryDateDesc(Long userId, CashFlowEntry.FlowType flowType);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CashFlowEntry c WHERE c.user.id = :userId AND c.flowType = 'INFLOW' AND c.entryDate BETWEEN :from AND :to")
    BigDecimal totalInflowBetween(Long userId, LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CashFlowEntry c WHERE c.user.id = :userId AND c.flowType = 'OUTFLOW' AND c.entryDate BETWEEN :from AND :to")
    BigDecimal totalOutflowBetween(Long userId, LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CashFlowEntry c WHERE c.user.id = :userId AND c.flowType = 'INFLOW'")
    BigDecimal totalInflow(Long userId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CashFlowEntry c WHERE c.user.id = :userId AND c.flowType = 'OUTFLOW'")
    BigDecimal totalOutflow(Long userId);
}
