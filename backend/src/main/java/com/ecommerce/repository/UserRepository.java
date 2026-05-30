package com.ecommerce.repository;

import com.ecommerce.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    List<User> findByRole(User.Role role);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
