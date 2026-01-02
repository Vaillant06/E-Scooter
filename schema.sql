-- ======================================================
-- E-SCOOTER SYSTEM — FINAL PRODUCTION SCHEMA
-- ======================================================

-- Drop tables (ONLY for fresh setup)
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS scooters;
DROP TABLE IF EXISTS users;

-- ======================================================
-- USERS
-- ======================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    auth_provider VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- SCOOTERS
-- ======================================================
CREATE TABLE scooters (
    id SERIAL PRIMARY KEY,
    scooterId VARCHAR(10) UNIQUE NOT NULL,
    batteryHealth INT NOT NULL,
    status VARCHAR(20) NOT NULL,      -- free | active | unavailable
    baseFee INT NOT NULL,
    ratePerMin INT NOT NULL,
    image TEXT
);

-- ======================================================
-- BOOKINGS
-- ======================================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    scooterId VARCHAR(10) NOT NULL REFERENCES scooters(scooterId),
    userId INT NOT NULL REFERENCES users(id),
    model TEXT,
    startTime TIMESTAMP NOT NULL,
    endTime TIMESTAMP,
    totalMinutes INT,
    active BOOLEAN DEFAULT TRUE
);

-- ======================================================
-- PAYMENTS
-- ======================================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    scooter_id VARCHAR(10) NOT NULL REFERENCES scooters(scooterId),
    user_id INT NOT NULL REFERENCES users(id),
    total_minutes INT NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    payment_mode TEXT NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- SEED DATA (OPTIONAL)
-- ======================================================
INSERT INTO scooters (scooterId, batteryHealth, status, baseFee, ratePerMin, image) VALUES
('E001', 85, 'free', 20, 2, '/images/scooter.webp'),
('E002', 100, 'unavailable', 20, 2, '/images/scooter.webp');
