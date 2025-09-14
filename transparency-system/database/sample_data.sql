-- Sample Data for Transparency System
-- This file contains sample data to test the database schema

-- Clear existing data (use with caution!)
-- TRUNCATE TABLE allocations, donations, users RESTART IDENTITY CASCADE;

-- Insert sample users (password should be hashed in real application)
INSERT INTO users (email, password, role, source_tag) VALUES
('admin@college.edu', 'hashed_password_1', 'admin', NULL),
('finance@college.edu', 'hashed_password_2', 'admin', NULL),
('donor1@alumni.com', 'hashed_password_3', 'donor', 'Alumni Association'),
('govt@education.gov', 'hashed_password_4', 'donor', 'Government Education Grant'),
('csr@company.com', 'hashed_password_5', 'donor', 'Corporate CSR Fund');

-- Insert sample donations
INSERT INTO donations (source_tag, amount, description, donor_contact, financial_year) VALUES
('Government Education Grant 2024', 500000.00, 'Annual education development grant', 'contact@education.gov', '2024-2025'),
('Alumni Donation - Class of 1990', 150000.00, 'Infrastructure development fund', 'alumni1990@college.edu', '2024-2025'),
('CSR - TechCorp Ltd', 200000.00, 'Digital lab setup and student scholarships', 'csr@techcorp.com', '2024-2025'),
('Emergency Education Fund', 75000.00, 'COVID-19 student support fund', 'emergency@education.gov', '2024-2025'),
('Alumni Individual Donation', 25000.00, 'Student project funding', 'john.doe@alumni.com', '2024-2025');

-- Insert sample allocations
-- Government grant allocations
INSERT INTO allocations (donation_id, beneficiary, beneficiary_type, reason, amount, approved_by, status, notes) VALUES
(1, 'Computer Science Department', 'department', 'New server infrastructure for labs', 150000.00, 1, 'disbursed', 'Servers installed and operational'),
(1, 'Library', 'department', 'Digital book collection and e-resources', 100000.00, 1, 'completed', 'All digital resources procured'),
(1, 'Physics Department', 'department', 'Laboratory equipment upgrade', 200000.00, 2, 'allocated', 'Equipment selection in progress'),
(1, 'Student Welfare Fund', 'other', 'Emergency student support', 50000.00, 1, 'disbursed', 'Available for student emergencies');

-- Alumni donation allocations  
INSERT INTO allocations (donation_id, beneficiary, beneficiary_type, reason, amount, approved_by, status, notes) VALUES
(2, 'Main Building Renovation', 'project', 'Classroom modernization project', 100000.00, 1, 'allocated', 'Renovation contractor selected'),
(2, 'Student Lounge Development', 'project', 'Creating modern student spaces', 50000.00, 2, 'disbursed', 'Construction 60% complete');

-- CSR fund allocations
INSERT INTO allocations (donation_id, beneficiary, beneficiary_type, reason, amount, approved_by, status, notes) VALUES
(3, 'Digital Lab Setup', 'project', 'AI/ML lab with modern workstations', 120000.00, 1, 'allocated', 'Equipment procurement underway'),
(3, 'Scholarship Program', 'student', 'Merit scholarships for 10 students', 50000.00, 2, 'disbursed', '10 students selected and notified'),
(3, 'Faculty Development', 'department', 'Training programs for faculty', 30000.00, 1, 'completed', 'Training sessions completed successfully');

-- Emergency fund allocations
INSERT INTO allocations (donation_id, beneficiary, beneficiary_type, reason, amount, approved_by, status, notes) VALUES
(4, 'Student Emergency Support', 'student', 'Financial aid for affected students', 45000.00, 1, 'disbursed', '15 students received support'),
(4, 'Online Learning Infrastructure', 'project', 'Video conferencing and LMS setup', 30000.00, 2, 'completed', 'Online systems fully operational');

-- Individual donation allocations
INSERT INTO allocations (donation_id, beneficiary, beneficiary_type, reason, amount, approved_by, status, notes) VALUES
(5, 'Robotics Club', 'student', 'Drone development project', 10000.00, 1, 'allocated', 'Project proposal approved'),
(5, 'Innovation Lab', 'project', '3D printing equipment', 15000.00, 2, 'disbursed', '3D printers installed and operational');

-- Add some vendor-related allocations
INSERT INTO allocations (donation_id, beneficiary, beneficiary_type, reason, amount, approved_by, status, notes) VALUES
(1, 'ABC Tech Solutions', 'vendor', 'Software licenses for computer lab', 80000.00, 1, 'completed', 'Licenses activated for 100 students'),
(3, 'Digital Learning Partners', 'vendor', 'E-learning platform subscription', 25000.00, 2, 'disbursed', '2-year subscription activated');

-- Verification Queries
-- These queries help verify that the database is working correctly

-- 1. Check all data is inserted
SELECT 'Users created:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Donations recorded:', COUNT(*) FROM donations  
UNION ALL
SELECT 'Allocations made:', COUNT(*) FROM allocations;

-- 2. View the transparency report
SELECT 
    'TRANSPARENCY REPORT - Sample Data' as report_header,
    NULL as donation_id,
    NULL as source_tag, 
    NULL as donated_amount,
    NULL as beneficiary,
    NULL as reason,
    NULL as allocated_amount
UNION ALL
SELECT 
    '================================' as report_header,
    NULL, NULL, NULL, NULL, NULL, NULL
UNION ALL
SELECT 
    CAST(donation_id as TEXT),
    source_tag,
    CAST(donated_amount as TEXT),
    beneficiary,
    reason,
    CAST(allocated_amount as TEXT)
FROM transparency_report
ORDER BY report_header DESC, donation_id;

-- 3. Donation summary with remaining amounts
SELECT 
    source_tag,
    total_donated,
    total_allocated, 
    remaining_amount,
    allocation_count,
    ROUND((total_allocated/total_donated)*100, 2) as percentage_allocated
FROM donation_summary
ORDER BY total_donated DESC;

-- 4. Check beneficiary type distribution
SELECT 
    beneficiary_type,
    COUNT(*) as allocation_count,
    SUM(amount) as total_amount,
    ROUND(AVG(amount), 2) as avg_amount
FROM allocations
GROUP BY beneficiary_type
ORDER BY total_amount DESC;

-- 5. Status overview
SELECT 
    'Donations by Status' as category,
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM donations
GROUP BY status
UNION ALL
SELECT 
    'Allocations by Status' as category,
    status,
    COUNT(*) as count, 
    SUM(amount) as total_amount
FROM allocations
GROUP BY status
ORDER BY category, total_amount DESC;

-- 6. Monthly allocation trends
SELECT 
    DATE_TRUNC('month', date_allocated) as allocation_month,
    COUNT(*) as allocation_count,
    SUM(amount) as total_allocated,
    ROUND(AVG(amount), 2) as avg_allocation
FROM allocations
GROUP BY DATE_TRUNC('month', date_allocated)
ORDER BY allocation_month DESC;

-- 7. Admin activity report
SELECT 
    u.email as admin_email,
    COUNT(a.id) as allocations_approved,
    SUM(a.amount) as total_amount_approved,
    MIN(a.date_allocated) as first_approval,
    MAX(a.date_allocated) as last_approval
FROM users u
LEFT JOIN allocations a ON u.id = a.approved_by
WHERE u.role = 'admin'
GROUP BY u.id, u.email
ORDER BY total_amount_approved DESC NULLS LAST;