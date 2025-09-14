const express = require('express');
const router = express.Router();
const AllocationController = require('../controllers/allocationController');
const { authenticateToken, requireDonorAccess } = require('../middleware/auth');
const { validateSourceTag } = require('../middleware/validation');

// This route allows donors to see allocations for their specific source_tag
// GET /api/donations/:source_tag/allocations
router.get('/:source_tag/allocations', 
  authenticateToken, 
  validateSourceTag,
  requireDonorAccess,
  AllocationController.getAllocationsBySourceTag
);

module.exports = router;
