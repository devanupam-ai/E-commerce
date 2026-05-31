package com.billbook.repository;

import com.billbook.model.BbUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BbUserRepository extends JpaRepository<BbUser, Long> {
    Optional<BbUser> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
