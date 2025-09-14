const express = require('express');
const router = express.Router();
const BudgetRequest = require('../models/BudgetRequest');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware for budget requests
const validateBudgetRequest = [
  body('event_name').trim().isLength({ min: 1, max: 255 }).withMessage('Event name is required'),
  body('event_description').trim().isLength({ min: 1, max: 1000 }).withMessage('Event description is required'),
  body('amount_requested').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('event_date').optional().isISO8601().withMessage('Invalid date format'),
  body('venue').optional().trim().isLength({ max: 255 }).withMessage('Venue too long'),
  body('expected_attendees').optional().isInt({ min: 1 }).withMessage('Expected attendees must be positive'),
  body('category').optional().trim().isLength({ max: 100 }).withMessage('Category too long'),
  body('justification').trim().isLength({ min: 1, max: 1000 }).withMessage('Justification is required'),
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Create new budget request (Students and Departments only)
router.post('/', authenticateToken, requireRole(['student', 'department']), validateBudgetRequest, handleValidationErrors, async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      requester_id: req.user.userId,
      requester_type: req.user.role
    };

    const result = await BudgetRequest.create(requestData);
    
    res.status(201).json({
      success: true,
      message: 'Budget request created successfully',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('Error creating budget request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget request'
    });
  }
});

// Get all budget requests (Admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const requests = await BudgetRequest.getAll();
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching budget requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget requests'
    });
  }
});

// Get budget requests by status (Admin only)
router.get('/status/:status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status } = req.params;
    const requests = await BudgetRequest.getByStatus(status);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching requests by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// Get user's own budget requests (Students and Departments)
router.get('/my-requests', authenticateToken, requireRole(['student', 'department']), async (req, res) => {
  try {
    const requests = await BudgetRequest.getByRequester(req.user.userId);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// Get specific budget request by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BudgetRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Budget request not found'
      });
    }

    // Check permissions
    if (req.user.role === 'admin' || request.requester_id === req.user.userId) {
      res.json({
        success: true,
        data: request
      });
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
  } catch (error) {
    console.error('Error fetching budget request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget request'
    });
  }
});

// Update budget request status (Admin only)
router.patch('/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updated = await BudgetRequest.updateStatus(id, status, admin_notes);
    
    if (updated) {
      res.json({
        success: true,
        message: 'Request status updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Budget request not found'
      });
    }
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request status'
    });
  }
});

// Update budget request (Only requester can update pending requests)
router.put('/:id', authenticateToken, requireRole(['student', 'department']), validateBudgetRequest, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BudgetRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Budget request not found'
      });
    }

    if (request.requester_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be updated'
      });
    }

    const updated = await BudgetRequest.update(id, req.body);
    
    if (updated) {
      res.json({
        success: true,
        message: 'Budget request updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update budget request'
      });
    }
  } catch (error) {
    console.error('Error updating budget request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget request'
    });
  }
});

// Delete budget request (Only requester can delete pending requests)
router.delete('/:id', authenticateToken, requireRole(['student', 'department']), async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BudgetRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Budget request not found'
      });
    }

    if (request.requester_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be deleted'
      });
    }

    const deleted = await BudgetRequest.delete(id);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Budget request deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete budget request'
      });
    }
  } catch (error) {
    console.error('Error deleting budget request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete budget request'
    });
  }
});

// Get budget request statistics (Admin only)
router.get('/admin/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await BudgetRequest.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching request statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;