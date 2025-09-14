-- Database Setup Script for Transparency System
-- Run this script to create the database and all necessary tables

-- Step 1: Create the database (run this as a superuser)
CREATE DATABASE transparency_system;

-- Step 2: Connect to the database
\c transparency_system;

-- Step 3: Run the schema creation
\i schema.sql

-- Step 4: Verify the setup
SELECT 'Database setup completed successfully!' as message;

-- Show all tables created
\dt

-- Show all views created  
\dv

-- Show table structure
\d users
\d donations  
\d allocations