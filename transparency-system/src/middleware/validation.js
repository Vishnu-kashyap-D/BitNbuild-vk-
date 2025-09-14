const { body, param, validationResult } = require('express-validator');

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

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

// Donation validation
const validateDonation = [
  body('source_tag')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Source tag is required and must be less than 255 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('financial_year')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Financial year must be in format YYYY-YYYY (e.g., 2024-2025)'),
  handleValidationErrors
];

// Allocation validation
const validateAllocation = [
  body('donation_id')
    .isInt({ min: 1 })
    .withMessage('Valid donation ID is required'),
  body('beneficiary')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Beneficiary name is required and must be less than 255 characters'),
  body('beneficiary_type')
    .isIn(['department', 'student', 'project', 'vendor', 'other'])
    .withMessage('Beneficiary type must be one of: department, student, project, vendor, other'),
  body('reason')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Reason is required and must be less than 1000 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  handleValidationErrors
];

// Source tag parameter validation
const validateSourceTag = [
  param('source_tag')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Valid source tag is required'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateDonation,
  validateAllocation,
  validateSourceTag,
  handleValidationErrors
};
