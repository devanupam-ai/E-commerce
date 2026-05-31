
package com.billbook.repository;

import com.billbook.model.CashRegister;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CashRegisterRepository extends JpaRepository<CashRegister, Long> {
    Optional<CashRegister> findByUserIdAndRegisterDate(Long userId, LocalDate date);
    Optional<CashRegister> findByUserIdAndStatus(Long userId, CashRegister.RegisterStatus status);
    List<CashRegister> findByUserIdOrderByRegisterDateDesc(Long userId);
    List<CashRegister> findByUserIdAndRegisterDateBetween(Long userId, LocalDate from, LocalDate to);
    List<CashRegister> findByUserIdAndDifferenceNot(Long userId, java.math.BigDecimal zero);
}
