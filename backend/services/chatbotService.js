// chatbotService.js - Enhanced with circuit breaker and better error handling
require('dotenv').config();
const fetch = require('node-fetch');
const util = require('util');

// Config
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null;
const GENERATIVE_MODEL = process.env.GENERATIVE_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = process.env.FALLBACK_MODEL || null;
const API_BASE = process.env.GENERATIVE_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';

// Retry/backoff config
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3); // Reduced from 4
const BASE_DELAY_MS = Number(process.env.BASE_DELAY_MS || 500);

// ⭐ CIRCUIT BREAKER - Prevents hammering a failing API
const circuitBreaker = {
  failures: 0,
  lastFailureTime: null,
  threshold: 3, // Open circuit after 3 failures
  timeout: 60000, // 1 minute cooldown
  halfOpenAttempts: 0,
  maxHalfOpenAttempts: 1,
  
  isOpen() {
    if (this.failures >= this.threshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.timeout) {
        return true; // Circuit is OPEN - block requests
      }
      // Try half-open state
      if (this.halfOpenAttempts < this.maxHalfOpenAttempts) {
        console.log(`[${nowIso()}] Circuit breaker: Attempting half-open state`);
        return false;
      }
      return true;
    }
    return false;
  },
  
  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.halfOpenAttempts = 0;
    console.warn(`[${nowIso()}] Circuit breaker: Failure recorded (${this.failures}/${this.threshold})`);
  },
  
  recordSuccess() {
    console.log(`[${nowIso()}] Circuit breaker: Success - resetting`);
    this.failures = 0;
    this.halfOpenAttempts = 0;
  },
  
  attemptHalfOpen() {
    this.halfOpenAttempts++;
  },
  
  reset() {
    this.failures = 0;
    this.lastFailureTime = null;
    this.halfOpenAttempts = 0;
  },
  
  getStatus() {
    if (this.failures >= this.threshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      const remainingCooldown = Math.max(0, this.timeout - timeSinceLastFailure);
      return {
        state: 'OPEN',
        failures: this.failures,
        cooldownRemaining: Math.ceil(remainingCooldown / 1000) // seconds
      };
    }
    return {
      state: 'CLOSED',
      failures: this.failures
    };
  }
};

