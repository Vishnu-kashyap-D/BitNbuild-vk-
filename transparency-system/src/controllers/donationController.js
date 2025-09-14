const Donation = require('../models/Donation');

class DonationController {
  // Create new donation (Admin only)
  static async createDonation(req, res) {
    try {
      const { source_tag, amount, description, financial_year } = req.body;
      
      // Create the donation
      const donation = await Donation.create({
        source_tag,
        amount,
        description,
        financial_year: financial_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
      });
      
      res.status(201).json({
        success: true,
        message: 'Donation created successfully',
        data: {
          donation
        }
      });
      
    } catch (error) {
      console.error('Create donation error:', error);
      
      // Handle duplicate source_tag error
      if (error.code === '23505' && error.constraint && error.constraint.includes('source_tag')) {
        return res.status(400).json({
          success: false,
          message: 'Source tag already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating donation'
      });
    }
  }
  
  // Get all donations (Admin only)
  static async getAllDonations(req, res) {
    try {
      const donations = await Donation.getAll();
      
      res.status(200).json({
        success: true,
        message: 'Donations retrieved successfully',
        data: {
          donations,
          count: donations.length
        }
      });
      
    } catch (error) {
      console.error('Get all donations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching donations'
      });
    }
  }
  
  // Get donation by ID (Admin only)
  static async getDonationById(req, res) {
    try {
      const { id } = req.params;
      
      const donation = await Donation.findById(id);
      
      if (!donation) {
        return res.status(404).json({
          success: false,
          message: 'Donation not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Donation retrieved successfully',
        data: {
          donation
        }
      });
      
    } catch (error) {
      console.error('Get donation by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching donation'
      });
    }
  }
  
  // Get donations by source tag (Admin only - internal use)
  static async getDonationsBySourceTag(req, res) {
    try {
      const { source_tag } = req.params;
      
      const donations = await Donation.findBySourceTag(source_tag);
      
      res.status(200).json({
        success: true,
        message: 'Donations retrieved successfully',
        data: {
          donations,
          count: donations.length,
          source_tag
        }
      });
      
    } catch (error) {
      console.error('Get donations by source tag error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching donations'
      });
    }
  }
  
  // Get donation statistics (Admin only)
  static async getDonationStats(req, res) {
    try {
      const stats = await Donation.getStats();
      
      res.status(200).json({
        success: true,
        message: 'Donation statistics retrieved successfully',
        data: {
          stats: {
            total_donations: parseInt(stats.total_donations) || 0,
            total_amount: parseFloat(stats.total_amount) || 0,
            unique_sources: parseInt(stats.unique_sources) || 0,
            average_donation: parseFloat(stats.average_donation) || 0
          }
        }
      });
      
    } catch (error) {
      console.error('Get donation stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching donation statistics'
      });
    }
  }
}

module.exports = DonationController;
