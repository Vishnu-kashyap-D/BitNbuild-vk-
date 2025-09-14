const Allocation = require('../models/Allocation');

class AllocationController {
  // Create new allocation (Admin only)
  static async createAllocation(req, res) {
    try {
      const { donation_id, beneficiary, beneficiary_type, reason, amount, notes } = req.body;
      
      // Create the allocation
      const allocation = await Allocation.create(
        {
          donation_id,
          beneficiary,
          beneficiary_type,
          reason,
          amount,
          notes
        },
        req.user.id // approved_by
      );
      
      res.status(201).json({
        success: true,
        message: 'Allocation created successfully',
        data: {
          allocation
        }
      });
      
    } catch (error) {
      console.error('Create allocation error:', error);
      
      // Handle specific error cases
      if (error.message === 'Donation not found') {
        return res.status(404).json({
          success: false,
          message: 'Donation not found'
        });
      }
      
      if (error.message.includes('Insufficient funds')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating allocation'
      });
    }
  }
  
  // Get all allocations (Admin only)
  static async getAllAllocations(req, res) {
    try {
      const allocations = await Allocation.getAll();
      
      res.status(200).json({
        success: true,
        message: 'Allocations retrieved successfully',
        data: {
          allocations,
          count: allocations.length
        }
      });
      
    } catch (error) {
      console.error('Get all allocations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching allocations'
      });
    }
  }
  
  // Get allocations by source tag (Donor access - matches their source_tag)
  static async getAllocationsBySourceTag(req, res) {
    try {
      const { source_tag } = req.params;
      
      const allocations = await Allocation.findBySourceTag(source_tag);
      
      res.status(200).json({
        success: true,
        message: 'Allocations retrieved successfully',
        data: {
          allocations,
          count: allocations.length,
          source_tag
        }
      });
      
    } catch (error) {
      console.error('Get allocations by source tag error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching allocations'
      });
    }
  }
  
  // Get allocation by ID (Admin only)
  static async getAllocationById(req, res) {
    try {
      const { id } = req.params;
      
      const allocation = await Allocation.findById(id);
      
      if (!allocation) {
        return res.status(404).json({
          success: false,
          message: 'Allocation not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Allocation retrieved successfully',
        data: {
          allocation
        }
      });
      
    } catch (error) {
      console.error('Get allocation by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching allocation'
      });
    }
  }
  
  // Get allocations by donation ID (Admin only)
  static async getAllocationsByDonationId(req, res) {
    try {
      const { donation_id } = req.params;
      
      const allocations = await Allocation.findByDonationId(donation_id);
      
      res.status(200).json({
        success: true,
        message: 'Allocations retrieved successfully',
        data: {
          allocations,
          count: allocations.length,
          donation_id: parseInt(donation_id)
        }
      });
      
    } catch (error) {
      console.error('Get allocations by donation ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching allocations'
      });
    }
  }
  
  // Get allocations by beneficiary type (Admin only)
  static async getAllocationsByBeneficiaryType(req, res) {
    try {
      const { beneficiary_type } = req.params;
      
      const allocations = await Allocation.findByBeneficiaryType(beneficiary_type);
      
      res.status(200).json({
        success: true,
        message: 'Allocations retrieved successfully',
        data: {
          allocations,
          count: allocations.length,
          beneficiary_type
        }
      });
      
    } catch (error) {
      console.error('Get allocations by beneficiary type error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching allocations'
      });
    }
  }
  
  // Get allocation statistics (Admin only)
  static async getAllocationStats(req, res) {
    try {
      const stats = await Allocation.getStats();
      
      res.status(200).json({
        success: true,
        message: 'Allocation statistics retrieved successfully',
        data: {
          stats: {
            total_allocations: parseInt(stats.total_allocations) || 0,
            total_allocated: parseFloat(stats.total_allocated) || 0,
            unique_beneficiary_types: parseInt(stats.unique_beneficiary_types) || 0,
            donations_with_allocations: parseInt(stats.donations_with_allocations) || 0,
            average_allocation: parseFloat(stats.average_allocation) || 0
          }
        }
      });
      
    } catch (error) {
      console.error('Get allocation stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching allocation statistics'
      });
    }
  }
}

module.exports = AllocationController;
