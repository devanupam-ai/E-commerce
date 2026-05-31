package com.billbook.repository;

import com.billbook.model.KhataSettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KhataSettlementRepository extends JpaRepository<KhataSettlement, Long> {
    List<KhataSettlement> findByUserIdAndPartyIdOrderBySettlementDateDesc(Long userId, Long partyId);
    List<KhataSettlement> findByKhataEntryIdOrderBySettlementDateDesc(Long khataEntryId);
    List<KhataSettlement> findByUserIdOrderBySettlementDateDesc(Long userId);
}
