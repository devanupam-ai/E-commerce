package com.billbook.repository;

import com.billbook.model.KhataEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface KhataEntryRepository extends JpaRepository<KhataEntry, Long> {
    List<KhataEntry> findByUserIdAndPartyIdOrderByEntryDateDesc(Long userId, Long partyId);
    List<KhataEntry> findByUserIdAndStatusOrderByEntryDateDesc(Long userId, KhataEntry.EntryStatus status);
    List<KhataEntry> findByUserIdOrderByEntryDateDesc(Long userId);
    List<KhataEntry> findByUserIdAndEntryTypeOrderByEntryDateDesc(Long userId, KhataEntry.EntryType entryType);

    @Query("SELECT COALESCE(SUM(ke.amount), 0) FROM KhataEntry ke WHERE ke.user.id = :userId AND ke.party.id = :partyId AND ke.entryType IN :types AND ke.status != 'SETTLED'")
    BigDecimal sumPendingByPartyAndTypes(@Param("userId") Long userId, @Param("partyId") Long partyId, @Param("types") List<KhataEntry.EntryType> types);

    @Query("SELECT COALESCE(SUM(ke.amount), 0) FROM KhataEntry ke WHERE ke.user.id = :userId AND ke.entryType IN :creditTypes AND ke.status != 'SETTLED'")
    BigDecimal sumTotalCreditGiven(@Param("userId") Long userId, @Param("creditTypes") List<KhataEntry.EntryType> creditTypes);

    @Query("SELECT COALESCE(SUM(ke.amount), 0) FROM KhataEntry ke WHERE ke.user.id = :userId AND ke.entryType IN :debitTypes AND ke.status != 'SETTLED'")
    BigDecimal sumTotalDebitGiven(@Param("userId") Long userId, @Param("debitTypes") List<KhataEntry.EntryType> debitTypes);

    @Query("SELECT ke.party.id, COALESCE(SUM(CASE WHEN ke.entryType IN :creditTypes THEN ke.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN ke.entryType IN :paymentTypes THEN ke.amount ELSE 0 END), 0) as balance FROM KhataEntry ke WHERE ke.user.id = :userId AND ke.status != 'SETTLED' GROUP BY ke.party.id")
    List<Object[]> getPartyWiseBalances(@Param("userId") Long userId, @Param("creditTypes") List<KhataEntry.EntryType> creditTypes, @Param("paymentTypes") List<KhataEntry.EntryType> paymentTypes);

    List<KhataEntry> findByUserIdAndDueDateBeforeAndStatusNot(Long userId, LocalDate date, KhataEntry.EntryStatus status);

    @Query("SELECT COALESCE(SUM(ke.interestAmount), 0) FROM KhataEntry ke WHERE ke.user.id = :userId AND ke.party.id = :partyId AND ke.entryType = 'INTEREST' AND ke.status != 'SETTLED'")
    BigDecimal sumPendingInterestByParty(@Param("userId") Long userId, @Param("partyId") Long partyId);
}
