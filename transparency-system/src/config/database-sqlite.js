const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Create database path
const dbPath = path.join(__dirname, '..', '..', 'database', 'transparency.db');

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
    process.exit(-1);
  } else {
    console.log('Connected to SQLite database:', dbPath);
  }
});

// Initialize database schema
const initSchema = () => {
  return new Promise((resolve, reject) => {
    const schemas = [
      // Users table with extended fields
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'donor',
        name VARCHAR(255),
        department VARCHAR(255),
        student_id VARCHAR(100),
        source_tag VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Donations table (from donors)
      `CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        purpose VARCHAR(255),
        message TEXT,
        donation_type VARCHAR(50) DEFAULT 'general',
        status VARCHAR(50) DEFAULT 'completed',
        receipt_number VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES users(id)
      )`,
      
      // Budget requests table (from students/departments)
      `CREATE TABLE IF NOT EXISTS budget_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER NOT NULL,
        requester_type VARCHAR(50) NOT NULL,
        event_name VARCHAR(255) NOT NULL,
        event_description TEXT NOT NULL,
        amount_requested DECIMAL(15,2) NOT NULL,
        event_date DATE,
        venue VARCHAR(255),
        expected_attendees INTEGER,
        category VARCHAR(100),
        justification TEXT,
        documents TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id)
      )`,
      
      // Allocations table (admin allocates donations to requests)
      `CREATE TABLE IF NOT EXISTS allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donation_id INTEGER NOT NULL,
        request_id INTEGER NOT NULL,
        amount_allocated DECIMAL(15,2) NOT NULL,
        allocation_notes TEXT,
        status VARCHAR(50) DEFAULT 'allocated',
        disbursed_at DATETIME,
        completed_at DATETIME,
        allocated_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id),
        FOREIGN KEY (request_id) REFERENCES budget_requests(id),
        FOREIGN KEY (allocated_by) REFERENCES users(id)
      )`,
      
      // Request approvals table
      `CREATE TABLE IF NOT EXISTS request_approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        comments TEXT,
        amount_approved DECIMAL(15,2),
        conditions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES budget_requests(id),
        FOREIGN KEY (admin_id) REFERENCES users(id)
      )`,
      
      // Transparency records view (for tracking complete flow)
      `CREATE VIEW IF NOT EXISTS transparency_view AS
        SELECT 
          d.id as donation_id,
          d.amount as donation_amount,
          d.purpose as donation_purpose,
          u1.email as donor_email,
          u1.name as donor_name,
          br.id as request_id,
          br.event_name,
          br.event_description,
          br.amount_requested,
          u2.email as requester_email,
          u2.name as requester_name,
          u2.role as requester_type,
          a.amount_allocated,
          a.status as allocation_status,
          d.created_at as donated_at,
          br.created_at as requested_at,
          a.created_at as allocated_at
        FROM donations d
        LEFT JOIN allocations a ON d.id = a.donation_id
        LEFT JOIN budget_requests br ON a.request_id = br.id
        LEFT JOIN users u1 ON d.donor_id = u1.id
        LEFT JOIN users u2 ON br.requester_id = u2.id`
    ];
    
    let completed = 0;
    schemas.forEach((schema, index) => {
      db.run(schema, (err) => {
        if (err) {
          console.error(`Error creating table ${index}:`, err);
          reject(err);
        } else {
          completed++;
          if (completed === schemas.length) {
            console.log('SQLite schema initialized successfully');
            resolve();
          }
        }
      });
    });
  });
};

