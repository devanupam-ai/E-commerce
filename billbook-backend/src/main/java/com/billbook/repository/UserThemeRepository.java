
package com.billbook.repository;

import com.billbook.model.UserTheme;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserThemeRepository extends JpaRepository<UserTheme, Long> {
    Optional<UserTheme> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
