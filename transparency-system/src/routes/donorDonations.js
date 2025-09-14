const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware for donations
const validateDonation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('purpose').trim().isLength({ min: 1, max: 255 }).withMessage('Purpose is required and must be less than 255 characters'),
  body('message').optional().trim().isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
  body('donation_type').optional().isIn(['general', 'education', 'infrastructure', 'events', 'scholarship']).withMessage('Invalid donation type'),
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

// Create new donation (Donors only)
router.post('/', authenticateToken, requireRole(['donor']), validateDonation, handleValidationErrors, async (req, res) => {
  try {
    const donationData = {
      ...req.body,
      donor_id: req.user.userId
    };

    const result = await Donation.create(donationData);
    
    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: {
        id: result.id,
        receipt_number: result.receipt_number
      }
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create donation'
    });
  }
});

// Get donor's own donations
router.get('/my-donations', authenticateToken, requireRole(['donor']), async (req, res) => {
  try {
    const donations = await Donation.getByDonor(req.user.userId);
    
    res.json({
      success: true,
      data: donations
    });
  } catch (error) {
    console.error('Error fetching donor donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations'
    });
  }
});

// Get all donations (Admin only)
router.get('/all', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const donations = await Donation.getAll();
    
    res.json({
      success: true,
      data: donations
    });
  } catch (error) {
    console.error('Error fetching all donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations'
    });
  }
});

// Get donations with allocation information (Admin only)
router.get('/with-allocations', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const donations = await Donation.getDonationsWithAllocations();
    
    res.json({
      success: true,
      data: donations
    });
  } catch (error) {
    console.error('Error fetching donations with allocations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations'
    });
  }
});

// Get specific donation by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await Donation.findById(id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check permissions
    if (req.user.role === 'admin' || donation.donor_id === req.user.userId) {
      res.json({
        success: true,
        data: donation
      });
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation'
    });
  }
});

// Get donation statistics (Admin only)
router.get('/admin/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await Donation.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching donation statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;