// Helpers
function redactKey(key) { 
  if (!key) return null; 
  return key.length > 8 ? `${key.slice(0,6)}...${key.slice(-2)}` : 'REDACTED'; 
}
function nowIso() { return new Date().toISOString(); }
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ⭐ ENHANCED Smart fallback with better responses
function getSmartResponse(message, assignmentContext, errorReason = null) {
  const lower = (message || '').toLowerCase();
  
  // If circuit breaker is open, inform user
  if (errorReason === 'circuit_open') {
    const status = circuitBreaker.getStatus();
    return `⚠️ AI service is temporarily unavailable (cooling down for ~${status.cooldownRemaining}s). Here's what I can help with:\n\n${getContextualHelp(lower, assignmentContext)}`;
  }
  
  // Greeting
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
    return `👋 Hello! I'm your AI Study Assistant. I can help you with assignments, code, or concepts. What are you working on today?`;
  }
  
  // Start/how to begin
  if (lower.includes('start') || lower.includes('begin') || lower.includes('how do i')) {
    if (assignmentContext) {
      return `To start **"${assignmentContext.title}"**:\n\n1. **Understand the requirements**: ${assignmentContext.description || 'Review the assignment description carefully'}\n2. **Plan your approach**: Break down the task into smaller steps\n3. **Start with basics**: Build incrementally and test as you go\n4. **Ask specific questions**: I'm here if you get stuck!\n\n💡 Tip: Focus on one section at a time.`;
    }
    return `To start any assignment:\n1. Read requirements carefully\n2. Break it into smaller tasks\n3. Plan before coding/writing\n4. Test frequently\n\nWhat specific assignment are you working on?`;
  }
  
  // Requirements/explanation
  if (lower.includes('requirement') || lower.includes('explain') || lower.includes('what is')) {
    if (assignmentContext) {
      return `📋 **${assignmentContext.title}** Requirements:\n\n${assignmentContext.description || 'Check your assignment details for specific requirements.'}\n\n**Due Date**: ${assignmentContext.due_date || 'Check your dashboard'}\n**Max Marks**: ${assignmentContext.maxMarks || 'N/A'}\n\nNeed help with a specific part?`;
    }
    return `I can explain assignment requirements! Please select an assignment or ask a specific question.`;
  }
  
  // Key points
  if (lower.includes('key point') || lower.includes('important') || lower.includes('focus')) {
    return `🎯 Key Points for Success:\n\n✅ Understand requirements fully\n✅ Follow instructions precisely\n✅ Test your work thoroughly\n✅ Submit before deadline\n✅ Ask questions when stuck\n\nWhat specific area do you need help with?`;
  }
  
  // Resources
  if (lower.includes('resource') || lower.includes('learn') || lower.includes('study')) {
    return `📚 Learning Resources:\n\n• **Documentation**: Official docs for your tech stack\n• **Practice**: Coding platforms (LeetCode, HackerRank)\n• **Videos**: YouTube tutorials\n• **Communities**: Stack Overflow, Reddit\n\nWhat topic do you want to learn more about?`;
  }
  
  // Code/programming help
  if (lower.includes('code') || lower.includes('python') || lower.includes('javascript') || lower.includes('program')) {
    return `💻 Coding Tips:\n\n1. **Start simple**: Write pseudocode first\n2. **Test frequently**: Run your code often\n3. **Debug systematically**: Use print statements\n4. **Read errors carefully**: They tell you what's wrong\n5. **Search wisely**: Google error messages\n\nWhat specific coding issue are you facing?`;
  }
  
  // Default contextual response
  return getContextualHelp(lower, assignmentContext);
}

function getContextualHelp(lower, assignmentContext) {
  if (assignmentContext) {
    return `I'm here to help with **"${assignmentContext.title}"**!\n\nI can assist with:\n• Understanding requirements\n• Breaking down tasks\n• Coding help\n• Study strategies\n• Finding resources\n\nWhat specific part are you working on?`;
  }
  return `I'm your AI Study Assistant! 🎓\n\nI can help you with:\n• Assignment guidance\n• Coding problems\n• Concept explanations\n• Study tips\n• Resource suggestions\n\nWhat would you like help with?`;
}

// Extract text from response (robust)
function extractTextFromGenerateResponse(json) {
  try {
    if (!json) return null;
    if (Array.isArray(json.candidates) && json.candidates.length) {
      const c0 = json.candidates[0];
      if (Array.isArray(c0.content)) {
        for (const contentEntry of c0.content) {
          if (contentEntry?.parts && Array.isArray(contentEntry.parts)) {
            for (const p of contentEntry.parts) {
              if (typeof p.text === 'string' && p.text.trim()) return p.text.trim();
            }
          }
          if (typeof contentEntry.text === 'string' && contentEntry.text.trim()) return contentEntry.text.trim();
        }
      }
      if (c0?.content?.parts && Array.isArray(c0.content.parts)) {
        return c0.content.parts.map(p => (p.text || '')).join('\n').trim() || null;
      }
      if (typeof c0.output === 'string' && c0.output.trim()) return c0.output.trim();
      if (typeof c0.message === 'string' && c0.message.trim()) return c0.message.trim();
    }
    if (typeof json.output === 'string' && json.output.trim()) return json.output.trim();
    if (typeof json.text === 'string' && json.text.trim()) return json.text.trim();
    if (json?.candidates?.[0]?.output) return String(json.candidates[0].output).trim();
    return null;
  } catch (e) {
    console.error('Error extracting text:', e);
    return null;
  }
}