// Seed demo data
const seedData = async () => {
  return new Promise((resolve, reject) => {
    // Check if users already exist
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row.count > 0) {
        console.log('Demo data already exists');
        resolve();
        return;
      }
      
      const bcrypt = require('bcryptjs');
      
      // Create demo users for all roles
      const users = [
        { 
          email: 'admin@college.edu', 
          password: 'admin123', 
          role: 'admin', 
          name: 'College Administrator',
          source_tag: null 
        },
        { 
          email: 'donor1@alumni.com', 
          password: 'donor123', 
          role: 'donor', 
          name: 'Alumni Association',
          source_tag: 'Alumni Association' 
        },
        { 
          email: 'donor2@corporate.com', 
          password: 'donor123', 
          role: 'donor', 
          name: 'Tech Corp Foundation',
          source_tag: 'Corporate Sponsorship' 
        },
        { 
          email: 'student1@college.edu', 
          password: 'student123', 
          role: 'student', 
          name: 'John Doe',
          department: 'Computer Science',
          student_id: 'CS2024001' 
        },
        { 
          email: 'student2@college.edu', 
          password: 'student123', 
          role: 'student', 
          name: 'Jane Smith',
          department: 'Electronics',
          student_id: 'EC2024002' 
        },
        { 
          email: 'dept.cs@college.edu', 
          password: 'dept123', 
          role: 'department', 
          name: 'Computer Science Department',
          department: 'Computer Science' 
        },
        { 
          email: 'dept.ec@college.edu', 
          password: 'dept123', 
          role: 'department', 
          name: 'Electronics Department',
          department: 'Electronics & Communication' 
        }
      ];
      
      let usersCreated = 0;
      users.forEach((user, index) => {
        bcrypt.hash(user.password, 12, (err, hash) => {
          if (err) {
            reject(err);
            return;
          }
          
          db.run(
            "INSERT INTO users (email, password_hash, role, name, department, student_id, source_tag) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [user.email, hash, user.role, user.name, user.department || null, user.student_id || null, user.source_tag || null],
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              
              usersCreated++;
              console.log(`Created user: ${user.email} (ID: ${this.lastID})`);
              
              if (usersCreated === users.length) {
                console.log('All users created, adding sample data...');
                
                // Create sample donations
                const sampleDonations = [
                  { donor_id: 2, amount: 100000, purpose: 'General College Development', message: 'Happy to support the college!' },
                  { donor_id: 2, amount: 50000, purpose: 'Student Events & Activities', message: 'For student welfare' },
                  { donor_id: 3, amount: 200000, purpose: 'Infrastructure Development', message: 'Corporate sponsorship for labs' }
                ];
                
                // Create sample budget requests
                const sampleRequests = [
                  { 
                    requester_id: 4, 
                    requester_type: 'student', 
                    event_name: 'Tech Fest 2024', 
                    event_description: 'Annual technical festival with workshops and competitions', 
                    amount_requested: 75000,
                    event_date: '2024-03-15',
                    venue: 'Main Auditorium',
                    expected_attendees: 500,
                    category: 'Cultural Event',
                    justification: 'To enhance technical skills and networking opportunities for students'
                  },
                  { 
                    requester_id: 5, 
                    requester_type: 'student', 
                    event_name: 'Robotics Workshop', 
                    event_description: 'Hands-on robotics workshop for engineering students', 
                    amount_requested: 25000,
                    event_date: '2024-02-20',
                    venue: 'Electronics Lab',
                    expected_attendees: 50,
                    category: 'Workshop',
                    justification: 'To provide practical exposure to robotics and automation'
                  },
                  { 
                    requester_id: 6, 
                    requester_type: 'department', 
                    event_name: 'Industry Expert Lecture Series', 
                    event_description: 'Monthly lectures by industry experts on latest technologies', 
                    amount_requested: 120000,
                    event_date: '2024-04-01',
                    venue: 'CS Department Hall',
                    expected_attendees: 200,
                    category: 'Academic Event',
                    justification: 'To bridge the gap between academia and industry'
                  }
                ];
                
                let donationsInserted = 0;
                let requestsInserted = 0;
                
                // Insert donations
                sampleDonations.forEach((donation, index) => {
                  db.run(
                    "INSERT INTO donations (donor_id, amount, purpose, message) VALUES (?, ?, ?, ?)",
                    [donation.donor_id, donation.amount, donation.purpose, donation.message],
                    function(err) {
                      if (err) {
                        console.error('Error inserting donation:', err);
                      } else {
                        donationsInserted++;
                        console.log(`Created sample donation ${donationsInserted}`);
                        
                        if (donationsInserted === sampleDonations.length && requestsInserted === sampleRequests.length) {
                          console.log('SQLite demo data seeded successfully');
                          resolve();
                        }
                      }
                    }
                  );
                });
                
                // Insert budget requests
                sampleRequests.forEach((request, index) => {
                  db.run(
                    "INSERT INTO budget_requests (requester_id, requester_type, event_name, event_description, amount_requested, event_date, venue, expected_attendees, category, justification) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [request.requester_id, request.requester_type, request.event_name, request.event_description, request.amount_requested, request.event_date, request.venue, request.expected_attendees, request.category, request.justification],
                    function(err) {
                      if (err) {
                        console.error('Error inserting request:', err);
                      } else {
                        requestsInserted++;
                        console.log(`Created sample request ${requestsInserted}`);
                        
                        if (donationsInserted === sampleDonations.length && requestsInserted === sampleRequests.length) {
                          console.log('SQLite demo data seeded successfully');
                          resolve();
                        }
                      }
                    }
                  );
                });
              }
            }
          );
        });
      });
    });
  });
};

// Initialize database
const initDatabase = async () => {
  try {
    await initSchema();
    await seedData();
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(-1);
  }
};

// PostgreSQL-like interface for SQLite
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (sql.toLowerCase().startsWith('select')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ rowCount: this.changes, rows: [{ id: this.lastID }] });
      });
    }
  });
};

// Initialize on startup
initDatabase();

module.exports = { query, db };