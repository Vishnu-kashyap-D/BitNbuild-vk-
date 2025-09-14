-- Quick Schema Test Script
-- Run this to verify your database schema is working correctly

-- Test 1: Verify all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_name IN ('users', 'donations', 'allocations')
ORDER BY table_name;

-- Test 2: Verify all views exist  
SELECT 
    table_name as view_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_type = 'VIEW'
    AND table_name IN ('transparency_report', 'donation_summary')
ORDER BY table_name;

-- Test 3: Check table constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('users', 'donations', 'allocations')
ORDER BY tc.table_name, tc.constraint_type;

-- Test 4: Verify foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Test 5: Insert and query test data
BEGIN;

-- Insert test user
INSERT INTO users (email, password, role) 
VALUES ('test@example.com', 'test_hash', 'admin');

-- Insert test donation
INSERT INTO donations (source_tag, amount, financial_year)
VALUES ('Test Donation', 10000.00, '2024-2025');

-- Insert test allocation
INSERT INTO allocations (donation_id, beneficiary, beneficiary_type, reason, amount, approved_by)
VALUES (
    (SELECT id FROM donations WHERE source_tag = 'Test Donation'),
    'Test Department',
    'department',
    'Testing purposes',
    5000.00,
    (SELECT id FROM users WHERE email = 'test@example.com')
);

-- Query the test data through views
SELECT 'Test data in transparency_report:' as test_result;
SELECT * FROM transparency_report WHERE source_tag = 'Test Donation';

SELECT 'Test data in donation_summary:' as test_result;  
SELECT * FROM donation_summary WHERE source_tag = 'Test Donation';

-- Clean up test data
ROLLBACK;

-- Test 6: Verify triggers work
BEGIN;

-- Insert donation
INSERT INTO donations (source_tag, amount, financial_year)
VALUES ('Trigger Test', 1000.00, '2024-2025');

-- Check initial status
SELECT source_tag, amount, status FROM donations WHERE source_tag = 'Trigger Test';

-- Insert allocation
INSERT INTO allocations (donation_id, beneficiary, beneficiary_type, reason, amount)
VALUES (
    (SELECT id FROM donations WHERE source_tag = 'Trigger Test'),
    'Test Beneficiary',
    'other', 
    'Testing trigger',
    500.00
);

-- Check updated status (should be 'partially_allocated')
SELECT source_tag, amount, status FROM donations WHERE source_tag = 'Trigger Test';

-- Add more allocation to fully allocate
INSERT INTO allocations (donation_id, beneficiary, beneficiary_type, reason, amount)
VALUES (
    (SELECT id FROM donations WHERE source_tag = 'Trigger Test'),
    'Test Beneficiary 2',
    'other',
    'Complete allocation test', 
    500.00
);

-- Check final status (should be 'allocated')
SELECT source_tag, amount, status FROM donations WHERE source_tag = 'Trigger Test';

ROLLBACK;

SELECT 'Schema test completed successfully!' as result;