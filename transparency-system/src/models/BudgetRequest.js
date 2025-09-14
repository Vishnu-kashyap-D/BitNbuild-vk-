const pool = require('../config/database');

class BudgetRequest {
  // Create new budget request
  static async create(requestData) {
    try {
      const { 
        requester_id, 
        requester_type, 
        event_name, 
        event_description, 
        amount_requested, 
        event_date,
        venue,
        expected_attendees,
        category,
        justification,
        documents 
      } = requestData;
      
      const query = `
        INSERT INTO budget_requests (
          requester_id, requester_type, event_name, event_description, 
          amount_requested, event_date, venue, expected_attendees, 
          category, justification, documents
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await pool.query(query, [
        requester_id, requester_type, event_name, event_description,
        amount_requested, event_date, venue, expected_attendees,
        category, justification, documents
      ]);
      
      return { id: result.rows[0].id };
    } catch (error) {
      console.error('Error creating budget request:', error);
      throw error;
    }
  }

  // Get request by ID
  static async findById(id) {
    try {
      const query = `
        SELECT br.*, 
               u.name as requester_name, 
               u.email as requester_email,
               u.department,
               u.student_id
        FROM budget_requests br
        JOIN users u ON br.requester_id = u.id
        WHERE br.id = ?
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding request by ID:', error);
      throw error;
    }
  }

  // Get all requests (admin only)
  static async getAll() {
    try {
      const query = `
        SELECT br.*, 
               u.name as requester_name, 
               u.email as requester_email,
               u.department,
               u.student_id
        FROM budget_requests br
        JOIN users u ON br.requester_id = u.id
        ORDER BY br.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all requests:', error);
      throw error;
    }
  }

  // Get requests by requester
  static async getByRequester(requester_id) {
    try {
      const query = `
        SELECT br.*, 
               u.name as requester_name, 
               u.email as requester_email,
               u.department,
               u.student_id
        FROM budget_requests br
        JOIN users u ON br.requester_id = u.id
        WHERE br.requester_id = ?
        ORDER BY br.created_at DESC
      `;
      const result = await pool.query(query, [requester_id]);
      return result.rows;
    } catch (error) {
      console.error('Error getting requests by requester:', error);
      throw error;
    }
  }

  // Get requests by status
  static async getByStatus(status) {
    try {
      const query = `
        SELECT br.*, 
               u.name as requester_name, 
               u.email as requester_email,
               u.department,
               u.student_id
        FROM budget_requests br
        JOIN users u ON br.requester_id = u.id
        WHERE br.status = ?
        ORDER BY br.created_at DESC
      `;
      const result = await pool.query(query, [status]);
      return result.rows;
    } catch (error) {
      console.error('Error getting requests by status:', error);
      throw error;
    }
  }

  // Update request status
  static async updateStatus(id, status, admin_notes = null) {
    try {
      const query = `
        UPDATE budget_requests 
        SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      const result = await pool.query(query, [status, admin_notes, id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  // Get request statistics
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_requests,
          SUM(amount_requested) as total_amount_requested,
          AVG(amount_requested) as average_amount_requested,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
          COUNT(DISTINCT requester_id) as unique_requesters
        FROM budget_requests
      `;
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting request statistics:', error);
      throw error;
    }
  }

  // Get requests with allocations
  static async getRequestsWithAllocations() {
    try {
      const query = `
        SELECT 
          br.*,
          u.name as requester_name,
          u.email as requester_email,
          u.department,
          u.student_id,
          COALESCE(SUM(a.amount_allocated), 0) as allocated_amount,
          CASE 
            WHEN SUM(a.amount_allocated) > 0 THEN 'allocated'
            ELSE br.status
          END as final_status
        FROM budget_requests br
        JOIN users u ON br.requester_id = u.id
        LEFT JOIN allocations a ON br.id = a.request_id
        GROUP BY br.id, u.name, u.email, u.department, u.student_id
        ORDER BY br.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting requests with allocations:', error);
      throw error;
    }
  }

  // Delete request
  static async delete(id) {
    try {
      const query = 'DELETE FROM budget_requests WHERE id = ?';
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  }

  // Update request
  static async update(id, updateData) {
    try {
      const {
        event_name,
        event_description,
        amount_requested,
        event_date,
        venue,
        expected_attendees,
        category,
        justification,
        documents
      } = updateData;

      const query = `
        UPDATE budget_requests 
        SET 
          event_name = ?,
          event_description = ?,
          amount_requested = ?,
          event_date = ?,
          venue = ?,
          expected_attendees = ?,
          category = ?,
          justification = ?,
          documents = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const result = await pool.query(query, [
        event_name, event_description, amount_requested, event_date,
        venue, expected_attendees, category, justification, documents, id
      ]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  }
}

module.exports = BudgetRequest;