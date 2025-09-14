const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await User.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
        }
      );
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            source_tag: user.source_tag
          }
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }
  
  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            source_tag: user.source_tag,
            created_at: user.created_at
          }
        }
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  
  // Validate token endpoint
  static async validateToken(req, res) {
    try {
      // If we reach here, token is valid (middleware already validated it)
      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            source_tag: req.user.source_tag
          }
        }
      });
      
    } catch (error) {
      console.error('Validate token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;
