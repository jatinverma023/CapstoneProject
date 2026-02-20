// chatbotService.js - Production Ready Academic AI Assistant
require('dotenv').config();
const fetch = require('node-fetch');
const util = require('util');

/* ================= CONFIG ================= */

const GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  null;

const GENERATIVE_MODEL =
  process.env.GENERATIVE_MODEL || 'gemini-2.5-flash';

const FALLBACK_MODEL =
  process.env.FALLBACK_MODEL || null;

const API_BASE =
  process.env.GENERATIVE_API_BASE ||
  'https://generativelanguage.googleapis.com/v1beta';

const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3);
const BASE_DELAY_MS = Number(process.env.BASE_DELAY_MS || 500);

/* ================= CIRCUIT BREAKER ================= */

const circuitBreaker = {
  failures: 0,
  lastFailureTime: null,
  threshold: 3,
  timeout: 60000,
  halfOpenAttempts: 0,
  maxHalfOpenAttempts: 1,

  isOpen() {
    if (this.failures >= this.threshold) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed < this.timeout) return true;
      if (this.halfOpenAttempts < this.maxHalfOpenAttempts) return false;
      return true;
    }
    return false;
  },

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.halfOpenAttempts = 0;
  },

  recordSuccess() {
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
      const elapsed = Date.now() - this.lastFailureTime;
      return {
        state: 'OPEN',
        failures: this.failures,
        cooldownRemaining: Math.ceil(
          Math.max(0, this.timeout - elapsed) / 1000
        ),
      };
    }
    return { state: 'CLOSED', failures: this.failures };
  },
};

/* ================= HELPERS ================= */

function nowIso() {
  return new Date().toISOString();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ================= SMART FALLBACK ================= */

function getSmartResponse(message, assignmentContext, reason = null) {
  const lower = (message || '').toLowerCase();

  if (reason === 'circuit_open') {
    const status = circuitBreaker.getStatus();
    return `
⏳ AI engine is stabilizing (~${status.cooldownRemaining}s).

Meanwhile, I can still guide you step-by-step.

${getContextualHelp(assignmentContext)}
`;
  }

  if (lower.includes('start') || lower.includes('begin')) {
    return `
To start this assignment:

1. Read requirements carefully
2. Break into smaller tasks
3. Identify required concepts
4. Build step-by-step
5. Test incrementally

Which part are you stuck on?
`;
  }

  return getContextualHelp(assignmentContext);
}

function getContextualHelp(assignmentContext) {
  if (assignmentContext) {
    return `
I’m here to help with **"${assignmentContext.title}"**.

I can assist with:
• Understanding requirements
• Breaking into steps
• Coding logic
• Study strategies

What specific part do you need help with?
`;
  }

  return `
I’m your AI Study Assistant 🎓

I can help with:
• Assignment guidance
• Coding help
• Concept explanations
• Study tips

What would you like help with?
`;
}

/* ================= GEMINI CALL ================= */

async function doCallGenerate(prompt, modelId) {
  if (!GOOGLE_API_KEY) {
    const e = new Error('Missing GOOGLE_API_KEY');
    e.code = 'NO_CREDENTIAL';
    throw e;
  }

  let modelPath = modelId.startsWith('models/')
    ? modelId
    : `models/${modelId}`;

  const url = `${API_BASE}/${modelPath}:generateContent`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.6,
      topP: 0.9,
      maxOutputTokens: 800,
    },
  };

  const headers = {
    'Content-Type': 'application/json',
    'x-goog-api-key': GOOGLE_API_KEY,
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  const text = await resp.text();
  const json = text ? JSON.parse(text) : {};

  if (!resp.ok) {
    const err = new Error(`API Error ${resp.status}`);
    err.status = resp.status;
    err.responseBody = json;
    throw err;
  }

  return json;
}

function extractText(json) {
  try {
    return (
      json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
    );
  } catch {
    return null;
  }
}

async function callGenerate(prompt, modelId) {
  let attempts = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    attempts = attempt + 1;
    try {
      const json = await doCallGenerate(prompt, modelId);
      return { json, attempts, usedFallback: false };
    } catch (err) {
      const status = err.status;
      const transient =
        !status || [429, 502, 503, 504].includes(status);

      if (!transient) throw err;

      if (attempt === MAX_RETRIES) break;

      const backoff = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(backoff);
    }
  }

  if (FALLBACK_MODEL) {
    const json = await doCallGenerate(prompt, FALLBACK_MODEL);
    return { json, attempts, usedFallback: true };
  }

  throw new Error('Model unavailable');
}

