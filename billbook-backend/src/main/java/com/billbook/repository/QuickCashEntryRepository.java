
package com.billbook.repository;

import com.billbook.model.QuickCashEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface QuickCashEntryRepository extends JpaRepository<QuickCashEntry, Long> {
    List<QuickCashEntry> findByRegisterIdOrderByEntryTimeDesc(Long registerId);
    List<QuickCashEntry> findByUserIdAndEntryTimeBetweenOrderByEntryTimeDesc(Long userId, LocalDateTime from, LocalDateTime to);
    List<QuickCashEntry> findByUserIdAndEntryTypeOrderByEntryTimeDesc(Long userId, QuickCashEntry.EntryType type);
    List<QuickCashEntry> findByRegisterIdAndEntryType(Long registerId, QuickCashEntry.EntryType type);
}
