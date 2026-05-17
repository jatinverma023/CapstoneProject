require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const analyticsRouter = require('./routes/analytics');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per window
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});


// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Assignment API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/auth', authLimiter, require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/assignments', require('./routes/assignments'));
app.use('/api/v1/submissions', require('./routes/submissions'));
app.use('/api/v1/chatbot', require('./routes/chatbot')); // ⬅️ ADD THIS LINE

// 404 handler
app.get('/', (req, res) => {
  res.json({
    service: "Smart Assignment Backend",
    status: "Running",
    api: "/api/v1"
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🤖 AI Chatbot enabled with Gemini API`); // ⬅️ ADD THIS LOG
});
