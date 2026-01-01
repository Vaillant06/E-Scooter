-- ======================================================
--  E-SCOOTER SYSTEM — CURRENT DATABASE SCHEMA (LIVE)
--  Matches your running PostgreSQL instance
-- ======================================================

-- Drop (optional)
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
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(20) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ======================================================
-- SCOOTERS
-- ======================================================
CREATE TABLE scooters (
    id SERIAL PRIMARY KEY,
    scooterId VARCHAR(10) UNIQUE NOT NULL,
    batteryHealth INT NOT NULL,
    status VARCHAR(20) NOT NULL,     -- free | active | unavailable
    baseFee INT NOT NULL,
    ratePerMin INT NOT NULL,
    image TEXT                       -- optional
);

-- ======================================================
-- BOOKINGS
-- stores ongoing or past rides (payment not yet done)
-- ======================================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    scooterId VARCHAR(10) NOT NULL REFERENCES scooters(scooterId),
    userId TEXT NOT NULL,
    model TEXT,                      -- stored from front-end
    startTime TIMESTAMP NOT NULL,
    endTime TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- ======================================================
-- PAYMENTS
-- stores confirmed payments AFTER ride ends
-- ======================================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    scooter_id TEXT NOT NULL REFERENCES scooters(scooterId),
    user_id TEXT NOT NULL,
    total_minutes INT NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    payment_mode TEXT NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- Sample data (optional)
-- ======================================================

INSERT INTO scooters (scooterId, batteryHealth, status, baseFee, ratePerMin, image) VALUES
('E001', 85, 'free', 20, 2, '/images/scooter.webp'),
('E002', 100, 'unavailable', 20, 2, '/images/scooter.webp');

