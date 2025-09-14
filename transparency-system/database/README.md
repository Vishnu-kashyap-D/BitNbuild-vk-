# Transparency System Database Setup

This directory contains the PostgreSQL database schema and setup scripts for the Transparency System.

## Prerequisites

1. PostgreSQL installed and running on your system
2. PostgreSQL client tools (psql) available
3. Database user with CREATE DATABASE privileges

## Quick Setup

### Method 1: Using the setup script
```bash
psql -U postgres -f setup.sql
```

### Method 2: Manual setup
```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE transparency_system;"

# 2. Run schema
psql -U postgres -d transparency_system -f schema.sql
```

### Method 3: Step by step
```bash
# 1. Connect to PostgreSQL
psql -U postgres

# 2. Create database
CREATE DATABASE transparency_system;

# 3. Connect to the new database
\c transparency_system;

# 4. Run the schema file
\i schema.sql

# 5. Exit
\q
```

## Database Structure

### Tables

1. **users** - System users (admins and donors)
   - `id` - Primary key
   - `email` - Unique email address
   - `password` - Hashed password (implement hashing in your application)
   - `role` - 'admin' or 'donor'
   - `source_tag` - For donors, identifies their funding source
   - `created_at`, `updated_at` - Timestamps
   - `is_active` - Boolean flag for account status

2. **donations** - Incoming funds tracking
   - `id` - Primary key
   - `source_tag` - Fund source identifier (e.g., "Govt Grant 2025")
   - `amount` - Donation amount (up to 12 digits, 2 decimal places)
   - `description` - Optional purpose description
   - `donor_contact` - Optional contact information
   - `date_added` - When the donation was received
   - `financial_year` - For reporting (e.g., "2024-2025")
   - `status` - 'received', 'allocated', or 'partially_allocated'

3. **allocations** - Fund distribution tracking
   - `id` - Primary key
   - `donation_id` - Foreign key to donations table
   - `beneficiary` - Name of recipient (department/student/etc.)
   - `beneficiary_type` - Type: 'department', 'student', 'project', 'vendor', 'other'
   - `reason` - Purpose of allocation
   - `amount` - Allocated amount
   - `approved_by` - Foreign key to users table (admin who approved)
   - `date_allocated` - When allocation was made
   - `status` - 'allocated', 'disbursed', or 'completed'
   - `notes` - Additional documentation

### Views

1. **transparency_report** - Complete fund flow from source to beneficiary
2. **donation_summary** - Summary showing total donations, allocations, and remaining amounts

### Key Features

- **Automatic Status Updates**: Donation status automatically updates based on allocation amounts
- **Data Integrity**: Constraints ensure positive amounts and valid relationships
- **Performance Optimization**: Indexes on frequently queried columns
- **Audit Trail**: Timestamps and approval tracking for accountability
- **Flexible Beneficiary Types**: Supports departments, students, projects, vendors, and others

## Verification

After setup, verify everything works:

```sql
-- Check tables exist
\dt

-- Check views exist
\dv

-- Verify table structures
\d users
\d donations
\d allocations

-- Test the views
SELECT * FROM transparency_report LIMIT 5;
SELECT * FROM donation_summary LIMIT 5;
```

## Next Steps

1. Set up your application to connect to this database
2. Implement password hashing for user authentication
3. Create sample data for testing
4. Build the web interface to interact with these tables

## Security Notes

- Never store passwords in plain text - implement proper hashing
- Use environment variables for database credentials
- Consider implementing role-based permissions
- Regular database backups are recommended