const express = require('express');
const router = express.Router();
const DonationController = require('../controllers/donationController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateDonation } = require('../middleware/validation');

// All donation routes require authentication and admin access
router.use(authenticateToken);
router.use(requireAdmin);

// Donation routes (Admin only)
router.post('/', validateDonation, DonationController.createDonation);
router.get('/', DonationController.getAllDonations);
router.get('/stats', DonationController.getDonationStats);
router.get('/:id', DonationController.getDonationById);
router.get('/source/:source_tag', DonationController.getDonationsBySourceTag);

module.exports = router;
