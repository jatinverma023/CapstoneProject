const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbotService');
const { protect, authorize } = require('../middleware/auth');
const Assignment = require('../models/Assignment');

// ⭐ Rate limiting per user (in-memory, simple)
const userRateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(userId) {
  const now = Date.now();
  const userKey = userId.toString();
  
  if (!userRateLimits.has(userKey)) {
    userRateLimits.set(userKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  const userLimit = userRateLimits.get(userKey);
  
  // Reset if window expired
  if (now > userLimit.resetAt) {
    userRateLimits.set(userKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  // Check if over limit
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetIn = Math.ceil((userLimit.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  // Increment count
  userLimit.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - userLimit.count };
}

// Purge expired rate-limit entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of userRateLimits) {
    if (now > val.resetAt) userRateLimits.delete(key);
  }
}, 5 * 60 * 1000);

// Chat with AI Assistant
router.post('/chat', protect, async (req, res) => {
  try {
    // ⭐ Check rate limit
    const rateLimit = checkRateLimit(req.user._id);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        success: false,
        message: `Too many requests. Please wait ${rateLimit.resetIn} seconds.`,
        retryAfter: rateLimit.resetIn
      });
    }

    const { message, assignmentId, conversationHistory } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Message is required' 
      });
    }

    let assignmentContext = null;
    
    // Get assignment context if provided
    if (assignmentId) {
      try {
        const assignment = await Assignment.findById(assignmentId);
        if (assignment) {
          assignmentContext = {
            title: assignment.title,
            description: assignment.description,
            due_date: assignment.due_date,
            maxMarks: assignment.maxMarks
          };
        }
      } catch (dbErr) {
        console.error('Failed to fetch assignment:', dbErr);
        // Continue without context
      }
    }

    // Get AI response
    const result = await chatbotService.chat(
      message,
      assignmentContext,
      conversationHistory || []
    );

    // ⭐ Always return success=true for graceful degradation
    res.json({
      success: true,
      response: result.message,
      timestamp: result.timestamp,
      mode: result.mode, // 'generative_api', 'smart_assistant', 'circuit_breaker', etc.
      metadata: {
        attempts: result.attempts,
        usedFallback: result.usedFallback,
        circuitState: result.circuitState,
        rateLimit: {
          remaining: rateLimit.remaining,
          limit: MAX_REQUESTS_PER_WINDOW
        }
      }
    });

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process chat message. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ⭐ NEW: Get chatbot status (circuit breaker state)
router.get('/status', protect, async (req, res) => {
  try {
    const circuitState = chatbotService.getCircuitStatus();
    res.json({
      success: true,
      circuit: circuitState,
      apiConfigured: !!process.env.GOOGLE_API_KEY
    });
  } catch (error) {
    console.error('Status Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get status' 
    });
  }
});


// Reset circuit breaker (admin only)
router.post('/reset', protect, authorize('admin'), async (req, res) => {
  try {
    const result = chatbotService.resetCircuit();
    res.json({
      success: true,
      message: 'Circuit breaker reset successfully',
      ...result
    });
  } catch (error) {
    console.error('Reset Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reset circuit breaker' 
    });
  }
});

module.exports = router;