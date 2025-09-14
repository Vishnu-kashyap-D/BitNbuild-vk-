const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth');
const donationRoutes = require('./src/routes/donations');
const allocationRoutes = require('./src/routes/allocations');
const donorRoutes = require('./src/routes/donor');

// Import database connection
const pool = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Add your production domain(s)
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'], // Development origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/allocations', allocationRoutes);

// Special donor route - this matches the required endpoint pattern
// GET /api/donations/:source_tag/allocations
app.use('/api/donations', donorRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Transparency System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        validate: 'GET /api/auth/validate'
      },
      donations: {
        create: 'POST /api/donations (Admin only)',
        getAll: 'GET /api/donations (Admin only)',
        getById: 'GET /api/donations/:id (Admin only)',
        getStats: 'GET /api/donations/stats (Admin only)'
      },
      allocations: {
        create: 'POST /api/allocations (Admin only)',
        getAll: 'GET /api/allocations (Admin only)',
        getById: 'GET /api/allocations/:id (Admin only)',
        getStats: 'GET /api/allocations/stats (Admin only)',
        getBySourceTag: 'GET /api/donations/:source_tag/allocations (Donor only)'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
    
  res.status(500).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Transparency System API Server Started
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: ${process.env.DB_NAME || 'transparency_system'}
🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}
⏰ Started at: ${new Date().toISOString()}

📋 Available endpoints:
• POST   /api/auth/login
• GET    /api/auth/profile
• POST   /api/donations (Admin)
• GET    /api/donations (Admin)  
• POST   /api/allocations (Admin)
• GET    /api/donations/:source_tag/allocations (Donor)
• GET    /health
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

module.exports = app;
