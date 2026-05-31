
package com.ecommerce.config;

import com.ecommerce.model.Category;
import com.ecommerce.model.User;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed Admin User
        if (!userRepository.existsByEmail("admin@ecommerce.com")) {
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@ecommerce.com");
            admin.setPhone("9999999999");
            admin.setPassword(passwordEncoder.encode("password"));
            admin.setRole(User.Role.ADMIN);
            admin.setIsActive(true);
            userRepository.save(admin);
            System.out.println("✅ Admin user seeded: admin@ecommerce.com / password");
        }

        // Seed Categories
        if (categoryRepository.count() == 0) {
            categoryRepository.save(createCategory("Dairy & Bread", "🥛", 1));
            categoryRepository.save(createCategory("Fruits & Vegetables", "🥦", 2));
            categoryRepository.save(createCategory("Oil & Ghee", "🫙", 3));
            categoryRepository.save(createCategory("Daily Use", "🧴", 4));
            categoryRepository.save(createCategory("Cosmetics", "💄", 5));
            categoryRepository.save(createCategory("Stationery", "✏️", 6));
            categoryRepository.save(createCategory("Ice Cream", "🍦", 7));
            categoryRepository.save(createCategory("Daily Worship", "🪔", 8));
            categoryRepository.save(createCategory("Gift Items", "🎁", 9));
            categoryRepository.save(createCategory("Electronics", "📱", 10));
            categoryRepository.save(createCategory("Electric Items", "💡", 11));
            categoryRepository.save(createCategory("Snacks", "🍿", 12));
            categoryRepository.save(createCategory("Beverages", "🥤", 13));
            System.out.println("✅ Categories seeded: 13 categories");
        }
    }

    private Category createCategory(String name, String emoji, int sortOrder) {
        Category cat = new Category();
        cat.setName(name);
        cat.setEmoji(emoji);
        cat.setSortOrder(sortOrder);
        cat.setIsActive(true);
        return cat;
    }
}
