-- Transparency System Database Schema
-- This schema supports a fund transparency system with three main actors:
-- 1. Outsiders (Donors/Govt/CSR/Alumni) - provide funds
-- 2. College/Trust (Admin) - receive and allocate funds  
-- 3. Beneficiaries (Departments/Students/Projects/Vendors) - consume funds

-- Create database (run this separately if creating new database)
-- CREATE DATABASE transparency_system;
-- \c transparency_system;

-- Enable UUID extension for better ID generation (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table: Manages admin and donor access to the system
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Should be hashed in application
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'donor')),
    source_tag VARCHAR(255), -- For donors: identifies their funding source
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Donations table: Tracks all incoming funds from various sources
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    source_tag VARCHAR(255) NOT NULL, -- e.g., "Govt Grant 2025", "Alumni Donation", "CSR Fund XYZ"
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT, -- Optional description of the donation purpose
    donor_contact VARCHAR(255), -- Optional contact info (could be anonymous)
    date_added TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    financial_year VARCHAR(9), -- e.g., "2024-2025" for easier reporting
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'allocated', 'partially_allocated'))
);

-- Allocations table: Tracks how donations are distributed to beneficiaries  
CREATE TABLE allocations (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    beneficiary VARCHAR(255) NOT NULL, -- Department/Student/Project/Vendor name
    beneficiary_type VARCHAR(50) NOT NULL CHECK (beneficiary_type IN ('department', 'student', 'project', 'vendor', 'other')),
    reason TEXT NOT NULL, -- Purpose: "Lab Equipment", "Student Project: Drone", etc.
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    approved_by INTEGER REFERENCES users(id), -- Admin who approved this allocation
    date_allocated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'allocated' CHECK (status IN ('allocated', 'disbursed', 'completed')),
    notes TEXT -- Additional notes or documentation
);

-- Create indexes for better query performance
CREATE INDEX idx_donations_source_tag ON donations(source_tag);
CREATE INDEX idx_donations_date_added ON donations(date_added);
CREATE INDEX idx_donations_financial_year ON donations(financial_year);
CREATE INDEX idx_allocations_donation_id ON allocations(donation_id);
CREATE INDEX idx_allocations_beneficiary ON allocations(beneficiary);
CREATE INDEX idx_allocations_beneficiary_type ON allocations(beneficiary_type);
CREATE INDEX idx_allocations_date_allocated ON allocations(date_allocated);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Create a view for easy transparency reporting
CREATE VIEW transparency_report AS
SELECT 
    d.id as donation_id,
    d.source_tag,
    d.amount as donated_amount,
    d.date_added as donation_date,
    d.financial_year,
    a.id as allocation_id,
    a.beneficiary,
    a.beneficiary_type,
    a.reason,
    a.amount as allocated_amount,
    a.date_allocated,
    a.status as allocation_status,
    u.email as approved_by_email
FROM donations d
LEFT JOIN allocations a ON d.id = a.donation_id
LEFT JOIN users u ON a.approved_by = u.id
ORDER BY d.date_added DESC, a.date_allocated DESC;

-- Create a view for donation summary
CREATE VIEW donation_summary AS
SELECT 
    d.id,
    d.source_tag,
    d.amount as total_donated,
    COALESCE(SUM(a.amount), 0) as total_allocated,
    (d.amount - COALESCE(SUM(a.amount), 0)) as remaining_amount,
    d.date_added,
    d.financial_year,
    COUNT(a.id) as allocation_count
FROM donations d
LEFT JOIN allocations a ON d.id = a.donation_id
GROUP BY d.id, d.source_tag, d.amount, d.date_added, d.financial_year
ORDER BY d.date_added DESC;

-- Add some constraints to ensure data integrity
ALTER TABLE allocations ADD CONSTRAINT check_allocation_amount_positive 
    CHECK (amount > 0);

-- Add trigger to update donation status based on allocations
CREATE OR REPLACE FUNCTION update_donation_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE donations SET 
        status = CASE 
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM allocations WHERE donation_id = NEW.donation_id) >= donations.amount 
            THEN 'allocated'
            WHEN (SELECT COUNT(*) FROM allocations WHERE donation_id = NEW.donation_id) > 0 
            THEN 'partially_allocated'
            ELSE 'received'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.donation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_donation_status
    AFTER INSERT OR UPDATE OR DELETE ON allocations
    FOR EACH ROW EXECUTE FUNCTION update_donation_status();

-- Add updated_at trigger function for users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'System users including admins and donors';
COMMENT ON TABLE donations IS 'All incoming funds from various sources';
COMMENT ON TABLE allocations IS 'Distribution of funds to beneficiaries';
COMMENT ON VIEW transparency_report IS 'Complete transparency view showing fund flow from source to beneficiary';
COMMENT ON VIEW donation_summary IS 'Summary view showing donation totals and remaining amounts';