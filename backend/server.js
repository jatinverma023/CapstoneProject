require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const analyticsRouter = require('./routes/analytics');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Assignment API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
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
