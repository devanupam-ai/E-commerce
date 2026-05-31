-- =============================================
-- BILLBOOK DATABASE SCHEMA (PostgreSQL)
-- =============================================

-- USERS TABLE (multi-user support)
CREATE TABLE IF NOT EXISTS bb_users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    business_name VARCHAR(200),
    business_address TEXT,
    gstin VARCHAR(20),
    pan VARCHAR(15),
    logo_url VARCHAR(500),
    role VARCHAR(20) DEFAULT 'OWNER' CHECK (role IN ('OWNER','STAFF','ACCOUNTANT')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS bb_customers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gstin VARCHAR(20),
    type VARCHAR(20) DEFAULT 'CUSTOMER' CHECK (type IN ('CUSTOMER','VENDOR','BOTH')),
    opening_balance DECIMAL(12,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES bb_users(id) ON DELETE CASCADE
);

-- PRODUCTS / CATALOG TABLE
CREATE TABLE IF NOT EXISTS bb_products (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    hsn_code VARCHAR(20),
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'PCS',
    purchase_price DECIMAL(12,2) DEFAULT 0.00,
    selling_price DECIMAL(12,2) NOT NULL,
    mrp DECIMAL(12,2) DEFAULT 0.00,
    gst_rate DECIMAL(5,2) DEFAULT 0.00,
    stock_quantity DECIMAL(12,2) DEFAULT 0.00,
    reorder_level DECIMAL(12,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES bb_users(id) ON DELETE CASCADE
);

-- INVOICES TABLE
CREATE TABLE IF NOT EXISTS bb_invoices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type VARCHAR(20) DEFAULT 'SALE' CHECK (invoice_type IN ('SALE','PURCHASE','SALE_RETURN','PURCHASE_RETURN')),
    invoice_date DATE NOT NULL,
    due_date DATE,
    is_gst BOOLEAN DEFAULT FALSE,
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    cgst_amount DECIMAL(12,2) DEFAULT 0.00,
    sgst_amount DECIMAL(12,2) DEFAULT 0.00,
    igst_amount DECIMAL(12,2) DEFAULT 0.00,
    total_tax DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    balance_due DECIMAL(12,2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID','PARTIAL','PAID','OVERDUE')),
    payment_mode VARCHAR(20) DEFAULT 'CASH' CHECK (payment_mode IN ('CASH','UPI','CARD','BANK_TRANSFER','CHEQUE','CREDIT')),
    notes TEXT,
    terms TEXT,
    is_online BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES bb_users(id),
    FOREIGN KEY (customer_id) REFERENCES bb_customers(id)
);

-- INVOICE ITEMS TABLE
CREATE TABLE IF NOT EXISTS bb_invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    product_id BIGINT,
    product_name VARCHAR(200) NOT NULL,
    hsn_code VARCHAR(20),
    quantity DECIMAL(12,2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'PCS',
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    gst_rate DECIMAL(5,2) DEFAULT 0.00,
    cgst_amount DECIMAL(12,2) DEFAULT 0.00,
    sgst_amount DECIMAL(12,2) DEFAULT 0.00,
    igst_amount DECIMAL(12,2) DEFAULT 0.00,
    total_price DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES bb_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES bb_products(id) ON DELETE SET NULL
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS bb_payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    invoice_id BIGINT,
    customer_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(20) DEFAULT 'CASH' CHECK (payment_mode IN ('CASH','UPI','CARD','BANK_TRANSFER','CHEQUE','CREDIT')),
    reference_number VARCHAR(100),
    notes TEXT,
    type VARCHAR(20) DEFAULT 'RECEIVED' CHECK (type IN ('RECEIVED','PAID')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES bb_users(id),
    FOREIGN KEY (invoice_id) REFERENCES bb_invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES bb_customers(id)
);

-- STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS bb_stock_movements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    invoice_id BIGINT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('IN','OUT','ADJUSTMENT')),
    quantity DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES bb_users(id),
    FOREIGN KEY (product_id) REFERENCES bb_products(id),
    FOREIGN KEY (invoice_id) REFERENCES bb_invoices(id) ON DELETE SET NULL
);

-- KHATA ENTRIES TABLE (Udhaar Book)
CREATE TABLE IF NOT EXISTS bb_khata_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    party_id BIGINT NOT NULL,
    entry_type VARCHAR(30) DEFAULT 'CREDIT_GIVEN' CHECK (entry_type IN ('CREDIT_GIVEN','CREDIT_RECEIVED','DEBIT_GIVEN','DEBIT_RECEIVED','PAYMENT_RECEIVED','PAYMENT_MADE','INTEREST')),
    amount DECIMAL(12,2) NOT NULL,
    description VARCHAR(500),
    entry_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','PARTIAL','SETTLED','OVERDUE')),
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    interest_amount DECIMAL(12,2) DEFAULT 0.00,
    reference_id BIGINT,
    reference_type VARCHAR(20),
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES bb_users(id) ON DELETE CASCADE,
    FOREIGN KEY (party_id) REFERENCES bb_customers(id) ON DELETE CASCADE
);