/* ================= MAIN CHAT FUNCTION ================= */

module.exports = {
  async chat(message, assignmentContext = null, conversationHistory = []) {
    if (!message || !message.trim()) {
      return { success: false, message: 'Empty message' };
    }

    if (circuitBreaker.isOpen()) {
      const fallback = getSmartResponse(
        message,
        assignmentContext,
        'circuit_open'
      );
      return {
        success: true,
        message: fallback,
        mode: 'circuit_breaker',
        timestamp: nowIso(),
      };
    }

    if (!GOOGLE_API_KEY) {
      const fallback = getSmartResponse(message, assignmentContext);
      return {
        success: true,
        message: fallback,
        mode: 'no_api_key',
        timestamp: nowIso(),
      };
    }

    /* ================= SMART ASSIGNMENT DETECTION ================= */

    let isAssignmentRelated = false;

    if (assignmentContext) {
      const msgLower = message.toLowerCase();

      const assignmentKeywords = [
        "assignment",
        "requirement",
        "rubric",
        "marks",
        "word",
        "deadline",
        assignmentContext.title?.toLowerCase(),
      ];

      isAssignmentRelated = assignmentKeywords.some(
        (keyword) =>
          keyword && msgLower.includes(keyword)
      );
    }

    /* ================= CREATIVE TASK DETECTION ================= */

    const isCreativeTask =
      assignmentContext &&
      /poem|essay|story|paragraph|speech|letter/i.test(
        assignmentContext.description || assignmentContext.title
      );

    /* ================= BUILD PROMPT ================= */

    let prompt = `
You are an intelligent AI Academic Assistant.

Rules:
- If question is about the assignment, use assignment context carefully.
- If question is unrelated, ignore assignment details.
- Be clear and helpful.
`;

    // Inject assignment ONLY if related
    if (assignmentContext && isAssignmentRelated) {
      prompt += `

=== CURRENT ASSIGNMENT ===
Title: ${assignmentContext.title}
Description: ${assignmentContext.description}
Due Date: ${assignmentContext.due_date || 'N/A'}
Max Marks: ${assignmentContext.maxMarks || 'N/A'}
===========================
`;
    }

    // Creative rule
    if (isCreativeTask && isAssignmentRelated) {
      prompt += `
Important:
If this is a creative writing task, return ONLY the final creative content.
Do NOT add explanation.
Do NOT add analysis.
Do NOT add reflections.
`;
    }

    // Conversation history
    if (conversationHistory?.length) {
      prompt += `
=== CONVERSATION HISTORY ===
${conversationHistory
        .slice(-6)
        .map(
          (m) =>
            `${m.sender === 'user' ? 'Student' : 'Assistant'}: ${m.text}`
        )
        .join('\n')}
============================
`;
    }

    prompt += `

Student Question:
${message}

Provide response:
`;

    try {
      if (circuitBreaker.failures > 0) {
        circuitBreaker.attemptHalfOpen();
      }

      console.log("Using model:", GENERATIVE_MODEL);

      const result = await callGenerate(prompt, GENERATIVE_MODEL);
      const aiText = extractText(result.json);

      circuitBreaker.recordSuccess();

      if (aiText) {
        return {
          success: true,
          message: aiText,
          mode: 'generative_api',
          timestamp: nowIso(),
        };
      }

      const fallback = getSmartResponse(message, assignmentContext);
      return {
        success: true,
        message: fallback,
        mode: 'smart_assistant',
        timestamp: nowIso(),
      };
    } catch (err) {
      console.log("❌ Gemini Error:", err.status, err.message);
      console.log("❌ Gemini Response:", err.responseBody);

      circuitBreaker.recordFailure();

      const fallback = getSmartResponse(message, assignmentContext);
      return {
        success: true,
        message: fallback,
        mode: 'fallback',
        error: err.message,
        timestamp: nowIso(),
      };
    }
  },

  getCircuitStatus() {
    return circuitBreaker.getStatus();
  },

  resetCircuit() {
    circuitBreaker.reset();
    return { success: true };
  },
};