// Single-call to generate
async function doCallGenerate(prompt, modelId, useKeyQueryParam = false) {
  if (!GOOGLE_API_KEY) {
    const e = new Error('Missing GOOGLE_API_KEY');
    e.code = 'NO_CREDENTIAL';
    throw e;
  }

  let modelPath = modelId;
  if (!modelPath.startsWith('models/')) modelPath = `models/${modelPath}`;
  let url = `${API_BASE}/${modelPath}:generateContent`;
  if (useKeyQueryParam) url += (url.includes('?') ? '&' : '?') + `key=${encodeURIComponent(GOOGLE_API_KEY)}`;

  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };
  const headers = { 'Content-Type': 'application/json' };
  if (!useKeyQueryParam && GOOGLE_API_KEY) headers['x-goog-api-key'] = GOOGLE_API_KEY;

  console.log(`[${nowIso()}] doCallGenerate -> ${modelPath} (useKeyQueryParam=${useKeyQueryParam})`);

  const resp = await fetch(url, { 
    method: 'POST', 
    headers, 
    body: JSON.stringify(requestBody),
    timeout: 30000 // 30 second timeout
  });
  
  const text = await resp.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch (parseErr) { json = { rawText: text }; }

  if (!resp.ok) {
    const err = new Error(`Generative API error ${resp.status}`);
    err.status = resp.status;
    err.responseBody = json;
    err.rawText = text;
    throw err;
  }
  return json;
}

async function callGenerate(prompt, modelId) {
  let attempts = 0;

  // Try primary model with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    attempts = attempt + 1;
    try {
      const json = await doCallGenerate(prompt, modelId, false);
      return { json, attempts, usedFallback: false };
    } catch (err) {
      const status = err && err.status ? err.status : null;
      const transient = !status || [429, 502, 503, 504].includes(status);

      if (!transient) {
        err.attempts = attempts;
        err.usedFallback = false;
        throw err;
      }

      const lastAttempt = attempt === MAX_RETRIES;
      const backoff = Math.min(10000, Math.round((BASE_DELAY_MS * Math.pow(2, attempt)) * (0.5 + Math.random() * 0.5)));
      console.warn(`[${nowIso()}] Transient error (status=${status}) attempt=${attempts}/${MAX_RETRIES + 1}. Backing off ${backoff}ms`);

      if (lastAttempt) break;
      await sleep(backoff);
    }
  }

  // Try fallback model
  if (FALLBACK_MODEL && FALLBACK_MODEL !== modelId) {
    try {
      console.log(`[${nowIso()}] Primary failed after ${attempts} attempts. Trying fallback: ${FALLBACK_MODEL}`);
      const json2 = await doCallGenerate(prompt, FALLBACK_MODEL, false);
      return { json: json2, attempts, usedFallback: true };
    } catch (err2) {
      if (err2 && (err2.status === 401 || err2.status === 403)) {
        try {
          console.warn(`[${nowIso()}] Fallback auth issue; retrying with key query param`);
          const json3 = await doCallGenerate(prompt, FALLBACK_MODEL, true);
          return { json: json3, attempts, usedFallback: true };
        } catch (err3) {
          err3.attempts = attempts;
          err3.usedFallback = true;
          throw err3;
        }
      }
      err2.attempts = attempts;
      err2.usedFallback = true;
      throw err2;
    }
  }

  const e = new Error('Model unavailable after retries');
  e.code = 'MODEL_UNAVAILABLE';
  e.attempts = attempts;
  e.usedFallback = false;
  throw e;
}

