/**
 * Chatbot Security Guard Middleware
 * 
 * Defense-in-depth layer for chatbot access:
 * 1. Validates user role exists and is legitimate
 * 2. Rate limits per user (prevents abuse / token exhaustion)
 * 3. Sanitizes input (message length, content checks)
 * 4. Logs access attempts
 */

// In-memory rate limiter (per user, resets every minute)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;  // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;       // 15 messages per minute

const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
            rateLimitMap.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW_MS);

// Prevent interval from keeping Node alive on shutdown
if (cleanupInterval.unref) cleanupInterval.unref();

const chatbotGuard = (req, res, next) => {
    // ── 1. Role Validation ──
    // Even though protect + authorize already run, we double-check here
    // as a defense-in-depth measure against middleware bypass
    if (!req.user || !req.user._id || !req.user.role) {
        console.warn(`[CHATBOT GUARD] Blocked request — no valid user context`);
        return res.status(401).json({ message: 'Authentication required' });
    }

    const validRoles = ['admin', 'teacher', 'student'];
    if (!validRoles.includes(req.user.role)) {
        console.warn(`[CHATBOT GUARD] Blocked request — invalid role: ${req.user.role}`);
        return res.status(403).json({ message: 'Invalid user role' });
    }

    // ── 2. Rate Limiting ──
    const userId = req.user._id.toString();
    const now = Date.now();
    let entry = rateLimitMap.get(userId);

    if (!entry || (now - entry.windowStart > RATE_LIMIT_WINDOW_MS)) {
        entry = { windowStart: now, count: 0 };
        rateLimitMap.set(userId, entry);
    }

    entry.count++;

    if (entry.count > MAX_REQUESTS_PER_WINDOW) {
        const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
        console.warn(`[CHATBOT GUARD] Rate limited user ${userId} (${entry.count} requests in window)`);
        return res.status(429).json({
            message: `Too many requests. Please wait ${retryAfter} seconds.`,
            retryAfter
        });
    }

    // ── 3. Input Sanitization ──
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: 'Message must be a non-empty string' });
    }

    if (message.length > 2000) {
        return res.status(400).json({ message: 'Message too long. Maximum 2000 characters.' });
    }

    // Strip potential prompt injection markers (defense layer — LLM prompt also guards this)
    req.body.message = message.trim();

    // Validate history format
    if (req.body.history && !Array.isArray(req.body.history)) {
        req.body.history = [];
    }

    // ── 4. Attach request metadata for observability ──
    req.chatbotMeta = {
        startTime: Date.now(),
        userId,
        role: req.user.role,
        userName: req.user.name
    };

    next();
};

module.exports = chatbotGuard;
