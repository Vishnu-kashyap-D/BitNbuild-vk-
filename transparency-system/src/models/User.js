const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Find user by email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ?';
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const query = 'SELECT id, email, role, name, department, student_id, source_tag, created_at FROM users WHERE id = ?';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const { email, password, role, name, department, student_id, source_tag } = userData;
      
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const query = `
        INSERT INTO users (email, password_hash, role, name, department, student_id, source_tag)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await pool.query(query, [email, hashedPassword, role, name, department, student_id, source_tag]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  // Get all users (admin only)
  static async getAll() {
    try {
      const query = 'SELECT id, email, role, name, department, student_id, source_tag, created_at FROM users ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
  
  // Get users by role
  static async getByRole(role) {
    try {
      const query = 'SELECT id, email, role, name, department, student_id, source_tag, created_at FROM users WHERE role = ? ORDER BY created_at DESC';
      const result = await pool.query(query, [role]);
      return result.rows;
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }
}

module.exports = User;