-- KHATA SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS bb_khata_settlements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    party_id BIGINT NOT NULL,
    khata_entry_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    settlement_date DATE NOT NULL,
    payment_mode VARCHAR(20) DEFAULT 'CASH' CHECK (payment_mode IN ('CASH','UPI','CARD','BANK_TRANSFER','CHEQUE','CREDIT')),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES bb_users(id) ON DELETE CASCADE,
    FOREIGN KEY (party_id) REFERENCES bb_customers(id) ON DELETE CASCADE,
    FOREIGN KEY (khata_entry_id) REFERENCES bb_khata_entries(id) ON DELETE CASCADE
);

-- CASH REGISTER TABLE
CREATE TABLE IF NOT EXISTS bb_cash_register (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    register_date DATE NOT NULL,
    status VARCHAR(10) DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
    opening_cash DECIMAL(12,2) DEFAULT 0.00,
    denom_2000 INT DEFAULT 0,
    denom_500 INT DEFAULT 0,
    denom_200 INT DEFAULT 0,
    denom_100 INT DEFAULT 0,
    denom_50 INT DEFAULT 0,
    denom_20 INT DEFAULT 0,
    denom_10 INT DEFAULT 0,
    denom_5 INT DEFAULT 0,
    denom_2 INT DEFAULT 0,
    denom_1 INT DEFAULT 0,
    total_cash_sales DECIMAL(12,2) DEFAULT 0.00,
    total_upi_sales DECIMAL(12,2) DEFAULT 0.00,
    total_card_sales DECIMAL(12,2) DEFAULT 0.00,
    total_bank_transfer_sales DECIMAL(12,2) DEFAULT 0.00,
    total_cheque_sales DECIMAL(12,2) DEFAULT 0.00,
    total_credit_sales DECIMAL(12,2) DEFAULT 0.00,
    total_cash_expenses DECIMAL(12,2) DEFAULT 0.00,
    total_cash_received DECIMAL(12,2) DEFAULT 0.00,
    total_cash_paid_out DECIMAL(12,2) DEFAULT 0.00,
    closing_cash_system DECIMAL(12,2) DEFAULT 0.00,
    closing_cash_actual DECIMAL(12,2) DEFAULT 0.00,
    difference DECIMAL(12,2) DEFAULT 0.00,
    close_denom_2000 INT DEFAULT 0,
    close_denom_500 INT DEFAULT 0,
    close_denom_200 INT DEFAULT 0,
    close_denom_100 INT DEFAULT 0,
    close_denom_50 INT DEFAULT 0,
    close_denom_20 INT DEFAULT 0,
    close_denom_10 INT DEFAULT 0,
    close_denom_5 INT DEFAULT 0,
    close_denom_2 INT DEFAULT 0,
    close_denom_1 INT DEFAULT 0,
    closing_notes TEXT,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES bb_users(id) ON DELETE CASCADE,
    UNIQUE (user_id, register_date)
);

-- QUICK CASH ENTRIES TABLE
CREATE TABLE IF NOT EXISTS bb_quick_cash_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    register_id BIGINT NOT NULL,
    entry_type VARCHAR(30) DEFAULT 'CASH_SALE' CHECK (entry_type IN ('CASH_SALE','UPI_SALE','CASH_RECEIVED','CASH_PAID_OUT','EXPENSE','SHORT_PAYMENT','ADJUSTMENT')),
    amount DECIMAL(12,2) DEFAULT 0.00,
    payment_mode VARCHAR(20) DEFAULT 'CASH' CHECK (payment_mode IN ('CASH','UPI','CARD','BANK_TRANSFER','CHEQUE')),
    description VARCHAR(500),
    customer_name VARCHAR(100),
    linked_invoice_id BIGINT,
    expected_amount DECIMAL(12,2) DEFAULT 0.00,
    short_amount DECIMAL(12,2) DEFAULT 0.00,
    short_reason VARCHAR(500),
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES bb_users(id) ON DELETE CASCADE,
    FOREIGN KEY (register_id) REFERENCES bb_cash_register(id) ON DELETE CASCADE
);

-- SEED ADMIN USER (password = 'password')
-- BCrypt hash of 'password': $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- IMPORTANT: is_active must be TRUE, otherwise login will fail
INSERT INTO bb_users (name, email, phone, password, business_name, role, is_active)
VALUES ('Admin', 'admin@billbook.com', '9000000000',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'My Business', 'OWNER', TRUE)
ON CONFLICT (email) DO NOTHING;
