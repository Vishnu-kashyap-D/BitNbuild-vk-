const pool = require('../config/database');

class Donation {
  // Create new donation
  static async create(donationData) {
    try {
      const { donor_id, amount, purpose, message, donation_type } = donationData;
      
      // Generate receipt number
      const receipt_number = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const query = `
        INSERT INTO donations (donor_id, amount, purpose, message, donation_type, receipt_number)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await pool.query(query, [donor_id, amount, purpose, message, donation_type || 'general', receipt_number]);
      return { id: result.rows[0].id, receipt_number };
    } catch (error) {
      console.error('Error creating donation:', error);
      throw error;
    }
  }

  // Get donation by ID
  static async findById(id) {
    try {
      const query = `
        SELECT d.*, u.name as donor_name, u.email as donor_email, u.source_tag
        FROM donations d
        JOIN users u ON d.donor_id = u.id
        WHERE d.id = ?
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding donation by ID:', error);
      throw error;
    }
  }

  // Get all donations (admin only)
  static async getAll() {
    try {
      const query = `
        SELECT d.*, u.name as donor_name, u.email as donor_email, u.source_tag
        FROM donations d
        JOIN users u ON d.donor_id = u.id
        ORDER BY d.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all donations:', error);
      throw error;
    }
  }

  // Get donations by donor
  static async getByDonor(donor_id) {
    try {
      const query = `
        SELECT d.*, u.name as donor_name, u.email as donor_email
        FROM donations d
        JOIN users u ON d.donor_id = u.id
        WHERE d.donor_id = ?
        ORDER BY d.created_at DESC
      `;
      const result = await pool.query(query, [donor_id]);
      return result.rows;
    } catch (error) {
      console.error('Error getting donations by donor:', error);
      throw error;
    }
  }

  // Get donation statistics
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_donations,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          COUNT(DISTINCT donor_id) as unique_donors
        FROM donations
        WHERE status = 'completed'
      `;
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting donation statistics:', error);
      throw error;
    }
  }

  // Get donations with allocation status
  static async getDonationsWithAllocations() {
    try {
      const query = `
        SELECT 
          d.*,
          u.name as donor_name,
          u.email as donor_email,
          u.source_tag,
          COALESCE(SUM(a.amount_allocated), 0) as allocated_amount,
          (d.amount - COALESCE(SUM(a.amount_allocated), 0)) as remaining_amount
        FROM donations d
        JOIN users u ON d.donor_id = u.id
        LEFT JOIN allocations a ON d.id = a.donation_id
        GROUP BY d.id, u.name, u.email, u.source_tag
        ORDER BY d.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting donations with allocations:', error);
      throw error;
    }
  }

  // Update donation status
  static async updateStatus(id, status) {
    try {
      const query = 'UPDATE donations SET status = ? WHERE id = ?';
      const result = await pool.query(query, [status, id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating donation status:', error);
      throw error;
    }
  }

  // Validate sufficient funds for allocation
  static async validateSufficientFunds(donationId, allocationAmount) {
    try {
      const donations = await this.getDonationsWithAllocations();
      const donation = donations.find(d => d.id === donationId);
      
      if (!donation) {
        throw new Error('Donation not found');
      }
      
      const remainingAmount = parseFloat(donation.remaining_amount || donation.amount);
      const requestedAmount = parseFloat(allocationAmount);
      
      return remainingAmount >= requestedAmount;
    } catch (error) {
      console.error('Error validating sufficient funds:', error);
      throw error;
    }
  }
}

module.exports = Donation;