// ⭐ MAIN chat interface with circuit breaker
module.exports = {
  async chat(message, assignmentContext = null, conversationHistory = []) {
    console.log('🤖 Chatbot received:', message);

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return { success: false, message: 'Empty message', timestamp: nowIso() };
    }

    // Check circuit breaker FIRST
    if (circuitBreaker.isOpen()) {
      const status = circuitBreaker.getStatus();
      console.warn(`⚠️ Circuit breaker is OPEN. Cooldown: ${status.cooldownRemaining}s remaining`);
      const fallback = getSmartResponse(message, assignmentContext, 'circuit_open');
      return { 
        success: true, 
        message: fallback, 
        timestamp: nowIso(), 
        mode: 'circuit_breaker',
        circuitState: status
      };
    }

    // If no API key, fallback immediately
    if (!GOOGLE_API_KEY) {
      console.warn('⚠️ No Google API key found – using smart fallback');
      const fallback = getSmartResponse(message, assignmentContext);
      return { success: true, message: fallback, timestamp: nowIso(), mode: 'no_api_key' };
    }

    // Build prompt
    let prompt = `You are a helpful AI Study Assistant for students. Be encouraging, clear, and practical.`;
    if (assignmentContext) {
      prompt += `\n\nAssignment Context:\nTitle: ${assignmentContext.title}\nDescription: ${assignmentContext.description}\nDue Date: ${assignmentContext.due_date || 'N/A'}\nMax Marks: ${assignmentContext.maxMarks || 'N/A'}`;
    }
    if (Array.isArray(conversationHistory) && conversationHistory.length) {
      prompt += `\n\nConversation:\n${conversationHistory.map(m => `${m.sender}: ${m.text}`).join('\n')}`;
    }
    prompt += `\n\nStudent: ${message}\n\nAssistant:`;

    try {
      console.log('🌐 Calling Gemini model:', GENERATIVE_MODEL);
      
      // Attempt half-open if circuit was just reset
      if (circuitBreaker.failures > 0) {
        circuitBreaker.attemptHalfOpen();
      }
      
      const result = await callGenerate(prompt, GENERATIVE_MODEL);
      const genJson = result.json;
      const aiText = extractTextFromGenerateResponse(genJson);

      // ⭐ Record success in circuit breaker
      circuitBreaker.recordSuccess();

      if (aiText && aiText.trim()) {
        return {
          success: true,
          message: aiText.trim(),
          timestamp: nowIso(),
          mode: 'generative_api',
          attempts: result.attempts,
          usedFallback: result.usedFallback
        };
      } else {
        const fallbackText = getSmartResponse(message, assignmentContext);
        return {
          success: true,
          message: fallbackText,
          timestamp: nowIso(),
          mode: 'smart_assistant',
          attempts: result.attempts,
          usedFallback: result.usedFallback,
          error: 'no_text'
        };
      }
    } catch (err) {
      // ⭐ Record failure in circuit breaker
      circuitBreaker.recordFailure();
      
      console.error('❌ Gemini API Error:', err.message);
      if (err.responseBody) {
        console.error('Response:', util.inspect(err.responseBody, { depth: 2 }));
      }

      const fallback = getSmartResponse(message, assignmentContext);
      return {
        success: true,
        message: fallback,
        timestamp: nowIso(),
        mode: 'smart_assistant',
        error: err.message || String(err),
        attempts: err.attempts || undefined,
        usedFallback: err.usedFallback || undefined,
        circuitState: circuitBreaker.getStatus()
      };
    }
  },

  // ⭐ NEW: Get circuit breaker status
  getCircuitStatus() {
    return circuitBreaker.getStatus();
  },

  // ⭐ NEW: Manually reset circuit breaker (admin endpoint)
  resetCircuit() {
    circuitBreaker.reset();
    return { success: true, message: 'Circuit breaker reset' };
  },

  // Test API key
  async testKey() {
    if (circuitBreaker.isOpen()) {
      return { 
        success: false, 
        error: 'Circuit breaker is open', 
        circuitState: circuitBreaker.getStatus() 
      };
    }

    const prompt = 'Say "Hello! API key is working."';
    try {
      const result = await callGenerate(prompt, GENERATIVE_MODEL);
      const aiText = extractTextFromGenerateResponse(result.json);
      circuitBreaker.recordSuccess();
      return { 
        success: true, 
        message: aiText, 
        attempts: result.attempts, 
        usedFallback: result.usedFallback 
      };
    } catch (err) {
      circuitBreaker.recordFailure();
      return { 
        success: false, 
        error: err.message || String(err), 
        attempts: err.attempts || undefined, 
        usedFallback: err.usedFallback || undefined,
        circuitState: circuitBreaker.getStatus()
      };
    }
  }
};