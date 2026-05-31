-- =============================================
-- ECOMMERCE DATABASE SCHEMA (PostgreSQL)
-- =============================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER','ADMIN','DELIVERY_BOY')),
    is_active BOOLEAN DEFAULT TRUE,
    fcm_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    label VARCHAR(50),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    emoji VARCHAR(10),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    unit VARCHAR(50),
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- CART TABLE
CREATE TABLE IF NOT EXISTS cart (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    delivery_boy_id BIGINT,
    address_id BIGINT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_charge DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('UPI','NET_BANKING','CREDIT_CARD','COD')),
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','SUCCESS','FAILED')),
    payment_transaction_id VARCHAR(100),
    shipping_type VARCHAR(20) DEFAULT 'STANDARD' CHECK (shipping_type IN ('STANDARD','EXPRESS','INSTANT')),
    order_status VARCHAR(20) DEFAULT 'PLACED' CHECK (order_status IN ('PLACED','CONFIRMED','ASSIGNED','PICKED_UP','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')),
    delivery_otp VARCHAR(6),
    otp_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    customer_latitude DECIMAL(10,8),
    customer_longitude DECIMAL(11,8),
    customer_location_address VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (delivery_boy_id) REFERENCES users(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id)
);

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_image VARCHAR(255),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- DELIVERY TRACKING TABLE
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    delivery_boy_id BIGINT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (delivery_boy_id) REFERENCES users(id)
);

-- OFFLINE BILLS TABLE
CREATE TABLE IF NOT EXISTS offline_bills (
    id BIGSERIAL PRIMARY KEY,
    bill_number VARCHAR(50),
    pdf_url VARCHAR(500),
    customer_name VARCHAR(100),
    customer_phone VARCHAR(15),
    total_amount DECIMAL(10,2) DEFAULT 0,
    items_summary TEXT,
    payment_mode VARCHAR(50),
    bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50),
    reference_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO users (name, email, phone, password, role, is_active) VALUES
