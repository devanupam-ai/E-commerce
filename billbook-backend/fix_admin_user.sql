-- =============================================
-- FIX BILLBOOK ADMIN USER - Run this in MySQL
-- =============================================
USE billbook;

-- UPDATE existing admin user (avoids foreign key constraint errors on DELETE)
-- BCrypt hash of 'password' = $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
UPDATE bb_users 
SET name = 'Admin',
    phone = '9000000000',
    password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    business_name = 'My Business',
    role = 'OWNER',
    is_active = 1
WHERE email = 'admin@billbook.com';

-- Verify the user was updated correctly
SELECT id, name, email, role, is_active, password FROM bb_users WHERE email = 'admin@billbook.com';
