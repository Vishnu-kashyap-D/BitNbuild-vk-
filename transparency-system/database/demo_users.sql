-- Demo users with properly hashed passwords for testing
-- Password: admin123 (hashed with bcrypt, 12 rounds)
-- Password: donor123 (hashed with bcrypt, 12 rounds)

-- Clear existing users and reset the sequence
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Insert demo users with hashed passwords (bcrypt, 12 rounds)
INSERT INTO users (email, password, role, source_tag) VALUES
('admin@college.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBMNF4HRcWfO6q', 'admin', NULL),
('finance@college.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBMNF4HRcWfO6q', 'admin', NULL),
('donor1@alumni.com', '$2b$12$Np47wgvMo.EsYCQzXgMpkeMuCKPxVsqV8VgWhjfZaGN0yQEwcHZzW', 'donor', 'Alumni Association'),
('govt@education.gov', '$2b$12$Np47wgvMo.EsYCQzXgMpkeMuCKPxVsqV8VgWhjfZaGN0yQEwcHZzW', 'donor', 'Government Education Grant'),
('csr@company.com', '$2b$12$Np47wgvMo.EsYCQzXgMpkeMuCKPxVsqV8VgWhjfZaGN0yQEwcHZzW', 'donor', 'Corporate CSR Fund');

-- Verify the users were created
SELECT id, email, role, source_tag, created_at FROM users ORDER BY id;