('Admin User', 'admin@ecommerce.com', '9999999999', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (name, emoji, sort_order) VALUES
('Dairy & Bread', '🥛', 1),
('Fruits & Vegetables', '🥦', 2),
('Oil & Ghee', '🫙', 3),
('Daily Use', '🧴', 4),
('Cosmetics', '💄', 5),
('Stationery', '✏️', 6),
('Ice Cream', '🍦', 7),
('Daily Worship', '🪔', 8),
('Gift Items', '🎁', 9),
('Electronics', '📱', 10),
('Electric Items', '💡', 11),
('Snacks', '🍿', 12),
('Beverages', '🥤', 13)
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED PRODUCTS (5 per category)
-- =============================================
-- Dairy & Bread (cat 1)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(1, 'Amul Full Cream Milk', 'Fresh full cream milk', 28.00, 30.00, 6.67, '500ml', 100, TRUE),
(1, 'Amul Toned Milk', 'Low fat toned milk', 24.00, 26.00, 7.69, '500ml', 80, TRUE),
(1, 'Britannia Bread', 'Soft sandwich bread', 40.00, 45.00, 11.11, '400g', 50, TRUE),
(1, 'Amul Butter', 'Pasteurised table butter', 55.00, 60.00, 8.33, '100g', 60, TRUE),
(1, 'Amul Paneer', 'Fresh cottage cheese', 85.00, 90.00, 5.56, '200g', 40, TRUE),
(1, 'Curd / Dahi', 'Fresh set curd', 30.00, 32.00, 6.25, '400g', 70, TRUE),
(1, 'Amul Cheese Slices', 'Processed cheese slices', 95.00, 105.00, 9.52, '200g (10 slices)', 35, TRUE),
(1, 'Brown Bread', 'Whole wheat brown bread', 45.00, 50.00, 10.00, '400g', 45, TRUE)
ON CONFLICT DO NOTHING;

-- Fruits & Vegetables (cat 2)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(2, 'Tomato', 'Fresh red tomatoes', 30.00, 35.00, 14.29, '500g', 100, TRUE),
(2, 'Onion', 'Fresh onions', 25.00, 30.00, 16.67, '500g', 120, TRUE),
(2, 'Potato', 'Fresh potatoes', 20.00, 25.00, 20.00, '500g', 150, TRUE),
(2, 'Banana', 'Fresh ripe bananas', 40.00, 45.00, 11.11, '1 dozen', 60, TRUE),
(2, 'Apple', 'Fresh Shimla apples', 120.00, 140.00, 14.29, '500g (4-5 pcs)', 40, TRUE),
(2, 'Spinach / Palak', 'Fresh green spinach', 20.00, 25.00, 20.00, '250g', 50, TRUE),
(2, 'Carrot', 'Fresh orange carrots', 35.00, 40.00, 12.50, '500g', 70, TRUE),
(2, 'Capsicum', 'Fresh green capsicum', 40.00, 45.00, 11.11, '250g', 45, TRUE);

-- Oil & Ghee (cat 3)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(3, 'Fortune Sunflower Oil', 'Refined sunflower oil', 140.00, 155.00, 9.68, '1 Litre', 60, TRUE),
(3, 'Amul Pure Ghee', 'Pure cow ghee', 550.00, 600.00, 8.33, '500ml', 30, TRUE),
(3, 'Saffola Gold Oil', 'Blended edible oil', 160.00, 175.00, 8.57, '1 Litre', 50, TRUE),
(3, 'Patanjali Mustard Oil', 'Kachi ghani mustard oil', 130.00, 145.00, 10.34, '1 Litre', 40, TRUE),
(3, 'Coconut Oil', 'Pure coconut oil', 180.00, 200.00, 10.00, '500ml', 35, TRUE),
(3, 'Olive Oil', 'Extra virgin olive oil', 450.00, 500.00, 10.00, '500ml', 20, TRUE);

-- Daily Use (cat 4)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(4, 'Surf Excel Detergent', 'Washing powder', 110.00, 120.00, 8.33, '1 kg', 50, TRUE),
(4, 'Vim Dishwash Bar', 'Dish cleaning bar', 30.00, 35.00, 14.29, '200g', 80, TRUE),
(4, 'Dettol Soap', 'Antibacterial soap', 45.00, 50.00, 10.00, '75g x 3', 70, TRUE),
(4, 'Colgate Toothpaste', 'Strong teeth toothpaste', 85.00, 95.00, 10.53, '200g', 60, TRUE),
(4, 'Harpic Toilet Cleaner', 'Powerful toilet cleaner', 90.00, 100.00, 10.00, '500ml', 40, TRUE),
(4, 'Lizol Floor Cleaner', 'Disinfectant floor cleaner', 120.00, 135.00, 11.11, '975ml', 35, TRUE),
(4, 'Tissue Paper Roll', 'Soft tissue rolls', 150.00, 170.00, 11.76, 'Pack of 6', 45, TRUE);

-- Cosmetics (cat 5)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(5, 'Nivea Face Wash', 'Deep clean face wash', 150.00, 175.00, 14.29, '100ml', 40, TRUE),
(5, 'Lakme Lipstick', 'Long lasting lip color', 250.00, 299.00, 16.39, '3.6g', 30, TRUE),
(5, 'Dove Shampoo', 'Moisturising shampoo', 180.00, 200.00, 10.00, '180ml', 50, TRUE),
(5, 'Ponds Cold Cream', 'Moisturising cold cream', 95.00, 110.00, 13.64, '100ml', 45, TRUE),
(5, 'Sunscreen SPF 50', 'Sun protection lotion', 220.00, 250.00, 12.00, '50ml', 35, TRUE),
(5, 'Maybelline Kajal', 'Intense black kajal', 180.00, 210.00, 14.29, '0.35g', 40, TRUE),
(5, 'Vaseline Body Lotion', 'Deep moisture lotion', 140.00, 160.00, 12.50, '200ml', 55, TRUE);

-- Snacks (cat 12)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(12, 'Lays Classic Chips', 'Salted potato chips', 20.00, 20.00, 0.00, '26g', 100, TRUE),
(12, 'Kurkure Masala', 'Spicy corn puffs', 20.00, 20.00, 0.00, '90g', 90, TRUE),
(12, 'Parle-G Biscuits', 'Glucose biscuits', 10.00, 10.00, 0.00, '100g', 150, TRUE),
(12, 'Oreo Cookies', 'Chocolate sandwich cookies', 30.00, 35.00, 14.29, '120g', 80, TRUE),
(12, 'Maggi Noodles', '2-minute instant noodles', 14.00, 15.00, 6.67, '70g', 120, TRUE),
(12, 'Haldirams Bhujia', 'Crispy sev bhujia', 60.00, 70.00, 14.29, '200g', 60, TRUE),
(12, 'Dark Fantasy Biscuits', 'Choco filled biscuits', 30.00, 35.00, 14.29, '75g', 70, TRUE);

-- Beverages (cat 13)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(13, 'Coca Cola', 'Refreshing cola drink', 40.00, 45.00, 11.11, '750ml', 80, TRUE),
(13, 'Tropicana Orange Juice', 'Fresh orange juice', 90.00, 99.00, 9.09, '1 Litre', 50, TRUE),
(13, 'Red Bull Energy Drink', 'Energy drink', 115.00, 125.00, 8.00, '250ml', 40, TRUE),
(13, 'Bisleri Water', 'Packaged drinking water', 20.00, 20.00, 0.00, '1 Litre', 200, TRUE),
(13, 'Nescafe Coffee', 'Instant coffee', 220.00, 250.00, 12.00, '100g', 35, TRUE),
(13, 'Tata Tea Gold', 'Premium blend tea', 180.00, 200.00, 10.00, '250g', 45, TRUE),
(13, 'Horlicks', 'Health drink powder', 280.00, 310.00, 9.68, '500g', 30, TRUE);

-- Ice Cream (cat 7)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(7, 'Amul Vanilla Ice Cream', 'Classic vanilla flavour', 80.00, 90.00, 11.11, '500ml', 30, TRUE),
(7, 'Kwality Walls Cornetto', 'Chocolate cone ice cream', 40.00, 45.00, 11.11, '1 pc', 50, TRUE),
(7, 'Amul Chocolate Ice Cream', 'Rich chocolate flavour', 90.00, 100.00, 10.00, '500ml', 25, TRUE),
(7, 'Magnum Almond Bar', 'Belgian chocolate bar', 80.00, 90.00, 11.11, '1 pc', 35, TRUE),
(7, 'Kulfi Stick', 'Traditional Indian kulfi', 30.00, 35.00, 14.29, '1 pc', 60, TRUE);

-- Electronics (cat 10)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(10, 'USB Type-C Cable', 'Fast charging cable', 199.00, 249.00, 20.08, '1m', 60, TRUE),
(10, 'Earphones', 'Wired stereo earphones', 299.00, 399.00, 25.06, '1 pc', 40, TRUE),
(10, 'Phone Stand', 'Adjustable mobile stand', 149.00, 199.00, 25.13, '1 pc', 50, TRUE),
(10, 'Screen Guard', 'Tempered glass protector', 99.00, 149.00, 33.56, '1 pc', 80, TRUE),
(10, 'Power Bank 10000mAh', 'Portable charger', 799.00, 999.00, 20.02, '1 pc', 20, TRUE);

-- Stationery (cat 6)
INSERT INTO products (category_id, name, description, price, mrp, discount_percent, unit, stock_quantity, is_active) VALUES
(6, 'Classmate Notebook', 'Single line notebook', 40.00, 45.00, 11.11, '172 pages', 80, TRUE),
(6, 'Reynolds Pen Pack', 'Ball point pens', 30.00, 35.00, 14.29, 'Pack of 5', 100, TRUE),
(6, 'Stapler', 'Mini stapler with pins', 80.00, 95.00, 15.79, '1 pc', 40, TRUE),
(6, 'Sticky Notes', 'Colourful sticky notes', 50.00, 60.00, 16.67, 'Pack of 100', 60, TRUE),
(6, 'Geometry Box', 'Student geometry set', 120.00, 140.00, 14.29, '1 set', 35, TRUE);
