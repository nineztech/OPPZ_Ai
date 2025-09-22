import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sequelize } from './config/dbConnection.js';
import routes from './routes/index.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 8080; // Changed from 5006 to 8080 for Railway

// Trust proxy (important for Railway)
app.set('trust proxy', 1);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', // Additional local port
      'https://www.oppzai.com',
      'https://oppzai.com', // Without www
      'chrome-extension://edejolphacgbhddjeoomiadkgfaocjcj',
    ];
    
    // Add environment URL if it exists
    if (process.env.USER_URL) {
      allowedOrigins.push(process.env.USER_URL);
    }
    
    // Allow chrome extensions and moz extensions
    if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept',
    'Origin',
    'X-Requested-With',
    'Cache-Control',
    'X-Access-Token'
  ],
  exposedHeaders: ['Content-Length'],
  optionsSuccessStatus: 200 // For legacy browser support
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Request logging middleware (before routes)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  next();
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploads folder
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api', routes);

// Health check with more info
app.get('/health', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date(),
    port: PORT,
    environment: process.env.NODE_ENV,
    uploadsDir: uploadsDir,
    corsEnabled: true
  });
});

// Debug route (remove after fixing issues)
app.get('/api/debug-env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    port: PORT,
    emailUser: process.env.EMAIL_USER ? 'Set' : 'Not Set',
    emailPass: process.env.EMAIL_PASS ? 'Set' : 'Not Set',
    userUrl: process.env.USER_URL || 'Not Set',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not Set',
    timestamp: new Date().toISOString()
  });
});

// CORS Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error caught by middleware:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      message: 'This origin is not allowed to access this resource',
      origin: req.headers.origin
    });
  }
  
  // Handle other errors
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/health', '/api/debug-env', '/api/users/*']
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('Starting server...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Port:', PORT);
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');
    
    await sequelize.authenticate();
    console.log('Database connected');
    
    await sequelize.sync();
    console.log('Models synced');
    
    app.listen(PORT, '0.0.0.0', () => { // Listen on all interfaces for Railway
      console.log(`Server running on port ${PORT}`);
      console.log(`Uploads directory: ${uploadsDir}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Debug endpoint: http://localhost:${PORT}/api/debug-env`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
};

startServer();
