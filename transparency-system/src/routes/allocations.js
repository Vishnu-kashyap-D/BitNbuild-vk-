const express = require('express');
const router = express.Router();
const AllocationController = require('../controllers/allocationController');
const { authenticateToken, requireAdmin, requireDonorAccess } = require('../middleware/auth');
const { validateAllocation, validateSourceTag } = require('../middleware/validation');

// Create allocation (Admin only)
router.post('/', authenticateToken, requireAdmin, validateAllocation, AllocationController.createAllocation);

// Get all allocations (Admin only)
router.get('/', authenticateToken, requireAdmin, AllocationController.getAllAllocations);

// Get allocation statistics (Admin only)
router.get('/stats', authenticateToken, requireAdmin, AllocationController.getAllocationStats);

// Get allocation by ID (Admin only)
router.get('/:id', authenticateToken, requireAdmin, AllocationController.getAllocationById);

// Get allocations by donation ID (Admin only)
router.get('/donation/:donation_id', authenticateToken, requireAdmin, AllocationController.getAllocationsByDonationId);

// Get allocations by beneficiary type (Admin only)
router.get('/beneficiary/:beneficiary_type', authenticateToken, requireAdmin, AllocationController.getAllocationsByBeneficiaryType);

module.exports = router;
